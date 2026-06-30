# Tera API Domain Routing

## Canonical Base URL

```
TALOCODE_BASE_URL=https://api.talocode.xyz
https://api.talocode.xyz/v1/tera/writing/rewrite
```

## Alias Base URL

```
https://api.teraai.chat/v1
```

## Current Implementation

API routes exist under:

```
/api/v1/writing/rewrite
/api/v1/writing/draft
/api/v1/coding/explain
/api/v1/coding/review
/api/v1/health
/api/v1/capabilities
/api/v1/pricing
/api/v1/tera/writing/rewrite      (namespaced alias)
/api/v1/tera/writing/draft         (namespaced alias)
/api/v1/tera/coding/explain        (namespaced alias)
/api/v1/tera/coding/review         (namespaced alias)
```

A Next.js rewrite rule maps `/v1/:path*` → `/api/v1/:path*`. This means all these URLs work:

- `https://api.talocode.xyz/v1/tera/writing/rewrite` (canonical)
- `https://api.talocode.xyz/v1/writing/rewrite` (legacy)
- `https://api.teraai.chat/v1/writing/rewrite` (alias)
- `https://teraai.chat/api/v1/writing/rewrite` (main app)

## Routing Strategies

### Option A: Same Site, Branch Deploy (Recommended for v0.1)

Deploy the feature branch to a Netlify branch subdomain and point `api.teraai.chat` to it.

1. Deploy branch `feat/tera-api-v0.1` to Netlify
2. Netlify creates `feat--tera.netlify.app` automatically
3. Set `api.teraai.chat` CNAME to `feat--tera.netlify.app`
4. Main app on `teraai.chat` continues serving from `main` branch

Pros: Isolated API environment, no risk to main app.
Cons: Branch deploy may lag behind main.

### Option B: Same Site, All Traffic

Point both domains to the same Netlify site.

1. `api.teraai.chat` CNAME → `tera.netlify.app`
2. `teraai.chat` CNAME → `tera.netlify.app`
3. Both domains serve the same Next.js app
4. API routes return JSON regardless of domain
5. Existing app routes are unaffected (no route conflicts)

Pros: Single deployment, no duplication.
Cons: API routes accessible on main domain too (acceptable for v0.1).

### Option C: Separate Site

Create a second Netlify site dedicated to the API.

1. New Netlify site from the same repo
2. Configure build to only include API-related code
3. `api.teraai.chat` CNAME → `<api-site>.netlify.app`

Pros: Full isolation, independent scaling.
Cons: Duplicated infrastructure, more maintenance.

## DNS Plan

| Record | Type | Value | Notes |
|--------|------|-------|-------|
| api.talocode.xyz | CNAME | talocode.netlify.app | Canonical Talocode Cloud API |
| api.teraai.chat | CNAME | tera.netlify.app | Same site as teraai.chat (Option B) |
| api.teraai.chat | CNAME | feat--tera.netlify.app | Branch-specific (Option A) |

If using a Cloudflare Worker or custom proxy later:

| Record | Type | Value | Notes |
|--------|------|-------|-------|
| api.teraai.chat | A | 192.0.2.1 | Worker IP (replace with actual) |

## Netlify Configuration

The `netlify.toml` file contains the base configuration. No custom redirects are required for Option B because Next.js rewrites handle the path mapping.

If domain-specific redirects are needed later (e.g., only allow `/v1/*` on `api.teraai.chat`), add:

```toml
[[redirects]]
  from = "https://api.teraai.chat/v1/*"
  to = "/api/v1/:splat"
  status = 200
  force = true
```

## Environment Variables

See `TERA_API_RELEASE_CHECKLIST.md` for the full env checklist.
