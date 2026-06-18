# Tera Browser

## What is Tera Browser?

Tera Browser is a human-first AI browser for learning, research, and deep work. It brings Tera AI into the browsing workflow so users can search, summarize pages, understand topics, and continue research from one place.

## Important Notice

Tera Browser v0.1.0 is an **original Electron implementation** built from scratch by Talocode.

- **No Xplorer code or assets are included**
- Xplorer (https://github.com/daniel-farina/xplorer) was inspected only for product inspiration
- The upstream Xplorer repository has no explicit license, so no code/assets were copied
- All UI, icons, and implementation files are original Talocode/Tera work

## Why It Exists

Most people open a browser before they open an AI app. Tera Browser should bring Tera into search, browsing, page understanding, summarization, and learning workflows.

## How It Relates to Tera

Tera Browser is the browser extension of the Tera ecosystem:

- **Tera Web** (teraai.chat) — The main AI assistant
- **Tera Browser** — Brings Tera into the browsing workflow
- **Tera Mobile** — Mobile AI companion

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

# Package for current platform
npm run pack

# Build distributable
npm run dist
```

## How to Package Desktop Builds

Tera Browser uses Electron Builder for desktop packaging:

```bash
npm run dist
```

This will create platform-specific installers in the `dist/` directory.

## Validation

Run the validation script to ensure no Xplorer-derived content:

```bash
npm run validate
```

This checks:
- No Xplorer/Grok/xAI references in code
- No companion/ or branding/ directories
- All required files exist
- Package metadata is correct

## Security

- Context isolation enabled
- No direct Node API exposure to web content
- Preload script for safe IPC communication
- No remote module usage
- No unsafe eval

## Limitations / TODOs

- [ ] Custom Tera icons (using placeholder)
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

This is an original implementation. No third-party code is included.
