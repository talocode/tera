# Tera Browser

## What is Tera Browser?

Tera Browser is a human-first AI browser for learning, research, and deep work. It brings Tera AI into the browsing workflow so users can search, summarize pages, understand topics, and continue research from one place.

## Why It Exists

Most people open a browser before they open an AI app. Tera Browser should bring Tera into search, browsing, page understanding, summarization, and learning workflows.

## How It Relates to Tera

Tera Browser is the browser extension of the Tera ecosystem:

- **Tera Web** (teraai.chat) — The main AI assistant
- **Tera Browser** — Brings Tera into the browsing workflow
- **Tera Mobile** — Mobile AI companion

## Upstream Attribution

Tera Browser is adapted from [Xplorer](https://github.com/daniel-farina/xplorer) by Daniel Farina. Xplorer is an AI-native Chromium fork with Grok integration. We have rebranded and adapted the UI layer for Tera's mission.

## Features

### v0.1.0

- Tera as default search layer
- Tera-first new tab page
- Open Tera from the browser
- Ask Tera about the current page
- Summarize current page with Tera
- Learn from current page with Tera

## How to Run Locally

```bash
cd apps/browser
npm install
npm start
```

## How to Build

```bash
cd apps/browser
npm install

# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## How to Package Desktop Builds

Tera Browser uses Electron Builder for desktop packaging:

```bash
npm run build
```

This will create platform-specific installers in the `dist/` directory.

## Limitations / TODOs

- [ ] Custom Tera icons (using Xplorer placeholders)
- [ ] Persistent browser history and bookmarks
- [ ] Tab management
- [ ] Extension support
- [ ] Settings page
- [ ] Dark/light mode toggle
- [ ] Keyboard shortcuts for Tera actions
- [ ] Context menu integration
- [ ] Address bar autocomplete
- [ ] Download manager

## License

MIT © Talocode

Adapted from Xplorer by Daniel Farina.
