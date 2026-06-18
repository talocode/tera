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

- **Tera as default search layer** — Address bar searches route to Tera
- **Tera-first new tab page** — Clean, focused search experience
- **Open Tera** — Quick access to Tera AI
- **Ask Tera about this page** — Get explanations for any page
- **Summarize current page with Tera** — Quick page summaries
- **Learn from current page with Tera** — Extract key ideas and learn

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
    main.js          # Electron main process
    preload.js       # Secure IPC bridge
    newtab.html      # New tab page
    newtab.css       # New tab styles
    newtab.js        # New tab logic
    browser.css      # Browser shell styles
  public/
    icon.png         # App icon
  scripts/
    validate.js      # Validation script
  package.json
  README.md
  CHANGELOG.md
```

### Architecture

Tera Browser is built with Electron, which provides a Chromium-based browsing experience with native desktop integration.

- **Main Process** (`src/main.js`): Handles window management, menus, and Tera integrations
- **Preload Script** (`src/preload.js`): Secure bridge between web content and Electron
- **New Tab** (`src/newtab.html`): Tera-first search experience

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

## Links

- [Tera AI](https://teraai.chat)
- [GitHub](https://github.com/talocode/tera)

## License

MIT © Talocode

This is an original implementation. No third-party code is included.
