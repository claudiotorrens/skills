---
name: timehe
description: 时间之河时间胶囊 — 用 AI 陪你每日记录，把真实的自己慢慢封存，在约定的日期送给最重要的人。支持登录、创建胶囊、回答今日问题、查看进度。
homepage: https://www.timehe.com
user-invocable: true
metadata: {"openclaw":{"emoji":"⏳","os":["darwin","linux","win32"],"requires":{"bins":["curl"]},"primaryEnv":"TIMEHE_TOKEN"}}
---

# 时间之河 · 时间胶囊

**时间之河**（www.timehe.com）是一个 AI 时间胶囊服务：你每天回答一个 AI 提出的深度问题，答案经过润色后封存进胶囊，在你设定的日期解锁，送给最重要的人。

通过这个 skill，你可以在 OpenClaw 里完成所有核心操作，无需打开浏览器。

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `TIMEHE_TOKEN` | 你的登录 token（首次使用运行 `/timehe login` 获取） |

**如何配置：**
在 `~/.openclaw/openclaw.json` 里添加：
```json
{
  "skills": {
    "entries": {
      "timehe": {
        "env": { "TIMEHE_TOKEN": "你的token" }
      }
    }
  }
}
```

---

## 命令总览

用户可以用自然语言触发，或直接说：

| 意图 | 示例说法 |
|------|----------|
| 登录 | `/timehe login`、"登录时间之河"、"帮我登录 timehe" |
| 今日问答 | `/timehe today`、"今天的问题是什么"、"我要回答今天的问题" |
| 创建胶囊 | `/timehe new`、"创建一个新胶囊"、"我要新建胶囊" |
| 查看胶囊 | `/timehe list`、"我的胶囊列表"、"查看我的胶囊" |
| 胶囊进度 | `/timehe status`、"胶囊完成了多少"、"查看进度" |
| 注册账号 | `/timehe register`、"我要注册时间之河" |

---

## 工作流程

### 前置检查

每次执行任何操作前，先检查 `TIMEHE_TOKEN` 是否已设置（`env.TIMEHE_TOKEN` 或 shell 里 `echo $TIMEHE_TOKEN`）。
如果未设置，提示用户先执行登录流程。

---

### `/timehe login` — 登录

1. 询问用户邮箱和密码（如果没有提供）
2. 调用登录接口：
```bash
curl -sL -X POST "https://www.timehe.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"<邮箱>","password":"<密码>"}'
```
3. 从响应中提取 `access_token`
4. 告诉用户将 token 写入配置文件的具体方法（见上方环境变量说明）
5. 也可以在当前 shell session 里临时设置：`export TIMEHE_TOKEN=<token>`
6. 显示登录的用户名（响应里的 `user.name`）

**成功响应示例：**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {"id": "...", "email": "user@example.com", "name": "小明", "tier": "free"}
}
```

---

### `/timehe register` — 注册

1. 询问用户：昵称、邮箱、密码
2. 调用注册接口：
```bash
curl -sL -X POST "https://www.timehe.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"<昵称>","email":"<邮箱>","password":"<密码>"}'
```
3. 注册成功后自动获得 token，引导用户保存配置（同登录流程）

---

### `/timehe list` — 查看我的胶囊

```bash
curl -sL "https://www.timehe.com/api/capsules" \
  -H "Authorization: Bearer $TIMEHE_TOKEN"
```

格式化展示每颗胶囊：
- 标题、写给谁（关系）
- 已完成 / 总题数（进度百分比）
- 状态（记录中 / 已封存 / 已开启）
- 解锁日期

如果列表为空，鼓励用户创建第一颗胶囊。

---

### `/timehe new` — 创建新胶囊

交互式收集信息（每次一个问题，不要一次问所有）：

1. **胶囊标题**（例如：给女儿二十岁的礼物）
2. **收信人名字**
3. **你们的关系**（女儿 / 儿子 / 伴侣 / 父母 / 挚友 / 自己 / 其他）
4. **解锁日期**（格式：YYYY-MM-DD，默认一年后）
5. **开篇寄语**（可选，写给收信人看到胶囊时的第一句话）
6. **收信人邮箱**（可选，届时发送解锁通知）

收集完毕后展示摘要让用户确认，然后提交：

```bash
curl -sL -X POST "https://www.timehe.com/api/capsules" \
  -H "Authorization: Bearer $TIMEHE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<标题>",
    "recipient_name": "<收信人>",
    "recipient_relationship": "<关系>",
    "unlock_at": "<日期>T00:00:00Z",
    "intro_message": "<开篇寄语>",
    "recipient_email": "<邮箱>"
  }'
```

成功后：
- 告知胶囊创建成功
- 显示胶囊 ID 和解锁日期
- 提示用户现在可以用 `/timehe today` 回答第一个问题

---

### `/timehe today` — 今日问答（核心功能）

这是最重要的日常操作。

**Step 1：获取今日问题**

如果用户没有指定胶囊，先列出所有 `active` 状态的胶囊让用户选择。

```bash
curl -sL "https://www.timehe.com/api/capsules/<capsule_id>/today" \
  -H "Authorization: Bearer $TIMEHE_TOKEN"
```

响应包含：
- `question_text`：今日问题（已将 `{recipient}` 替换为收信人姓名）
- `already_answered`：今天是否已经回答过
- `category`：问题分类
- `depth_level`：深度等级

**如果 `already_answered: true`：**
告诉用户今天已经回答过了，明天再来。显示已回答的问题。

**如果 `already_answered: false`：**
以温暖的语气展示问题，例如：

```
今天的问题是：

  「{question_text}」

请用几句话或几段文字回答，越真实越好。
没有标准答案，写你脑海里第一个想到的就好。
```

**Step 2：收集用户回答**

等待用户输入。如果用户的回答很短（少于 20 字），温柔地询问是否想多说几句，但不强制。

**Step 3：提交答案**

```bash
curl -sL -X POST "https://www.timehe.com/api/capsules/<capsule_id>/entries" \
  -H "Authorization: Bearer $TIMEHE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"raw_answer": "<用户的原始回答>"}'
```

**Step 4：展示 AI 润色结果**

响应里的 `polished_text` 是 AI 润色后的版本。以优美的方式展示：

```
✦ 已封存进胶囊

AI 为你润色后的版本：

  「{polished_text}」

这是第 N 条记录。继续加油，胶囊正在慢慢生长。
```

如果是第 1 条，说"🌱 种下了第一颗种子"；第 7 条说"✨ 坚持了整整一周"；第 30 条说"🌙 一个月了，了不起"。

---

### `/timehe status` — 查看进度

如果用户没有指定胶囊，列出所有胶囊并让用户选择，或展示所有胶囊的进度摘要。

```bash
curl -sL "https://www.timehe.com/api/capsules/<capsule_id>" \
  -H "Authorization: Bearer $TIMEHE_TOKEN"
```

展示：
- 胶囊标题和收信人
- 进度条（例如：████░░░░░░ 42%）
- 已完成 / 总数
- 按分类的分布（关于我 / 关于爱 / 遗憾与成长 等）
- 距解锁还有多少天
- 鼓励性语句

---

## API 参考

**Base URL：** `https://www.timehe.com/api`

| 接口 | 说明 |
|------|------|
| `POST /auth/register` | 注册 |
| `POST /auth/login` | 登录，获取 token |
| `GET /auth/me` | 当前用户信息 |
| `GET /capsules` | 我的胶囊列表 |
| `POST /capsules` | 创建胶囊 |
| `GET /capsules/{id}` | 胶囊详情（含 entries） |
| `GET /capsules/{id}/today` | 今日问题 |
| `POST /capsules/{id}/entries` | 提交今日回答 |
| `GET /capsules/{id}/entries` | 所有回答记录 |
| `PATCH /capsules/{id}/public` | 切换公开状态 |

---

## 错误处理

| HTTP 状态 | 含义 | 处理方式 |
|-----------|------|----------|
| 401 | token 失效或未登录 | 提示用户重新运行 `/timehe login` |
| 400 | 今日已回答 / 缺少待回答问题 | 友好提示，说明原因 |
| 404 | 胶囊不存在 | 提示检查胶囊 ID |
| 422 | 提交数据格式错误 | 显示具体错误字段 |
| 500 | 服务器错误 | 提示稍后重试，附上错误信息 |

---

## 语气与风格

- 使用温暖、有情感的中文语气
- 不要用"请问"、"好的我来帮您"这种机械客服语气
- 回答展示时要有仪式感，让用户感受到"今天的记录被好好收藏了"
- 鼓励但不催促，尊重用户的节奏
