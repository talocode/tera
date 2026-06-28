# Changelog

All notable changes to Tera Browser will be documented in this file.

## Tera Browser v0.2.0

Context Capture & Research Mode release.

### Added

- **Research Mode** — Dedicated panel on the new tab page with actions for capture, summarization, Send to Tera, save source, and history
- **Page context capture** (`src/lib/context-capture/`) — TypeScript modules for DOM extraction, URL validation, secret redaction, HTML cleaning, and text normalization
- **Text summarization** — Local summarization at brief, detailed, and key-points levels
- **Provider fallback chain** — DOM extraction → Jina Reader → Firecrawl → fetch/readability
- **Send to Tera** — `POST /api/browser/context` endpoint validates payload and returns JSON
- **Local capture history** — Stored in Electron user-data directory with persistent history
- **Safety boundaries** — Unsafe protocols, private IPs, secrets, and sensitive pages blocked/redacted
- **Capture storage IPC** — Main process handlers for save, get, history, remove, clear
- **Preload API extensions** — Research mode methods exposed via `window.teraBrowser`
- **Tests** — 45 tests covering URL validation, secret redaction, HTML cleaning, text utilities, URL safety, summarization, provider fallback, API payload validation, and search functionality
- **Documentation** — `docs/CONTEXT_CAPTURE.md` and `docs/RESEARCH_MODE.md`

### Security

- Secrets redacted before storage (API keys, tokens, passwords)
- Sensitive page patterns (login, payment, password) detected and blocked from server-side storage
- No cookies, localStorage, or credentials captured

## Tera Browser v0.1.1

Safety release: replaces the previous browser implementation with an original Talocode/Tera Electron implementation and removes all Xplorer-derived files/assets because the upstream repository had no explicit license.

### Changed

- Replaced all Xplorer-derived code with original implementation
- Removed companion/ directory (Xplorer UI files)
- Removed branding/ directory (Xplorer icons)
- Created original new tab page
- Created original browser shell
- Added validation script to prevent Xplorer content
- Updated documentation to clarify original implementation

## Tera Browser v0.1.0

Initial release of Tera Browser.

### Added

- Tera-first browser branding
- Default search routed to Tera
- Tera-powered new tab page
- Open Tera action
- Ask Tera about current page action
- Summarize current page action
- Learn with Tera action
- Initial desktop build configuration inside the Tera repo

### Notes

This release focused on making Tera available directly inside the browsing workflow.
