# Tera Browser Plan

## Overview

Tera Browser is an AI-native browser for learning, research, and agent-assisted web workflows.

## Product Positioning

"Tera Browser is an AI-native browser for learning, research, and agent-assisted web workflows."

## Core Features

### Navigation

- Tabs
- Address/search bar
- Navigation controls
- Bookmarks
- History

### Page Actions

- Ask page
- Summarize page
- Explain page
- Save page to Tera
- Generate lesson from page
- Translate page
- Extract key points
- **Visual Explain** (capture viewport + visual analysis) — user-triggered, preview before send

### Research Mode

- Deep research workflows
- Multi-source analysis
- Citation tracking
- Source verification
- Research summaries

### Learning Mode

- Student workflows
- Teacher workflows
- Quiz generation
- Concept mapping
- Knowledge extraction

### Agent-Assisted Browsing

- Automated page actions
- Multi-tab research
- Data extraction
- Form filling (with approval)
- Screenshot capture

## Architecture

```
Tera Browser (Native)
    ↓
Browser Engine (Chromium/WebView)
    ↓
AI Layer (Tera API)
    ↓
Page Actions / Research / Learning
```

## Core Features

### Tabs

- Open/close tabs
- Tab navigation
- Tab groups
- Tab search

### Address/Search Bar

- URL navigation
- Search integration
- Autocomplete
- Quick actions

### Navigation Controls

- Back/forward
- Reload
- Stop
- Home

### Page Actions

- **Ask Page**: Ask questions about the current page
- **Summarize Page**: Get a summary of the page content
- **Explain Page**: Get detailed explanations of concepts
- **Save to Tera**: Save page content to Tera workspace
- **Generate Lesson**: Create a lesson plan from the page
- **Translate**: Translate page content
- **Extract**: Extract key points, quotes, data

### Research Mode

- Multi-source research
- Citation tracking
- Source verification
- Research summaries
- Knowledge graphs

### Learning Mode

- Student workflows
- Teacher workflows
- Quiz generation
- Concept mapping
- Knowledge extraction
- Progress tracking

### Agent-Assisted Browsing

- Automated page actions
- Multi-tab research
- Data extraction
- Form filling (with approval)
- Screenshot capture — implemented as user-triggered viewport capture with preview
- Page monitoring

## Privacy/Security Model

### Trusted Domains

- Only trusted domains are fully accessible
- Unknown domains require approval
- Malicious domains are blocked

### Local/Session Storage

- All data stored locally
- Session history in local database
- No cloud sync by default

### Download Handling

- Downloads require approval
- Malicious files blocked
- Download location configurable

### Permissions

- Page actions require approval
- Agent actions require approval
- Data extraction requires approval
- Form filling requires approval

## Roadmap

### v1.0: Core Browser
- Tabs and navigation
- Address bar
- Page loading
- Basic page actions

### v1.1: AI Page Actions
- Ask page
- Summarize page
- Explain page
- Save to Tera

### v1.2: Research Mode
- Multi-source research
- Citation tracking
- Research summaries

### v1.3: Learning Mode
- Student workflows
- Teacher workflows
- Quiz generation

### v1.4: Agent-Assisted Browsing
- Automated page actions
- Multi-tab research
- Data extraction
- Form filling

### v0.1 Visual Context Capture (Implemented)

- User-triggered viewport capture via menu or keyboard shortcut
- Privacy-first: blocks private URLs, requires user confirmation
- Preview panel with thumbnail, metadata, discard/confirm flow
- No screenshot storage by default
- VLM analysis pending provider integration

## Notes

- Tera Browser is separate from Tera Desktop
- Tera Browser is a full AI-native browser product
- Tera Desktop is a lightweight wrapper for teraai.chat
- Both products serve different use cases
