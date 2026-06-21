# Tera Web Context Layer

Architecture for extracting, cleaning, and using public or user-approved web content within Tera Browser.

## Purpose

Tera Browser can visit any page. The Web Context Layer turns visited pages into clean, structured, AI-usable context — enabling summarization, questioning, explanation, lesson generation, and memory storage without exposing users to raw HTML or requiring manual copy-paste.

## Core Concept

Every page Tera visits has extractable intelligence. The Web Context Layer extracts, cleans, and structures that intelligence so the AI can work with it safely and accurately.

## Page Intelligence Flow

```
User navigates to page
  ↓
Page loads in Tera Browser
  ↓
Web Context extraction runs
  ↓
┌──────────────────────────┐
│ Raw HTML                 │
│  ↓ Strip boilerplate     │
│  ↓ Extract text + structure│
│  ↓ Clean markdown output │
│  ↓ Attach metadata       │
└──────────────────────────┘
  ↓
Clean structured context
  ↓
┌──────────────────────┐
│ Summarize            │
│ Ask questions        │
│ Explain concepts     │
│ Generate lessons     │
│ Save to memory       │
└──────────────────────┘
```

## Extraction Pipeline

### 1. Page Detection

When a page loads, Tera detects whether extraction is appropriate:

- Public documentation pages
- Blog posts and articles
- GitHub issues, releases, discussions
- API references and specifications
- Help centers and knowledge bases
- Product pages and changelogs
- PDFs and downloadable documents

Pages that should NOT be auto-extracted:

- Login pages and dashboards
- Banking, health, or sensitive portals
- Pages with explicit no-extract directives
- Streaming media pages
- Pages the user has not approved for extraction

### 2. Content Extraction

Extract page content using a layered approach:

**Layer 1 — Readable Text**

Extract the main content area: headings, paragraphs, lists, code blocks, tables. Remove navigation, sidebars, footers, cookie banners, advertisements.

**Layer 2 — Structure**

Preserve document structure:
- Heading hierarchy (H1-H6)
- Ordered and unordered lists
- Code blocks with language tags
- Tables with headers
- Links with anchor text
- Blockquotes and callouts

**Layer 3 — Metadata**

Capture page metadata:
- URL and canonical URL
- Page title
- Author (if available)
- Publication date
- Last modified date
- Description/summary meta
- Open Graph tags

### 3. Content Cleaning

Apply cleaning rules:

- Remove duplicate content (nav repeated on every page)
- Collapse multiple blank lines
- Normalize whitespace
- Fix broken Unicode
- Preserve meaningful formatting (bold, italic, code)
- Remove tracking parameters from URLs
- Strip session-specific query parameters

### 4. Markdown Conversion

Convert cleaned content to structured markdown:

```markdown
---
source: https://docs.example.com/api/v2
title: API Reference v2
fetched: 2026-06-21T10:00:00Z
type: documentation
---

# API Reference v2

## Authentication

All requests require a Bearer token...

## Endpoints

### GET /items

Returns a list of items...

```

### 5. Context Compression

Before using context in AI interactions:

- Summarize sections that are not directly relevant to the current task
- Keep code examples, API signatures, and configuration verbatim
- Preserve error message patterns and troubleshooting steps
- Remove marketing copy and promotional content
- Keep the context under token limits for the current provider/model

## Use Flows

### Summarize Flow

User: "Summarize this page"

1. Extract page content
2. Identify key sections
3. Generate concise summary with source citation
4. Display summary with "Source: [page title](url)"

### Ask Flow

User: "Ask about this page: how does authentication work?"

1. Extract page content
2. Identify relevant sections for the question
3. Ground answer in extracted content only
4. Cite specific sections when possible
5. Flag if the page does not contain the answer

### Explain Flow

User: "Explain this concept from the page"

1. Extract page content
2. Identify the concept and surrounding context
3. Generate clear explanation using page content as source
4. Provide analogies and examples grounded in the text
5. Link back to source section

### Lesson Flow

User: "Turn this page into a learning lesson"

1. Extract page content
2. Identify learning objectives
3. Structure as lesson: concept → example → practice
4. Include key takeaways
5. Add source references for further reading

## Save to Memory

### Approval Gate

Before saving any web content to Tera memory:

1. Show user what will be saved (title, source, size)
2. Ask for explicit approval
3. Allow user to edit or trim before saving
4. Store with full source metadata
5. Make it clear this was web-sourced content

### Memory Storage

When approved, store as structured memory:

```json
{
  "type": "web-context",
  "source": "https://docs.example.com/api/v2",
  "title": "API Reference v2",
  "savedAt": "2026-06-21T10:00:00Z",
  "content": "clean markdown...",
  "tags": ["api", "authentication", "v2"],
  "userApproved": true
}
```

### Memory Retrieval

When answering future questions:

1. Check local memory for relevant web context
2. If found, use as primary source
3. If stale (older than 30 days), note the age
4. Offer to re-fetch if content may have changed

## Source Metadata

Every piece of web context carries metadata:

| Field | Purpose |
|-------|---------|
| `source` | Original URL |
| `title` | Page title |
| `fetchedAt` | When content was extracted |
| `contentType` | documentation, blog, api, issue, release |
| `language` | Content language |
| `version` | Doc version if versioned |
| `checksum` | Content hash for change detection |

## User Privacy

### Principles

- Never extract content from private pages without explicit user approval
- Never store credentials, cookies, or session data from pages
- Never share extracted content with third parties
- Never use extracted content for profiling or advertising
- Default to session-scoped context (discarded when Tera closes)

### Data Lifecycle

1. **Session context**: Extracted on demand, used in current session, discarded on close
2. **Saved memory**: User-approved content stored locally, deletable at any time
3. **Export context**: User-initiated export of context for use in other tools

## Rate Limits

### Self-Imposed Limits

- Maximum 10 page extractions per minute
- Maximum 100 page extractions per session
- Cache extracted content for 1 hour (re-fetch if stale)
- Respect server `Retry-After` headers
- Back off on 429/503 responses

### User-Controlled Limits

- Users can disable auto-extraction entirely
- Users can set per-domain extraction limits
- Users can block specific domains from extraction
- Users can clear all cached web context at any time

## Future: Research Mode

Multi-page research workflow:

1. User defines a research question
2. Tera identifies relevant pages from a starting URL
3. Extracts and cleans content from multiple pages
4. Synthesizes findings into a structured research summary
5. Preserves source trail for every claim
6. Stores research session for later reference

## Future: Document Ingestion

Direct document processing:

- PDF extraction with section preservation
- DOCX to markdown conversion
- Spreadsheet to structured data
- Code repository browsing
- API specification parsing (OpenAPI, GraphQL)

## Backend API Boundary

Tera Browser handles extraction locally. No web content is sent to external servers for processing.

- All extraction runs in the browser process
- Cleaned content stays on the user's device
- Memory storage is local (SQLite/JSON)
- No telemetry on what pages were extracted
- No cloud processing of web content
