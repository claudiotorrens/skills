---
name: feishu-at-mention
slug: feishu-at-mention
description: 飞书富文本@提及功能。使用 message 工具发送飞书消息时，在 message 参数中使用 at id 自闭合标签格式（注意是 id 不是 user_id，且标签内无内容），飞书扩展会自动转换为富文本消息，触发真正的@通知效果（高亮、弹窗、有人@我）。
version: 0.0.1
---

# 飞书 @ 提及技能

## 核心规则

使用 `message` 工具发送飞书消息时，**在 message 参数中直接使用 `<at id="ou_xxx"></at>` 自闭合标签格式**，飞书扩展会自动将其转换为富文本消息，触发真正的@通知效果。

## 正确的富文本@格式

### 正确格式（会触发@通知）

```
<at id="ou_xxxxxxxx"></at> 你好，这是消息内容。
```

### 关键特征

- ✅ 使用 `id` 属性（不是 `user_id`）
- ✅ 自闭合标签（标签内无内容）
- ✅ 标签后紧跟消息内容

### message 工具调用示例

```json
{
  "action": "send",
  "channel": "feishu",
  "message": "<at id=\"ou_xxxxxxxx\"></at> 你好！"
}
```

### 效果

- ✅ 被@的用户会看到高亮显示
- ✅ 会收到"有人@我"的通知
- ✅ 飞书客户端显示为 "@用户名"
- ✅ 点击通知可跳转到消息位置

## 使用方法

### 1. 获取 open_id

从对话元数据中获取（可信）：
- `sender_id`: 发送者的 open_id（格式：`ou_xxxxxxxx`）

或从群成员列表获取：
```bash
feishu_chat action=members chat_id=<群聊 ID> member_id_type="open_id"
```

### 2. 直接在 message 中使用@格式

```
<at id="ou_xxxxxxxx"></at> 消息内容
```

**注意：** 
- 不需要设置 `mimeType`
- 不需要 JSON 转义
- 直接写在 `message` 参数中即可

## 示例

### 示例 1: @单人

```json
{
  "action": "send",
  "channel": "feishu",
  "message": "<at id=\"ou_xxxxxxxx\"></at> 请确认一下这个方案。"
}
```

### 示例 2: @多人

```json
{
  "action": "send",
  "channel": "feishu",
  "message": "<at id=\"ou_abc123\"></at> <at id=\"ou_def456\"></at> 大家好，这是项目更新。"
}
```

### 示例 3: @后换行

```json
{
  "action": "send",
  "channel": "feishu",
  "message": "<at id=\"ou_xxxxxxxx\"></at>\n\n这是新的一段内容，详细说明如下..."
}
```

### 示例 4: 带上下文的@

```json
{
  "action": "send",
  "channel": "feishu",
  "message": "<at id=\"ou_xxxxxxxx\"></at> 你说得对，我已经按照你的建议修改了方案。\n\n主要改动：\n- 优化了登录流程\n- 增加了错误处理\n- 添加了日志记录\n\n请过目～"
}
```

## open_id 记录模板

你可以在技能或记忆中维护一个 open_id 记录表：

| 用户/角色 | open_id |
|-----------|---------|
| 示例用户 | ou_xxxxxxxx |

（根据实际团队成员更新此表）

## 注意事项

1. **属性名是 `id`**：不是 `user_id`，是 `id`
2. **自闭合标签**：`<at id="xxx"></at>` 标签内无内容
3. **open_id 格式**：以 `ou_` 开头
4. **不要混用**：不要在一条消息中混用纯文本@和富文本@
5. **位置灵活**：@可以在消息开头、中间或结尾
6. **不需要 mimeType**：直接使用 `message` 参数
7. **不需要 JSON 转义**：直接在 message 字符串中写@标签

## 何时使用此技能

- 在飞书群聊中回复并需要@特定成员时
- 需要确保飞书正确解析@提及并发送通知时
- 需要@多人或@特定角色时
- 需要触发"有人@我"通知时

## 错误示例（不要用）

❌ 纯文本@（飞书不会解析）：
```json
{
  "message": "@vision 你好"
}
```

❌ 错误的属性名 `user_id`：
```json
{
  "message": "<at user_id=\"ou_xxx\">name</at> 你好"
}
```

❌ 错误的 JSON post 格式（会显示为文本）：
```json
{
  "message": "{\"post\":{\"zh_cn\":{\"content\":[[{\"tag\":\"at\",\"user_id\":\"ou_xxx\"}]]}}}",
  "mimeType": "application/json"
}
```

❌ 标签内有内容（应该自闭合）：
```json
{
  "message": "<at id=\"ou_xxx\">vision</at> 你好"
}
```

这些格式无法触发飞书的@通知效果！

## 技术原理

飞书扩展的 `sendMessageFeishu` 函数会自动检测消息中的 `<at id="..."></at>` 格式，并将其转换为飞书 API 的富文本消息，从而触发真正的@通知效果。

飞书客户端收到后会将 `<at id="ou_xxx"></at>` 渲染显示为 "@用户名" 的格式。
