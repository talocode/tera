# Tera — Your AI Platform for Building, Coding, Writing, and Creating

> **Build anything. Ship real work. Powered by Talocode Cloud.**

Tera is a free, AI-powered platform for building, coding, writing, searching, and creating real work products. All AI runs through Talocode Cloud (`TALOCODE_API_KEY`). Built on the Talocode infrastructure, Tera gives you one workspace to code, write, research, and ship.

🌐 **Live:** [teraai.chat](https://teraai.chat)

---

## ✨ Features

### 🚀 For Builders
- Code, debug, and deploy with real-time AI assistance
- Build projects, plans, and implementation roadmaps
- Ship production-ready code from one workspace
- Connect your agent with `TALOCODE_API_KEY`

### ✍️ For Writers
- Draft, edit, and create content
- Generate marketing copy, documentation, and reports
- Export to PDF and Word
- Structured writing with citations and references

### 🔍 For Researchers
- Research with real-time web information and citations
- Deep research mode for complex investigations
- Compare options, fact-check, and synthesize findings
- Source-backed answers with live web context

### 🏗️ For Everyone
- Build, code, write, and search in one workspace
- Access real-time web information
- Upload files and documents for analysis
- Ship projects with persistent conversation history

---

## 🚀 Key Capabilities

| Feature | Free | Pro ($5/mo) | Plus ($15/mo) |
|---|---|---|---|
| AI Conversations | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| File Uploads (per day) | 3 (10MB) | 25 (500MB) | Unlimited (2GB) |
| Web Searches (monthly) | 5 | 100 | Unlimited |
| Deep Research Mode | — | ✅ | ✅ |
| Export to PDF/Word | — | ✅ | ✅ |
| Advanced Analytics | — | — | ✅ |
| Team Collaboration | — | — | ✅ |
| API Access | — | — | ✅ |

---

## Work Modes

Tera chat includes work modes that shape the assistant experience without changing existing usage limits.

- **General:** Default mode for any question or task.
- **Code:** Build, debug, review, and deploy code.
- **Write:** Draft, edit, and create polished content.
- **Search:** Research with real-time web information and citations.
- **Build:** Create projects, plans, and implementation roadmaps.

Mode configuration and prompts live in `lib/ai/chat-modes.ts`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **AI Platform** | [Talocode Cloud](https://api.talocode.site) (`TALOCODE_API_KEY`) |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL) |
| **Auth** | NextAuth.js (Google OAuth) |
| **Payments** | Lemon Squeezy |
| **Hosting** | Vercel / Cloudflare |
| **Mobile** | React Native (Expo) |
| **Charts** | Recharts |
| **Diagrams** | Mermaid.js |
| **Markdown** | react-markdown |

---

## 📁 Project Structure

```
Tera/
├── app/                    # Next.js App Router pages
│   ├── about/              # About page
│   ├── api/                # API routes (billing, auth, agent)
│   ├── auth/               # Authentication pages
│   ├── help/               # Help center
│   ├── history/            # Chat history
│   ├── new/                # New chat
│   ├── notes/              # Notes feature
│   ├── pricing/            # Pricing page
│   ├── privacy/            # Privacy policy
│   ├── terms/              # Terms of service
│   └── tools/              # AI tools page
├── components/             # React components
│   ├── visuals/            # Chart, Mermaid, Spreadsheet renderers
│   ├── AppLayout.tsx       # Main app layout
│   ├── PromptShell.tsx     # Main chat interface
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── ...
├── lib/                    # Core logic & utilities
│   ├── mistral.ts          # AI platform integration & system prompt
│   ├── talocode.ts         # Talocode Cloud client
│   ├── supabase.ts         # Database client
│   ├── auth.ts             # Authentication config
│   ├── tools-data.ts       # Tool definitions
│   └── ...
├── mobile/                 # React Native mobile app (Expo)
│   ├── app/                # Expo Router pages
│   └── ...
├── backend-server/         # Backend API server
├── styles/                 # Global CSS
└── public/                 # Static assets & images
```

---

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project
- TALOCODE_API_KEY

### Environment Variables
```env
TALOCODE_API_KEY=your_talocode_api_key
TALOCODE_BASE_URL=https://api.talocode.site
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation
```bash
# Clone the repo
git clone https://github.com/Abdulmuiz44/Tera.git
cd Tera

# Install dependencies
npm install

# Run development server
npm run dev
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

---

## 🎨 Design System

Tera uses a custom design system with CSS variables for theming:

| Token | Purpose |
|---|---|
| `tera-bg` | Background color |
| `tera-primary` | Primary text color |
| `tera-secondary` | Secondary text color |
| `tera-panel` | Panel/card backgrounds |
| `tera-border` | Border colors |
| `tera-neon` | Accent/highlight color |
| `tera-muted` | Muted backgrounds |

Supports **dark mode** and **light mode** via `ThemeProvider`.

---

## 📊 Work Tools

Tera includes specialized tools for different use cases:

- **Code Assistant** — Build, debug, review, and deploy code
- **Writing Assistant** — Draft, edit, and create content
- **Research Assistant** — Web research with citations and sources
- **Build Planner** — Create projects, plans, and roadmaps
- **File Upload** — Analyze documents, images, and data
- **Web Search** — Real-time info with citations
- **Persistent Notes** — Keep work organized across sessions
- **Conversation History** — Return to previous work anytime

---

## 🔒 Security & Privacy

- Enterprise-grade encryption
- GDPR & CCPA compliant
- No selling of user data
- Secure Google OAuth authentication
- Data stored in Supabase with row-level security
- All AI calls route through Talocode Cloud via `TALOCODE_API_KEY`

---

## 📬 Contact

- **Primary email:** admin@teraai.chat
- **Backup email:** teraaiguide@gmail.com
- **Website:** [teraai.chat](https://teraai.chat)

---

## Talocode Domains

| Domain | Purpose |
|--------|---------|
| [talocode.site](https://talocode.site) | Main site / homepage |
| [docs.talocode.site](https://docs.talocode.site) | Documentation |
| [api.talocode.site](https://api.talocode.site) | API endpoint |
| [dashboard.talocode.site](https://dashboard.talocode.site) | Cloud dashboard |
| [stacklane.talocode.site](https://stacklane.talocode.site) | Stacklane platform |

## 💖 Support Talocode

Talocode builds open-source workflow layers for builders: coding agents, writing tools, trading intelligence, video workflows, and local-first automation.

If Tera helps you ship real work, you can support the work here:

[![Sponsor Abdulmuiz44](https://img.shields.io/badge/Sponsor-Abdulmuiz44-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Abdulmuiz44)

## 📄 License

© 2025 Tera. All rights reserved. Built for shipping real work.

## Talocode ecosystem

Part of **[Talocode](https://github.com/talocode)** — open-source workflow layers for builders. Explore sibling projects:

| Project | What it is |
|---------|------------|
| **[Tera](https://github.com/talocode/tera)** | AI platform for building, coding, writing **(this repo)** |
| **[StackLane](https://github.com/talocode/stacklane)** | Cloud control plane, keys, wallet |
| **[Codra](https://github.com/talocode/codra)** | Coding agent runtime |
| **[Agent Browser](https://github.com/talocode/agent-browser)** | Browser automation API |
| **[SearchLane](https://github.com/talocode/searchlane)** | Search layer for agents |
| **[DocuLane](https://github.com/talocode/doculane)** | Office document CLI |
| **[ClipLoop](https://github.com/talocode/cliploop)** | Short-form video loop |
| **[Tradia](https://github.com/talocode/tradia)** | Trading intelligence |
| **[GateLane](https://github.com/talocode/gatelane)** | Policy / gate tooling |
| **[ContextLane](https://github.com/talocode/contextlane)** | Context infrastructure |
| **[MemoryLane](https://github.com/talocode/memorylane)** | Persistent agent memory |
| **[SignalLane](https://github.com/talocode/signallane)** | X growth intelligence |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)
