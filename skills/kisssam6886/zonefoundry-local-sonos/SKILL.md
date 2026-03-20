---
name: zf-local-sonos
description: Use this skill when a user wants an OpenClaw/local agent/bot to control Sonos through `zf` on a machine inside the same LAN. It covers first-run Sonos readiness checks, runtime update checks, default-room setup, service-readiness probing, safe command mapping, and failure routing for playback, queue recovery, and helper-room rebuild.
metadata: {"openclaw":{"emoji":"🔊","homepage":"https://github.com/kisssam6886/zonefoundry","requires":{"bins":["zf"]},"install":[{"id":"go-build","kind":"go","module":"github.com/kisssam6886/zonefoundry/cmd/zf@latest","bins":["zf"],"label":"Install ZoneFoundry CLI (Go)"}]}}
---

# ZoneFoundry Local Sonos

Use this skill when the user is asking a local agent or bot to:

- connect to Sonos for the first time
- check whether Sonos control is ready
- play, pause, skip, change volume, or inspect status
- add songs to current queue without interrupting playback
- control Sonos and linked music services through `zf`
- manage queue (list, reorder, remove, prune grey tracks)
- recover from queue or transport pollution

Do not use this skill for:

- Sonos account setup UX inside the official Sonos app
- billing, cloud relay, or hosted bot product logic
- arbitrary natural-language chat unrelated to Sonos control

## Core rule

Treat `zf` as the execution layer.

Layering must stay:

`bot / agent / web onboarding` -> `zf` -> `Sonos`

The bot/agent translates intent and explains results.
`zf` does discovery, playback, queueing, diagnostics, and recovery.

## First-run flow

When the user mentions Sonos for the first time, or says things like:

- "帮我连接 Sonos"
- "帮我喺 Sonos 播歌"
- "你可唔可以控制我个 Sonos"
- "检查下 Sonos 用唔用到"

do not immediately answer with a generic "未配置".

**推荐顺序**：

1. 如果 `zf update self` 可用，先检查 runtime 是否需要升级：

```bash
zf update self --check --format json
```

如果返回 `status=update_available`，先执行：

```bash
zf update self --format json
```

2. 再用 `zf setup` 做 Sonos readiness 检查：

```bash
zf setup --format json
```

这条命令会自动检查：speaker 发现 → default room → 服务列表 + 认证状态 → default service → 总结。
返回 JSON 包含 `steps` 数组，每步有 `status`（ok/warn/fail）和 `action`（建议命令）。

如果 `zf setup` 不可用（旧版本），手动 preflight：

1. Verify `zf` is available.
2. If `zf update self` exists, run `zf update self --check --format json` and update first when `status=update_available`.
3. Run `zf doctor --format json`.
4. Run `zf discover --format json`.
5. If rooms are found, check `zf config get defaultRoom`.
6. If no default room is set, ask the user to choose one visible room.
7. Run `zf service list --format json` to check available services and auth status.
8. If the user mentions a music service, check service visibility/readiness before claiming playback is ready.

## Environment gate

Before promising bot control, confirm there is an always-on local node in the same LAN as Sonos.

Valid nodes:

- Mac or Windows PC
- NAS
- mini PC
- Raspberry Pi
- Docker host

If the user only has a phone:

- explain that Sonos official mobile apps can add/login music services
- do not promise persistent local bot control
- do not pretend a phone alone is an always-on local agent

## Minimum preflight commands

Use JSON by default. Prefer `zf setup` for one-shot diagnostics:

```bash
zf setup --format json                    # 一条搞定全部检查（推荐）
zf update self --check --format json     # 先看 runtime 要不要升级
```

或者逐步检查：

```bash
zf doctor --format json
zf discover --format json
zf config get defaultRoom
zf service list --format json             # 服务列表 + 认证状态
zf config get defaultService              # 默认音乐服务
```

If the user already specified a room, prefer `--name "<room>"` in later commands.

## Default room behavior

If there is no default room:

- ask only for one room choice
- after the user chooses, set it once

```bash
zf config set defaultRoom "客厅"
```

## Default service behavior

If there is no default service:

- run `zf service list --format json` to see available services
- ask user which service they primarily use
- set it once

```bash
zf config set defaultService "QQ音乐"
```

### ⚠️ `service list` 状态说明

`zf service list` 里最该看的字段是 `tokenReady`：

- `tokenReady=yes`：ZoneFoundry 本地已经有可用 token，可以直接继续做 `play music` / `smapi search`
- `tokenReady=no`：ZoneFoundry 本地还没有 token，**这不等于 Sonos App 一定没登录**
- `linked` 只是保守提示，不是权威 Sonos 账户状态

正确做法：
1. **永远不要仅凭 `service list` 里的某个字段就告诉用户"未 linked"并拒绝操作**
2. 如果要判断某个服务是否真的可播，优先跑：
   `zf doctor service --service "QQ音乐" --query "郑秀文" --format json`
3. 如果 `doctor service` 返回 `tokenReady=false`，说明 ZoneFoundry 缺本地 token：
   先走 `zf auth smapi begin --service "QQ音乐"`，再按提示跑 `zf auth smapi complete`
4. 如果 `tokenReady=true` 但 probe 仍失败，再根据 `doctor service` 的 `nextAction` 和错误信息判断是否是 Sonos-side link / provider-side 问题
5. 如果 `pendingLink=true` 或 `nextAction=complete_link`：
   **不要重头 begin，也不要当成"未 linked"。**
   直接跑：
   `zf auth smapi complete --service "QQ音乐" --wait 2m --format json`
   现在 CLI 会尝试从本机 pending auth 里恢复上一次 begin 的 linkCode

### ⚠️ 新窗口 / `/new` 规则

- 新 session 可以丢失“上一轮对话上下文”，但不应该丢失这台主机上 `zf` 的能力判断
- 如果用户刚做完网页登录回来，说：
  - “已经绑好啦”
  - “done”
  - “complete”
  - “我登录好了”
- 不要先问“你是谁 / 你想做什么 / 你要用什么服务”
- 优先按刚才的服务继续跑：
  `zf auth smapi complete --service "<service>" --wait 2m --format json`
- 如果服务名不确定，再跑：
  `zf setup --format json`
  或
  `zf auth smapi status --service "QQ音乐" --probe-query "郑秀文" --format json`
- 只要看到 `pendingLink=true` / `nextAction=complete_link`，下一步就是 complete，不是重新 onboarding

After room + service are set, allow simple requests:

- "暂停"
- "下一首"
- "播郑秀文" → `zf play music "郑秀文"`
- "播周杰伦的歌" → `zf play music "周杰伦"`
- "再加一首陈奕迅" → `zf play music "陈奕迅" --enqueue` ⚠️ 注意 --enqueue
- "帮我加几首 Adele 的歌" → `zf play music "Adele" --enqueue --limit <count>`
- "帮我 +5 首郑秀文" / “加 5 首郑秀文” → `zf play music "郑秀文" --enqueue --limit 5`
- "看下队列" → `zf queue list`
- "删掉第 3 首" → `zf queue remove 3`

## Safe command mapping

For machine-readable agent routing, `execute` is acceptable when the action maps cleanly.
For user-facing explanations and examples, prefer the direct CLI command names.

Examples:

```bash
zf execute --data '{"action":"status","target":{"room":"客厅"}}'
zf execute --data '{"action":"pause","target":{"room":"客厅"}}'
zf execute --data '{"action":"next","target":{"room":"客厅"}}'
zf execute --data '{"action":"volume.set","target":{"room":"客厅"},"request":{"volume":20}}'
```

For music playback, prefer the unified `play music` command:

```bash
# 统一播放入口（清空队列并播放，自动使用 defaultService）
zf play music "周杰伦" --format json
zf play music "Taylor Swift" --service Spotify --format json

# 追加到队列（不打断当前播放！用户说"加歌"/"追加"/"再来一首"时必须用这个）
zf play music "郑秀文" --enqueue --format json
zf play music "陈奕迅" --enqueue --limit 5 --format json

# 队列管理
zf queue list --format json            # 查看当前队列
zf queue play 3                         # 播放队列中第 3 首
zf queue remove 5                       # 删除队列中第 5 首
zf queue prune --format json            # 清理灰色/不可播的歌曲

# 服务专用快捷命令（保留兼容）
zf ncm lucky --name "客厅" "郑秀文" --format json
zf ncm play --name "客厅" "周杰伦" --format json
zf play spotify "Taylor Swift" --format json

# 其他
zf smapi search --service "QQ音乐" --category tracks --open --index 1 --format json "周杰伦"
zf announce "<text>" --name "<room>" --mode queue-insert --format json
```

### 播放命令选择指南

- 用户说 "播放周杰伦"：`zf play music "周杰伦"`。清空队列并开始播放搜索结果。
- 用户说 "再加一首郑秀文" / "加歌" / "追加"：`zf play music "郑秀文" --enqueue`。不会打断当前播放，只会追加到队列末尾。
- 用户说 "加几首陈奕迅的歌"：`zf play music "陈奕迅" --enqueue --limit 5`。追加多首到队列。
- 用户说 "用网易云播放"：`zf play music "..." --service "网易云音乐"` 或 `zf ncm play "..."`。
- 用户说 "用 Spotify 播"：`zf play music "..." --service Spotify`。
- 用户说 "帮我清理灰色歌曲"：`zf queue prune`。
- 用户说 "看下队列"：`zf queue list --format json`。
- 用户说 "播第 3 首"：`zf queue play 3`。
- 用户说 "删掉第 5 首"：`zf queue remove 5`。
- 用户说 "设个闹钟"：`zf alarm add --time "07:00"`。
- 用户说 "30分钟后关掉"：`zf sleep set 30m`。

### ⚠️ 关键区分：播放 vs 加歌

- **用户说"播放 XX"**：用 `zf play music "XX"` — 这会**清空**当前队列并播放新内容
- **用户说"加一首 XX" / "再来一首" / "追加" / "帮我加"**：**必须**用 `zf play music "XX" --enqueue` — 这**不会**打断当前播放
- **判断不清时**：如果已有歌曲在播放，默认用 `--enqueue` 更安全

### 新闻 / 插播规则

- 用户说“插播一条新闻” / “播一分钟国际新闻” / “来一段新闻简报”：
  默认理解为**短 TTS 插播**，不是电台搜索
- 正确路径：
  1. 先生成或整理一段简短文本
  2. 再调用：
     `zf announce "<text>" --name "<room>" --mode queue-insert --format json`
- 用户说“半小时后提醒我饮酒” / “20 分钟后叫我开会”：
  这也是变量化提醒，不应该写死文案或时间
  上层应把 `<delay>` / `<text>` 解析出来，再交给 reminder / schedule 编排层
- **不要**默认去搜 TuneIn / 电台 / BBC / CNN
- 只有当用户明确说“播 BBC News 电台”/“听直播台”/“开 TuneIn 新闻台”时，才把它当成 live station / radio 请求

### 不该做的事

- 不要因为普通 Sonos 播放请求就向用户索取 `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`
- 对于 QQ 音乐 / 网易云 / Apple Music / YouTube Music / Spotify 这类 Sonos 已支持服务，优先走：
  `zf play music ...`
  `zf smapi search ...`
  `zf auth smapi begin|complete|status ...`
- `play spotify` 是较窄的专用途径，不是默认 onboarding 路线
- `加 N 首` 是稳定变量能力；`插到当前后面 N 首` 不是同一个语义，若无明确支持，不要假装已经有

## Known boundaries

- Sonos official app is still the default path for adding/logging in to QQ Music / NetEase Cloud Music on Sonos.
- `zf service list` 优先看 `tokenReady`，不要把 `linked` 当成权威 Sonos 账户状态。
- `queue-insert` is the current stable insert/announcement path.
- `RelTime` exact restore is not a formal stable capability.
- `group rebuild` is a recovery tool, not proof that the original defect is fixed.
- OpenClaw skill changes and host `zf` runtime changes may take a new session to fully refresh.

## Failure routing

Read structured JSON errors first:

- `error.code`
- `error.message`
- `error.details`

Do not classify every playback failure as auth or copyright.

Known cases:

- Same song plays in helper room but not in target room:
  classify as room-local queue/transport pollution first.
- `TRANSITIONING` / partial queue failure:
  do not loop infinite retries.
- Queue appears polluted:
  soft recovery can be "clear and rebuild queue".
- If deeper room-local pollution is confirmed:
  `group rebuild --name "<target>" --via "<helper>"` is the current strong recovery path.

## When to ask the user something

Ask only when needed:

- choose default room
- confirm preferred music service
- confirm helper room usage for `group rebuild`

Do not ask the user to learn repo internals or command names.

## User-facing tone

The user should experience:

- "我先检查这台电脑可不可以发现你局域网里的 Sonos"
- "我找到这些房间：客厅、浴室。你想默认控制哪一个？"
- "已经可以控制了，你现在可以直接说：暂停、下一首、播郑秀文"

Avoid:

- "请安装 Sonos 控制器"
- "请先学会 zf 命令"
- "我未配置到 Sonos 控制器" without having run preflight

## Read these docs when needed

- Onboarding/product boundary: [GitHub reference](https://github.com/kisssam6886/zonefoundry/blob/main/skills/zonefoundry-local-sonos/references/onboarding-boundary.md)
- Command map and recovery rules: [GitHub reference](https://github.com/kisssam6886/zonefoundry/blob/main/skills/zonefoundry-local-sonos/references/command-map.md)
