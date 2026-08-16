---
name: seo-code-audit
description: >-
  Manually invoked. Self-contained SEO audit of a public-facing app (or a diff/PR) — metadata (title/description/OpenGraph/Twitter/canonical), robots + sitemap + noindex hygiene, structured data / JSON-LD rich-result eligibility, crawlability + URL structure + internal linking, content quality / E-E-A-T, Core Web Vitals signals, mobile, social, AEO/GEO readiness, and analytics gating. Verifies each finding and writes a prioritized report. Not on by default. The house standards `seo`, `nextjs-best-practices`, and `html-best-practices` are an optional enhancement. Part of the house audits family (see `audit-all`).
argument-hint: "[phase] [path]"
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# SEO audit

A **manually-invoked, red-team SEO audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/seo-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`seo`**, **`nextjs-best-practices`**, and **`html-best-practices`** ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/seo-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/seo-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/seo-audit.md`:

```
# SEO audit — <app/scope>

**Date:** <YYYY-MM-DD> · **Phase:** <phase> · **Mode:** Report-only · **Branch:** `<branch>` · **Scope:** <what was audited> · **Overall:** <X>/10

## Score change (previous → current)
| Metric | Previous | Current | Δ | Trend |
| --- | --- | --- | --- | --- |
| Overall | <prev/10 or N/A> | <cur/10> | <+N / -N / 0> | <▲ / ▼ / ■ / N/A> |

## Findings
| ID | Severity | Category | Status | Issue | Location |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | <category> | NEW | <one-line issue> | `file/path:line` |

### F1 — <title>
- **What:** <the defect, and the concrete evidence that proves it real>
- **Why it matters:** <impact / who it affects> <· optional standard or criterion ref, e.g. WCAG 2.1.2 / OWASP A01>
- **Fix:** <the specific remediation>

## Scorecard
| Category | Score | Notes |
| --- | --- | --- |
| Metadata | <X>/10 | <one-line justification> |
| Crawlability & indexation | <X>/10 | ... |
| Structured data | <X>/10 | ... |
| Content quality | <X>/10 | ... |
| URL structure | <X>/10 | ... |
| Core Web Vitals signals | <X>/10 | ... |
| Mobile | <X>/10 | ... |
| Social | <X>/10 | ... |
| Answer Engine Optimization (AEO) / Generative Engine Optimization (GEO) readiness | <X>/10 | ... |
| Analytics | <X>/10 | ... |
| Internal noindex | <X>/10 | ... |

## Action items
Tiers by phase — `development` → **Fix Now / Before Launch / Post-Launch**; `production` → **Fix Now / Next Release / Backlog**. Each task references a finding ID.

### <Tier>
| # | Priority | Task (finding ID) | Effort |
| --- | --- | --- | --- |

## Resolved since last audit
| ID | Issue | How it was resolved |
| --- | --- | --- |
```

### Output

Every run produces two things:

- **Full report** → `_reports/seo-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

First scope it: identify which apps are **public-facing** (in scope) versus **internal** (auth-guarded, or `noindex` via `next.config` `X-Robots-Tag` / root-layout robots). Internal apps get only the noindex check — everything else below applies to public apps.

Then triage by site type — each has a characteristic failure mode to check first:

| Site type    | Look first for                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| SaaS         | Thin feature pages; JS-rendered content not indexed; missing comparison pages                                             |
| E-commerce   | Faceted-nav duplication; out-of-stock handling; thin category pages                                                       |
| Blog/content | Keyword cannibalization; missing author / Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T) signals |
| Local        | Inconsistent Name, Address, Phone (NAP); missing `LocalBusiness` schema                                                   |

**Audit in priority order** (a page must be crawlable and indexable before on-page/content work matters): crawlability → indexation → technical foundations (Core Web Vitals (CWV), mobile, HTTPS) → on-page → structured data → content quality → authority. Fix critical/serious findings before shipping.

> **JS-rendered-schema caveat (avoid a false finding).** `curl` / plain `fetch` / `WebFetch` strip `<script>` and can't see JSON-LD injected by JS or client components. Before reporting "no structured data," verify the _rendered_ DOM — a JS-rendering crawler, the Rich Results Test, or in-browser `document.querySelectorAll('script[type="application/ld+json"]')`.

### Metadata

- Every public route exports `metadata` or `generateMetadata` (or inherits from the house `buildMetadata` / `publicMetadata` helpers) — no route missing it. Flag Pages-Router leftovers (`next/head`, `NextSeo`, a custom `<Head>`) under `app/`.
- Resolved metadata carries `title`, `description`, self-referencing **canonical** (`alternates.canonical`, absolute), `openGraph` (title/description/images/url/type), `twitter` (card/title/description/images), and correct `robots`.
- **`metadataBase`** set on the root layout (so OG/canonical resolve relative URLs) and a **title template** (`%s · {site}`). Missing `metadataBase` is high severity — it silently breaks canonicals and OG URLs.
- **Uniqueness** — no duplicate titles/descriptions across pages. **Length** — title ~50–60 chars, description ~150–160 (guidance, pixel-width not a hard count; flag clear overruns and truncated key info).
- SEO copy lives in typed catalogs (not inlined in JSX). Dynamic routes fetch with the same per-request memoization as the page (`cache(...)`) so metadata matches rendered content.

### Crawlability & indexation

- `robots.ts` / `robots.txt` — allows public paths, disallows internal/auth paths, references the sitemap, doesn't block CSS/JS; **env-gated** (`Disallow: /` on non-prod, protecting staging). Flag a prod `Disallow: /`, or a static `public/robots.txt`/`sitemap.xml` shadowing the dynamic route, or lingering `next-sitemap` config/postbuild.
- `sitemap.ts` — lists only canonical, indexable URLs (200, not noindex/redirected), current `lastModified`; pulls the host from config/env, never hardcoded. Large sites split via `generateSitemaps()`.
- **Indexation** — the right pages are indexed and only those: no stray `noindex` on pages that should rank; no important page `Disallow`ed (which blocks Google from _seeing_ a `noindex`); no soft 404s; duplicates consolidated via canonical or 301.
- **Canonicalization** — self-referencing canonical on every indexable page; not pointing at the homepage, not looping; one host (HTTP→HTTPS, single www/non-www) and one trailing-slash + case policy, enforced by 301; redirect chains/loops resolved.
- **Reachability** — navigation is crawlable HTML `<a href>` (not JS-only); important pages within ~3 clicks; **no orphan pages** (every page has ≥1 internal link); descriptive anchor text. Large sites: kill parameter/faceted duplication and keep session IDs out of URLs.
- **Infinite scroll** — any infinite-scroll listing has a paginated fallback (real, crawlable page URLs); content reachable only by scrolling is invisible to crawlers.
- **HTTPS** — valid certificate site-wide, no mixed content (HTTP subresources on HTTPS pages).

### Structured data

- JSON-LD only (never microdata for new work); rendered via an **XSS-safe** component (escape `<` → `<`); mark up only content that's actually on the page.
- Nodes carry stable `@id` and cross-reference into one **connected graph** (Organization + WebSite sitewide, page-specific types on the page) — flag disconnected islands.
- Validate eligibility, not just syntax — **valid ≠ displayed**. **FAQPage / HowTo no longer produce rich results for most sites** (flag reliance on them for rich results; fine for entity understanding). **Warn on self-authored `aggregateRating` / `review`** — genuine UGC only, or risk a manual action.

### Content quality

- **E-E-A-T signals** — named authors with credentials on content pages; claims cite sources; about + contact pages exist; policies (privacy, terms; returns/editorial where relevant). Weight these hardest for **Your Money or Your Life (YMYL)** topics (money, health, safety, legal), where Google demands the most trust evidence.
- **Keyword mapping** — each indexable page has one clear primary query target, aligned across title / H1 / URL. **No two pages target the same query** — that's cannibalization; flag it and recommend consolidating (merge + 301) or re-targeting one page.

### URL structure

- Clean slugs — lowercase, hyphenated, readable (`/events/summer-fest`, not `/events/abc123` or underscores/uppercase); mirror the hierarchy.
- One trailing-slash policy (`trailingSlash`), enforced. Custom **404 and 500** pages exist. Redirects for every removed/changed URL are 301 (preserve link equity), no chains.

### Core Web Vitals signals

Targets (75th percentile field data): **LCP < 2.5s · INP < 200ms · CLS < 0.1**. From code, audit the proxies:

- **LCP** — the hero/LCP image uses optimized delivery (`next/image` / modern formats, `priority`), no render-blocking scripts/CSS injected in the root layout, TTFB kept low (public marketing/legal pages stay statically renderable — flag stray `cookies()` / `headers()` that force dynamic rendering).
- **CLS** — explicit `width`/`height` (or aspect ratio) on images; fonts loaded via `next/font` with `display: "swap"` (flag `<link>`/`@import` Google-Fonts).
- **INP** — watch heavy client-side work / large hydration on interactive pages.
- Measure with PageSpeed Insights / Lighthouse (lab) **and** CrUX / Search Console (field) — field data is what Google uses.

### Mobile

- Responsive layout; correct `<meta name="viewport">` — flag any override with `maximum-scale=1` / `user-scalable=no` (also an accessibility fail → `accessibility`). No fixed-width layouts. Google indexes the mobile render, so audit mobile-first.

### Social

- OG image exists, **1200×630**, absolute URL, with alt text; a dynamic `/api/og` endpoint where useful. Twitter card `summary_large_image` for visual content. Social metadata is page-specific, not just the sitewide default on every page.

### AEO / GEO readiness

- Content is **extractable** — each section leads with a direct, self-contained answer; intent-matched blocks (definition, steps, comparison table, FAQ); sources cited with dates; content kept fresh.
- The AI crawlers you want citations from (GPTBot, PerplexityBot, ClaudeBot, Google-Extended…) aren't blocked in `robots` when citations are wanted.

### Analytics

- Analytics / tag manager present and **gated to production** (not firing in dev). Search Console verification (meta tag or DNS TXT) in place.

### Internal noindex

- Every non-public app (admin, console, API-facing) is `noindex` via `X-Robots-Tag: noindex, nofollow` in `next.config`, or root-layout / per-page `robots: { index: false, follow: false }` (or the house `noIndexMetadata` helper). Any internal app missing it is a finding.

> **Don't report as ranking signals** — bounce rate, time on page, pages/session (UX diagnostics only). For migrations (the highest-risk SEO event): map every old URL → new with a 1:1 301, preserve titles/descriptions/canonicals/structured data, don't block the new site in robots, regenerate + resubmit the sitemap, keep internal links pointing at final URLs, and monitor GSC coverage after.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
