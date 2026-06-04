# Google Search Console setup for teraai.chat

This guide covers verification, sitemap submission, and weekly SEO tracking for TeraAI.

## 1. Add a Domain property

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property type **Domain** (not URL prefix).
3. Enter: `teraai.chat`

## 2. Verify ownership (DNS TXT)

1. Copy the TXT record Google provides.
2. Add it in your DNS provider for `teraai.chat`.
3. Wait for DNS propagation (often minutes, sometimes up to 48 hours).
4. Click **Verify** in Search Console.

Do not commit verification tokens or DNS secrets to the repository.

## 3. Submit the sitemap

After deploy, confirm these URLs load:

- https://teraai.chat/robots.txt
- https://teraai.chat/sitemap.xml

In Search Console → **Sitemaps**, submit:

```
https://teraai.chat/sitemap.xml
```

The sitemap includes only public marketing pages (homepage, about, pricing, policies, help, and SEO landing pages). Private app routes (`/new`, `/api`, auth, dashboard-style pages) are excluded.

## 4. Request indexing (URL Inspection)

Use **URL Inspection** for:

- https://teraai.chat
- https://teraai.chat/ai-learning-companion
- https://teraai.chat/ai-study-assistant
- https://teraai.chat/ai-research-assistant

Click **Request indexing** after confirming the live page matches expectations (title, description, canonical, visible H1).

## 5. Weekly SEO review

Each week, record in a spreadsheet or doc:

| Metric | Where in GSC |
|--------|----------------|
| Clicks | Performance → Search results |
| Impressions | Performance → Search results |
| CTR | Performance → Search results |
| Average position | Performance → Search results |
| Top queries | Performance → Queries tab |
| Top pages | Performance → Pages tab |

### High impressions, low CTR

If a page ranks but rarely gets clicks:

1. Compare the SERP snippet to top results for the same query.
2. Tighten the **title** and **meta description** (clear benefit, specific audience).
3. Ensure the **H1** on the page matches search intent.
4. Add internal links from homepage and related SEO pages.
5. Re-check after 2–4 weeks—SEO changes need time.

**Reminder:** Organic changes are measured over weeks, not minutes. Avoid changing titles every day; give Google time to recrawl.

## 6. Post-deploy verification checklist

After each production deploy:

- [ ] https://teraai.chat/robots.txt — allows `/`, disallows private paths, lists sitemap
- [ ] https://teraai.chat/sitemap.xml — only public URLs, no `/new` or `/api`
- [ ] https://teraai.chat/ai-learning-companion — loads, correct H1 and CTA
- [ ] View source on homepage — `metadataBase`, title, description, canonical, Open Graph
- [ ] View source — JSON-LD for Organization, WebSite, SoftwareApplication
- [ ] Search Console → URL Inspection on homepage and main landing page
- [ ] No regression: sign-in, chat at `/new`, pricing, billing unchanged

## 7. Target queries (content alignment)

Primary landing page: `/ai-learning-companion` → “AI learning companion”

Supporting pages:

- `/ai-study-assistant` → “AI study assistant”
- `/ai-research-assistant` → “AI research assistant”

Homepage and about copy should reinforce: deep learning, research, and turning knowledge into projects—without claiming unimplemented features.