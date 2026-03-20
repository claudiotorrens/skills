# CastReader — AI Reading Companion & Personal Library | OpenClaw Skill

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue)](https://clawhub.com/castreader)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)]()

**Your AI reading companion.** Sync books from Kindle Cloud Reader and WeRead (微信读书) into a personal library, then discuss, search, summarize, or listen to any chapter with AI. Also reads any web page aloud from a URL.

## Why CastReader?

You already own dozens of books across Kindle and WeRead — but they're locked inside those platforms. CastReader syncs them to your local machine as clean markdown files, then lets you have natural conversations about what you've read:

- *"Summarize chapter 3 of The Kite Runner"*
- *"Search all my books for mentions of 'stoicism'"*
- *"Read chapter 5 aloud while I cook"*
- *"What are the key arguments in Thinking, Fast and Slow?"*

No copy-pasting, no manual exports. Just talk to your AI book companion.

## Core Features

### 📚 Personal Book Library

Sync your entire Kindle or WeRead collection to `~/castreader-library/` with one command:

```bash
node scripts/sync-books.js kindle   # Sync from Kindle Cloud Reader
node scripts/sync-books.js weread   # Sync from WeRead (微信读书)
```

Books are stored as clean markdown — chapter headings, paragraphs, no DRM noise. Browse, search, and discuss any book through natural conversation.

### 🤖 AI Book Discussions

Once synced, ask anything about your books:

```
User: What books do I have?
Bot:  📚 Your Library (5 books)
      1. 《The Kite Runner》 — Khaled Hosseini · 25 chapters · 98,000 chars
      2. 《Thinking, Fast and Slow》 — Daniel Kahneman · 38 chapters · 156,000 chars
      ...

User: Summarize the first chapter of The Kite Runner
Bot:  [reads chapter-01.md, provides summary]

User: Search my books for "cognitive bias"
Bot:  Found in 2 books:
      - Thinking, Fast and Slow: chapters 4, 7, 12, 22
      - ...
```

### 🔊 Chapter Read-Aloud

Listen to any chapter with natural Kokoro TTS voices. The AI reads the chapter content and sends you an MP3 — perfect for commutes or cooking.

### 🌐 URL to Audio (Secondary)

Paste any URL and CastReader extracts the article text and converts it to audio. Works on 15+ platforms where other tools fail:

| Platform | Challenge | CastReader's Approach |
|----------|-----------|----------------------|
| **Kindle Cloud Reader** | Scrambled custom fonts, no readable text in DOM | OCR-direct via tesseract-wasm |
| **WeRead (微信读书)** | Text rendered on Canvas, not in DOM | Intercepts fetch API to capture chapter data |
| **Notion** | Complex nested block-based DOM | Dedicated block parser |
| **Google Docs** | Custom rendering engine, no standard HTML | Specialized extractor for Docs DOM |
| **ChatGPT / Claude / Gemini** | Dynamic SPA, markdown rendering | AI response extraction with language detection |
| **Feishu / Yuque / DingTalk** | Chinese productivity tools | Dedicated extractors |
| **Any other website** | Generic articles, blogs, docs | Visible-Text-Block algorithm (Readability + Boilerpipe + JusText fusion) |

## Installation

```bash
clawhub install castreader
```

**Requirements:** Node.js 18+

## Quick Start

```bash
# 1. Sync your Kindle books
node scripts/sync-books.js kindle

# 2. Browse your library
cat ~/castreader-library/index.json

# 3. Read a chapter
cat ~/castreader-library/books/<book-id>/chapter-01.md

# 4. Or just ask your AI companion about any book!
```

## Usage — URL to Audio

### Extract text from a URL

```bash
node scripts/read-url.js https://en.wikipedia.org/wiki/Text-to-speech 0
```

Returns structured JSON with article info and all paragraph texts.

### Generate full article audio

```bash
node scripts/read-url.js https://en.wikipedia.org/wiki/Text-to-speech all
```

Extracts content + generates a single MP3 file.

### Generate audio from any text

```bash
echo "Your text here..." > /tmp/text.txt
node scripts/generate-text.js /tmp/text.txt en
```

### Read aloud in the browser (with highlighting)

```bash
node scripts/read-aloud.js https://notion.so/my-page
```

Opens the URL in your browser and triggers CastReader to read with real-time paragraph-level highlighting. Requires the [CastReader Chrome extension](https://chromewebstore.google.com/detail/castreader-tts-reader/foammmkhpbeladledijkdljlechlclpb).

## Comparison with Other Skills

| Feature | CastReader | kokoro-tts | openai-tts | mac-tts |
|---------|-----------|------------|------------|---------|
| Personal book library | Yes | No | No | No |
| Book discussion / Q&A | Yes | No | No | No |
| Cross-book search | Yes | No | No | No |
| URL to audio | Yes | No | No | No |
| Web content extraction | Yes (15+ platforms) | No | No | No |
| Canvas/font-scrambled sites | Yes | No | No | No |
| Paragraph highlighting | Yes | No | No | No |
| Plain text to speech | Yes | Yes | Yes | Yes |
| API key required | No | No | Yes | No |
| Languages | 40+ | 40+ | 50+ | System voices |
| Cost | Free | Free | Paid | Free |

## How It Works

### Book Sync

1. **Launch** — `sync-books.js` starts a local sync server + Puppeteer with your Chrome profile (preserves login sessions)
2. **Navigate** — Opens Kindle Cloud Reader or WeRead in the browser
3. **Sync** — Triggers the CastReader extension's built-in sync engine via CDP
4. **Store** — Books are saved as clean markdown to `~/castreader-library/`

### URL Extraction

1. **Extract** — 3-tier pipeline: platform-specific extractors → learned CSS rules → Visible-Text-Block algorithm
2. **Generate** — Kokoro TTS API returns natural speech with word-level timestamps
3. **Deliver** — Full article or summary as MP3

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CASTREADER_VOICE` | `af_heart` | TTS voice selection |
| `CASTREADER_SPEED` | `1.5` | Playback speed |
| `CASTREADER_API_URL` | `http://api.castreader.ai:8123` | API endpoint |

## Links

- **Website:** [castreader.ai](https://castreader.ai)
- **OpenClaw page:** [castreader.ai/openclaw](https://castreader.ai/openclaw)
- **Chrome Web Store:** [CastReader Extension](https://chromewebstore.google.com/detail/castreader-tts-reader/foammmkhpbeladledijkdljlechlclpb)
- **Edge Add-ons:** [CastReader for Edge](https://microsoftedge.microsoft.com/addons/detail/niidajfbelfcgnkmnpcmdlioclhljaaj)
- **ClawHub:** [clawhub.com/castreader](https://clawhub.com/castreader)

## License

MIT
