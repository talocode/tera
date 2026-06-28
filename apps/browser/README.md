# Tera Browser

**A human-first AI browser for learning, research, and deep work.**

Tera Browser brings Tera AI into the browsing workflow so users can search, summarize pages, understand topics, and continue research from one place.

## Important Notice

Tera Browser v0.1.0 is an **original Electron implementation** built from scratch by Talocode. 

- **No Xplorer code or assets are included**
- Xplorer (https://github.com/daniel-farina/xplorer) was inspected only for product inspiration
- The upstream Xplorer repository has no explicit license, so no code/assets were copied
- All UI, icons, and implementation files are original Talocode/Tera work

## Features

### v0.1.x
- **Tera as default search layer** — Address bar searches route to Tera
- **Tera-first new tab page** — Clean, focused search experience
- **Open Tera** — Quick access to Tera AI
- **Ask Tera about this page** — Get explanations for any page
- **Summarize current page with Tera** — Quick page summaries
- **Learn from current page with Tera** — Extract key ideas and learn
- **Visual Explain (Viewport Capture)** — Capture and explain visible page content

### v0.2 — Context Capture & Research Mode
- **Research Mode panel** — Dedicated UI for capture, summarization, and history
- **Page context capture** — Extract headings, links, description, and full text
- **Selection capture** — Capture selected text from any page
- **Secret redaction** — API keys, tokens, and passwords redacted before storage
- **Safety boundaries** — Private IPs, unsafe protocols, and sensitive pages blocked
- **Provider fallback** — DOM extraction → Jina Reader → Firecrawl → fetch/readability
- **Send to Tera** — POST captured context to `teraai.chat/api/browser/context`
- **Local capture history** — Persistent history with view/remove actions
- **Summarize with Tera** — Opens captured content in Tera for summarization
- **Context Capture API** — Server endpoint validates and stores context

## Why Tera Browser?

Most people open a browser before they open an AI app. Tera Browser should bring Tera into search, browsing, page understanding, summarization, and learning workflows.

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
cd apps/browser
npm install
```

### Run

```bash
npm start
```

### Validate

```bash
npm run validate
```

### Build Desktop App

```bash
# Package for current platform
npm run pack

# Build distributable
npm run dist
```

## Development

### Project Structure

```
apps/browser/
  src/
    main.js                   # Electron main process
    preload.js                # Secure IPC bridge
    newtab.html               # New tab page
    newtab.css                # New tab styles
    newtab.js                 # New tab logic
    browser.css               # Browser shell styles
    visual-context.js         # Viewport capture logic
    visual-context.css        # Viewport capture styles
    research-mode.css         # Research Mode styles
    lib/
      context-capture/
        types.ts              # Shared types
        extract.ts            # DOM extraction, URL validation
        clean.ts              # HTML cleaning, secret redaction
        summarize.ts          # Local text summarization
        providers.ts          # Provider fallback chain
        storage.ts            # Capture history storage
        index.ts              # Public API
  public/
    icon.png                  # App icon
  scripts/
    validate.js               # Validation script
  docs/
    CONTEXT_CAPTURE.md        # Context capture docs
    RESEARCH_MODE.md          # Research Mode docs
  __tests__/
    context-capture.test.ts   # Context capture tests
  package.json
  README.md
  CHANGELOG.md
```

### Architecture

Tera Browser is built with Electron, which provides a Chromium-based browsing experience with native desktop integration.

- **Main Process** (`src/main.js`): Handles window management, menus, Tera integrations, capture storage IPC
- **Preload Script** (`src/preload.js`): Secure bridge between web content and Electron for search, viewport capture, context capture, research mode
- **New Tab** (`src/newtab.html`): Tera-first search experience with Research Mode panel
- **Context Capture** (`src/lib/context-capture/`): TypeScript modules for page text extraction, HTML cleaning, URL safety, secret redaction, text summarization, provider fallback, and history storage

## Tera Integration

### Default Search

All address bar searches route to Tera:

```
https://teraai.chat/?q=<encoded query>
```

### Browser Actions

- **Open Tera** — Opens https://teraai.chat
- **Ask Tera about this page** — Sends page title and URL to Tera for explanation
- **Summarize with Tera** — Sends page to Tera for summarization
- **Learn with Tera** — Extracts key ideas from the page

## Security

- Context isolation enabled
- No direct Node API exposure to web content
- Preload script for safe IPC communication
- No remote module usage
- No unsafe eval
- Unsafe protocols (javascript:, data:, vbscript:, file:) blocked
- Private/local IP addresses rejected for capture
- Common secret patterns redacted (API keys, tokens, passwords, Bearer tokens)
- Sensitive page patterns detected (login, payment, password reset)
- No cookies, localStorage, or credentials captured
- Explicit user action required for every capture

## Links

- [Tera AI](https://teraai.chat)
- [GitHub](https://github.com/talocode/tera)

## License

MIT © Talocode

This is an original implementation. No third-party code is included.
