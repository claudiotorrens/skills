---
name: castreader
description: >
  Read any web page aloud with natural AI voices. Extract article text from any URL
  and convert it to audio (MP3). Use when the user wants to:
  listen to a webpage, read an article aloud, convert URL to audio,
  text-to-speech for a link, read this page to me, listen to this article.
version: 1.7.2
metadata:
  openclaw:
    emoji: "🔊"
    requires:
      anyBins: ["node"]
    os: ["darwin", "linux", "win32"]
    homepage: https://castreader.ai/openclaw
---

# CastReader — Read Any Web Page Aloud

## ⚠️ MANDATORY: Two-phase flow. Read this FIRST.

When a user sends a URL, you MUST follow this exact two-phase flow. Do NOT skip Phase 1. Do NOT run index=1 directly.

**Phase 1** → Extract only (index=0), show info with buttons, ask user to choose.
**Phase 2** → User clicks button, THEN generate audio (index=1, 2, 3...).

If you skip Phase 1 and jump to generating audio, you are doing it WRONG.

## The command

```
node scripts/read-url.js <url> <paragraph-index>
```

- `0` = Extract only. NO audio. Returns article info + all paragraph texts.
- `1`, `2`, `3`... = Generate audio for that paragraph (1-based).

## Setup: Install dependencies (once per session)

Before the first run, ensure dependencies are installed:

```
cd <skill-directory> && npm install --silent
```

Only needed once. Skip if you already ran it in this session.

## Phase 1: Extract + Show Info (ALWAYS do this first)

When user sends a URL, your FIRST action must be:

```
node scripts/read-url.js <url> 0
```

This returns:
```json
{
  "title": "Article Title",
  "language": "en",
  "totalParagraphs": 12,
  "totalCharacters": 2450,
  "paragraphs": ["First paragraph...", "Second...", ...],
  "current": null,
  "hasNext": true
}
```

Then you MUST use the `message` tool to send the info with inline buttons. Example:

```
message tool call:
  action: "send"
  message: "📖 **{title}**\n🌐 {language} · 📝 {totalParagraphs} paragraphs · 📊 {totalCharacters} chars\n⏱️ ~{Math.ceil(totalCharacters / 600)} min\n\n📋 Summary:\n{2-3 sentence summary from paragraphs}\n\nHow would you like to listen?"
  channel: "telegram"
  buttons: "[[{\"text\": \"🔊 Read Full ({totalParagraphs} paragraphs)\", \"callback_data\": \"castreader_read_full\"}, {\"text\": \"📝 Summary Only\", \"callback_data\": \"castreader_summary\"}]]"
```

**STOP HERE. Do NOT generate audio. Do NOT call read-url.js with index=1. Wait for user to click a button.**

## Phase 2a: User clicked "Read Full"

Generate paragraph 1:

```
node scripts/read-url.js <url> 1
```

Send the audio file with the `message` tool:

```
message tool call:
  action: "send"
  filePath: "{current.audioFile}"
  caption: "[1/{totalParagraphs}] {current.text (first 100 chars)}..."
  channel: "telegram"
  buttons: "[[{\"text\": \"⏭ Next (2/{totalParagraphs})\", \"callback_data\": \"castreader_next\"}, {\"text\": \"⏹ Stop\", \"callback_data\": \"castreader_stop\"}]]"
```

Wait for user to click Next or Stop.

On "Next": **first delete the previous audio message**, then generate next paragraph.
On last paragraph (hasNext=false), do NOT show Next button. Show: `✅ All done! {totalParagraphs} paragraphs read.`

## Phase 2b: User clicked "Summary Only"

Send the summary as a text message. No audio needed.
```
✅ Summary complete.
```

## CRITICAL: Delete previous audio before sending next

Telegram auto-plays the next audio message after one finishes. To prevent chaos:

1. Remember the `message_id` from each audio message response.
2. Before sending the NEXT audio, DELETE the previous audio message first.
3. This way only ONE audio message exists in chat at any time.

## Rules

- ALWAYS run index=0 FIRST. Never skip to index=1.
- ALWAYS use the `message` tool with `buttons` parameter for choices. Never just print text.
- Generate ONE paragraph at a time.
- WAIT for user to click a button before generating next.
- DELETE previous audio message before sending each new audio.
- Do NOT use built-in TTS tools. ONLY use `read-url.js`.
- Do NOT use web_fetch to get article text. ONLY use `read-url.js`.
