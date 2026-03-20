---
name: castreader
description: >
  Your AI reading companion with a personal book library.
  Sync books from Kindle & WeRead, then discuss, search, summarize,
  or listen to any chapter. Also reads any web page aloud from a URL.
version: 3.0.0
metadata:
  openclaw:
    emoji: "📚"
    requires:
      anyBins: ["node"]
    os: ["darwin", "linux", "win32"]
    homepage: https://castreader.ai/openclaw
---

# CastReader — AI 书友 + 个人图书馆

## Setup (once per session)

```
cd <skill-directory> && npm install --silent 2>/dev/null
```

## How to find target (chatId)

User messages look like: `[Telegram username id:8716240840 ...]`
The number after `id:` is the target. You MUST use this number in every `message` tool call.
Example: target is `"8716240840"`.

---

## 图书馆功能（核心）

### 浏览书库

```
cat ~/castreader-library/index.json
```

Shows all synced books with title, author, chapter count, character count, and source (Kindle/WeRead).

Display as a numbered list:
```
📚 Your Library (N books)

1. 《Book Title》 — Author · 12 chapters · 45,000 chars · Kindle
2. 《Another Book》 — Author · 8 chapters · 32,000 chars · WeRead
...
```

### 阅读/讨论章节

```
cat ~/castreader-library/books/<id>/meta.json     # Book details + TOC
cat ~/castreader-library/books/<id>/chapter-NN.md  # Read a chapter
cat ~/castreader-library/books/<id>/full.md        # Full book (all chapters)
```

Use chapter content as context for discussion, summarization, Q&A, or any reading-related conversation.

### 跨书全文搜索

```
grep -rl "<keyword>" ~/castreader-library/books/
```

Search across all books. Show matching books and relevant excerpts.

### 朗读章节

1. Read the chapter content
2. Save to temp file: `echo "<chapter text>" > /tmp/castreader-chapter.txt`
3. Generate audio: `node scripts/generate-text.js /tmp/castreader-chapter.txt <language>`
4. Send MP3 using the `message` tool:
```json
{"action":"send", "target":"<chatId>", "channel":"telegram", "filePath":"/tmp/castreader-chapter.mp3", "caption":"🔊 《Book Title》 Chapter N"}
```

### 同步书籍（书库为空时 or 用户要求同步）

When `~/castreader-library/index.json` doesn't exist or has no books, or user asks to sync new books.

**Two-phase flow: Login → Sync**

#### Phase 1: Login (check + interactive)

Run the login script. It launches Chrome, navigates to the library, and checks login status.

```
node scripts/sync-login.js kindle start
```
or `weread` instead of `kindle`.

Output: JSON `{"event":"...", "step":"...", "screenshot":"...", "message":"...", "loggedIn":...}`

**Handle each event:**

- `event: "already_logged_in"` → Tell user "Already logged in!" and skip to Phase 2.
- `event: "login_step"` → Login is needed. **Ask user to choose:**

```
需要登录你的 Amazon/WeRead 账号，请选择登录方式：

1️⃣ 我去电脑上登录（浏览器已打开，请在电脑上完成登录）
2️⃣ 提供账号密码，帮我自动登录
```

**STOP and wait for user reply.**

##### Option 1: User logs in manually on computer

Tell user: "请在电脑上打开的浏览器中完成登录，登录完成后告诉我。"

Then poll login status every 15 seconds:
```
node scripts/sync-login.js kindle status
```
- If `loggedIn: true` → Tell user "Login successful!" and proceed to Phase 2.
- If `loggedIn: false` after user says they logged in → Send screenshot to user, ask them to check.
- Keep polling until `loggedIn: true` or user cancels.

##### Option 2: Automated login via credentials

Ask user for credentials step by step. Each step: enter text → screenshot → next step.

```
node scripts/sync-login.js kindle input "<user's reply text>"
```

This fills the field, clicks submit, waits for page transition, and returns a new screenshot.

- If `event: "login_complete"` → Tell user "Login successful!" and proceed to Phase 2.
- If `event: "login_step"` with `step: "password"` → Ask user for password.
- If `event: "login_step"` with `step: "2fa"` → Ask user for verification code.
- If `event: "login_step"` with `step: "captcha"` → Send screenshot, ask user to type the characters.
- If `event: "login_step"` again (other steps) → Send screenshot, ask user what to enter.
- `step: "wechat_qr"` → Send screenshot, tell user to scan QR with WeChat. Then poll:
  ```
  node scripts/sync-login.js weread status
  ```
  Poll every 10s until `loggedIn: true`.

**Send screenshots to user:**
```json
{"action":"send", "target":"<chatId>", "channel":"telegram", "filePath":"<screenshot path>", "caption":"<message text>"}
```

#### Phase 2: Close login Chrome + Start sync

After login is confirmed, close the login Chrome (login session is saved in profile):

```
node scripts/sync-login.js kindle stop
```

Then run the sync script. It launches Chrome with the same profile (already logged in):

```
node scripts/sync-books.js kindle
```
or `weread`. Use `--max N` to limit books per run.

Fully automatic: launches Chrome, loads extension, scans the book library, syncs each book one by one, closes Chrome when done. Progress is printed to stderr.

The script outputs JSON events on stdout:
- `{"event":"wechat_qr","screenshot":"/tmp/weread-qr-xxx.png","message":"..."}` → WeRead needs login. **Send the QR screenshot to user via Telegram** with message "请在微信中长按识别此二维码登录微信读书，登录后会自动开始同步。" Then wait — the script auto-detects login and continues.
  ```json
  {"action":"send", "target":"<chatId>", "channel":"telegram", "filePath":"<screenshot path>", "caption":"📱 请在微信中长按识别此二维码登录微信读书\n登录后会自动开始同步书籍。"}
  ```
- `{"event":"login_required","message":"..."}` → Should not happen if Phase 1 completed. If it does, re-run Phase 1.
- `{"event":"login_complete"}` → "Login confirmed! Syncing your books now..."
- Final line: `{"success":true,"booksSynced":N,"totalBooks":M,...}`

Login session is saved in Chrome profile — no re-login needed for future syncs.

---

## URL 朗读功能（次要）

### When user sends a URL, follow these steps:

#### Step 1: Extract article

```
node scripts/read-url.js "<url>" 0
```

Returns: `{ title, language, totalParagraphs, totalCharacters, paragraphs[] }`

#### Step 2: Show info + ask user to choose

Reply with this text:

```
📖 {title}
🌐 {language} · 📝 {totalParagraphs} paragraphs · 📊 {totalCharacters} chars

📋 Summary:
{write 2-3 sentence summary from paragraphs}

Reply a number to choose:
1️⃣ Listen to full article (~{totalCharacters} chars, ~{Math.ceil(totalCharacters / 200)} sec to generate)
2️⃣ Listen to summary only (~{summary_char_count} chars, ~{Math.ceil(summary_char_count / 200)} sec to generate)
```

**STOP. Wait for user to reply 1 or 2.**

#### Step 3a: User chose 1 (full article)

Reply: `🎙️ Generating full audio (~{totalCharacters} chars, ~{Math.ceil(totalCharacters / 200)} seconds)...`

```
node scripts/read-url.js "<url>" all
```

Then send the audio file using the `message` tool:
```json
{"action":"send", "target":"<chatId>", "channel":"telegram", "filePath":"<audioFile>", "caption":"🔊 {title}"}
```

Reply: `✅ Done!`

#### Step 3b: User chose 2 (summary only)

Reply: `🎙️ Generating summary audio...`

Save the SAME summary text you showed in Step 2 to a file and generate:
```
echo "<summary text>" > /tmp/castreader-summary.txt
node scripts/generate-text.js /tmp/castreader-summary.txt <language>
```

Then send the audio file using the `message` tool:
```json
{"action":"send", "target":"<chatId>", "channel":"telegram", "filePath":"/tmp/castreader-summary.mp3", "caption":"📋 Summary: {title}"}
```

Reply: `✅ Done!`

---

## Rules

- When user mentions books, reading, library, chapters, summaries, or asks about their collection → use **图书馆功能**
- When user sends a URL → use **URL 朗读功能**
- When library is empty → guide user to run `sync-books.js`
- ALWAYS extract first (index=0), show info, wait for user choice. Never skip.
- ALWAYS send audio files using the `message` tool with `target` (numeric chatId) and `channel` ("telegram"). Never just print the file path.
- Do NOT use built-in TTS tools. ONLY use `read-url.js` and `generate-text.js`.
- Do NOT use web_fetch. ONLY use `read-url.js`.
