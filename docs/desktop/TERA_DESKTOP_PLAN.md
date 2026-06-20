# Tera Desktop Plan

## Overview

Tera Desktop is a lightweight native wrapper for teraai.chat that provides app distribution, faster access, and desktop integration.

## Tera Desktop vs Tera Browser

### Tera Desktop

- **Type**: Lightweight native wrapper
- **Goal**: App distribution, faster access, desktop integration
- **NOT**: A browser replacement
- **Use case**: Users who want quick access to Tera from their desktop
- **Features**:
  - System tray integration
  - Quick launch shortcut
  - Desktop notifications
  - Native window management
  - Auto-updates

### Tera Browser

- **Type**: AI-native browser product
- **Goal**: Full browsing experience with AI assistance
- **NOT**: A simple URL wrapper
- **Use case**: Learning, research, teaching, agent-assisted browsing
- **Features**:
  - Tabs and navigation
  - Page actions (summarize, ask, explain)
  - Research mode
  - Save to Tera
  - Generate lessons from pages
  - Browser history
  - Agent-assisted workflows

## Architecture

### Desktop Wrapper

```
Tera Desktop (Electron/Tauri)
    ↓
Browser Window
    ↓
teraai.chat (Web App)
```

### Browser Product

```
Tera Browser (Native)
    ↓
Browser Engine (Chromium/WebView)
    ↓
AI Layer (Tera API)
    ↓
Page Actions / Research / Learning
```

## Implementation Status

- [ ] Desktop wrapper (Electron/Tauri)
- [ ] System tray integration
- [ ] Quick launch shortcut
- [ ] Desktop notifications
- [ ] Auto-updates
- [ ] Native window management

## Roadmap

### v1.0: Basic Desktop Wrapper
- Electron/Tauri shell
- teraai.chat integration
- System tray
- Quick launch

### v1.1: Enhanced Desktop
- Desktop notifications
- Auto-updates
- Native menus

### v2.0: Desktop + Browser Hybrid
- Desktop wrapper with browser features
- Page actions from desktop
- Research mode from desktop

## Notes

- Tera Desktop is separate from Tera Browser
- Tera Browser is a full AI-native browser product
- Tera Desktop is for app distribution and quick access
- Both products serve different use cases
