# Tera Visual Context Layer

Architecture for using screenshot-aware visual page context in Tera Browser.

## Purpose

Tera Browser visits pages that communicate through visual structure — dashboards, charts, tables, code editors, terminal output, UI states. Text extraction alone flattens these into meaningless strings. The Visual Context Layer captures what the page looks like, combines it with extracted text, and gives the AI a complete understanding of the page.

## Why Visual Context Matters

Text-based web context works for documentation and articles. It fails for:

- Data tables where column alignment and row relationships carry meaning
- Charts and graphs where visual data has no text equivalent
- Dashboard layouts where spatial arrangement conveys status
- UI states where button colors, form validation, and navigation breadcrumbs matter
- Code editors where syntax highlighting and error indicators are visual
- Diagrams where architecture, flow, and topology are visual concepts

Visual context preserves the spatial and structural information that makes these pages understandable.

## Current Text-Only Web Context Limitation

The existing Web Context Layer extracts clean markdown from pages. This works well for:

- Documentation with clear headings and paragraphs
- Blog posts and articles
- API references with code examples
- Markdown-rendered content

It loses meaning when the page's primary communication mode is visual.

## Visual Context Flow

```
User navigates to page
  ↓
Page loads in Tera Browser
  ↓
User triggers visual capture (explicit action)
  ↓
┌──────────────────────────────────────┐
│ Browser-side capture                 │
│  ↓ Visible viewport screenshot      │
│  ↓ Readable text extraction (if any)│
│  ↓ Page metadata (URL, title, etc.) │
└──────────────────────────────────────┘
  ↓
Send to Tera API:
  - text content (if extracted)
  - screenshot metadata + image data
  - user question or action mode
  ↓
┌──────────────────────────────────────┐
│ VLM/AI analysis                     │
│  ↓ Read visual elements             │
│  ↓ Extract visible data             │
│  ↓ Combine with text context        │
│  ↓ Generate summary/answer          │
└──────────────────────────────────────┘
  ↓
Return structured response:
  - summary / answer / explanation
  - visible elements identified
  - key points from visual analysis
  - suggested follow-up questions
  ↓
User may save result to memory
```

## Hybrid Text + Screenshot Flow

1. **Text extraction** runs first (if page has readable text)
2. **Viewport capture** triggered by user action
3. **Both modalities sent** to the API with clear framing
4. **AI reasons over both** — text for content, screenshot for structure
5. **Unified response** draws from whichever source has the answer

## Browser-Side Capture

The browser captures:

- **Viewport screenshot** — what the user currently sees
- **Page dimensions** — width, height, scroll position
- **Visible text** — extracted from DOM if available
- **Page metadata** — URL, title, load state

Capture is always:
- User-triggered (button click, keyboard shortcut, slash command)
- Ephemeral by default (not stored)
- Scoped to visible viewport (not full-page crawl)

## Backend API Boundary

```
Tera Browser (local)
  ↓ user-triggered capture
  ↓ text extraction
  ↓ screenshot + metadata
  ↓
Tera API (server)
  ↓ validate request
  ↓ enforce auth + usage
  ↓ reject oversized images
  ↓ forward to VLM provider
  ↓
VLM Provider (external)
  ↓ analyze visual content
  ↓ return structured analysis
  ↓
Tera API → Tera Browser
  ↓ display result
  ↓ optionally save to memory
```

## VLM Provider Interface

The Visual Context Layer expects a VLM provider that accepts:

- Image input (base64 or upload reference)
- Text prompt (question, instruction, or mode)
- Returns structured text analysis

Provider abstraction:
- Supports multiple VLM backends (OpenAI Vision, local models, etc.)
- Falls back to text-only analysis if no VLM provider is configured
- Never fakes visual analysis — returns "provider not configured" if unavailable

## Privacy and Security Rules

### Capture Rules

- Visual capture must be user-triggered — never silent
- Never capture hidden tabs or background windows
- Never capture passwords, secret fields, or credential forms
- Warn before capturing private or authenticated pages
- Block local/private URLs (localhost, 10.x, 192.168.x) in cloud mode unless explicitly enabled

### Storage Rules

- Screenshots are ephemeral by default — used for analysis, then discarded
- Save-to-memory stores derived notes, not raw images, by default
- If user opts into screenshot storage, encrypt at rest
- Allow user to delete visual context at any time
- Do not store screenshots across sessions without explicit consent

### Transmission Rules

- Screenshots sent only to Tera API endpoint
- Never transmitted to third-party services without user consent
- Redact visible secrets (passwords, API keys, tokens) where possible
- Warn if screenshot appears to contain sensitive information

## v0.1 Scope

### Implemented

- Text-based web context extraction (existing)
- Browser API routes for summarize/ask/explain (existing)
- Web context normalization and redaction (existing)

### Planned for v0.1

- Visual context API route stubs (validate input, enforce auth, reject oversized images)
- Screenshot metadata handling in request/response shapes
- Provider-not-configured fallback responses

### Not Yet Implemented

- Actual VLM provider integration
- Browser-side viewport capture (requires browser extension or Electron API)
- Screenshot storage and retrieval
- Visual search/indexing
- Multi-screenshot page understanding

## Future Roadmap

### v0.2 — Browser Capture Integration

- Electron/browser extension captures viewport on user action
- Sends screenshot + text to Tera API
- VLM provider integration for visual analysis

### v0.3 — Visual Memory

- Save visual context summaries to memory
- Visual source trail for learning flows
- Screenshot-backed flashcards and lessons

### v0.4 — Visual Search

- Index visual context for retrieval
- Search by visual similarity
- Cross-page visual comparison

### v1.0 — Full Visual Context

- Multi-modal RAG over saved visual context
- Visual debugging (capture UI bugs, dashboard states)
- Visual research mode (multi-page visual studies)
