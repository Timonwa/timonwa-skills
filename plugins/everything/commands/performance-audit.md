---
name: performance-audit
description: >-
  Manually invoked. Frontend performance audit of a Next.js App Router app (or a diff/PR) — image optimization, server/client boundary + bundle weight, dynamic imports for heavy libs, font loading, streaming/Suspense + loading states, caching tiers + revalidation, rendering, and Core Web Vitals proxies (LCP/CLS/INP). Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `nextjs-best-practices` and `devops` are an optional enhancement. General structure is `frontend-audit`. Part of the house audits family (see `audit-all`).
argument-hint: "[phase] [path]"
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Performance audit

A **manually-invoked, red-team performance audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/performance-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`nextjs-best-practices`** and **`devops`** (general structure → **`frontend-audit`**) ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/performance-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/performance-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/performance-audit.md`:

```
# Performance audit — <app/scope>

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
| Images | <X>/10 | <one-line justification> |
| Bundle | <X>/10 | <one-line justification> |
| Server/client boundary | <X>/10 | <one-line justification> |
| Dynamic imports | <X>/10 | <one-line justification> |
| Fonts | <X>/10 | <one-line justification> |
| Streaming | <X>/10 | <one-line justification> |
| Caching | <X>/10 | <one-line justification> |
| Rendering | <X>/10 | <one-line justification> |
| Core Web Vitals | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/performance-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

First scope it: identify the **frontend routes/components** in scope (exclude API-only apps, OG image routes, and Storybook). Read `next.config` for the images and experimental config. Audit worst-first by load impact.

### Images

- `next/image` everywhere a raster image renders — flag raw `<img>` under app routes/components (allowed in a shared UI package, OG image routes, inline SVG/data-URI, favicon `<link>`).
- Every image has `alt` and stable dimensions — `width`+`height`, or `fill` on a sized parent — to prevent CLS. Responsive/`fill` images set `sizes` so a 200px slot isn't served a 4K file.
- `priority` **only** on the above-fold LCP image (hero/banner) — not sprayed across every image (which deprioritizes the real LCP).
- Every remote host is allowlisted in `images.remotePatterns` (not the deprecated `domains`); modern formats (AVIF/WebP) enabled in `images.formats`.
- No huge unoptimized raster assets shipped from `public/` (multi-MB PNG/JPG) or referenced with `unoptimized`; route them through `next/image` or pre-compress. Prefer SVG for icons/logos.

### Bundle

- No barrel / whole-library imports that defeat tree-shaking (`import { x } from "lodash"` → `lodash/x`; `import * as` on a large package). Icon libs like `lucide-react` are already tree-shakeable — don't flag.
- No server-only libraries in client code (admin SDKs, DB clients, Node built-ins `fs`/`path`/`crypto`/`child_process`) — these belong on the server side of the boundary.
- Tree-shakeable imports: named imports from ESM packages, no `require()` pulling a whole CJS lib into client code, no `import * as` on a large package. Prefer per-path imports for utilities (`lodash/x`, `date-fns/x`).
- No stray `console.log` in shipped paths (allow dev-guarded diagnostics / a real logger).
- Third-party scripts (analytics, chat, ads) load via `next/script` with the right `strategy` (`afterInteractive`/`lazyOnload`) — not a raw blocking `<script>` in the head. Flag heavy trackers that block the main thread on load.
- Confirm a byte budget guards the build — a bundle analyzer or **`size-limit`** budget. Flag if neither is wired (CI wiring detail → `devops` when present).

### Server/client boundary

- Minimize client JS: every `"use client"` file must actually need the browser (hooks, event handlers, `window`/`document`, a browser-only lib). Flag directives with none of these — they should be Server Components.
- Push interactivity to the leaves: a page marked `"use client"` for one small widget should split into a server `page.tsx` (fetch + metadata) plus a small client child. Server Components split per route automatically — don't flag heavy _server_ imports as client bundle weight.

### Dynamic imports

- Heavy and/or below-fold client components load via `next/dynamic` (or `React.lazy`) with a loading fallback — charts, rich-text editors, maps, PDF tooling, syntax highlighters, large date pickers. Flag heavy widgets behind modals/tabs/accordions that are imported eagerly at the top of the file. Don't flag always-visible above-fold widgets or small libs.

### Fonts

- Fonts load via `next/font` (google or local) in the root layout with `display: "swap"` and a subset, exposed as a CSS variable — `next/font` self-hosts and removes the extra round-trip. Flag legacy `<link>` Google-Fonts tags, `@import url(fonts.googleapis…)` in CSS, and local font files `next/font` could self-host. Preload only the fonts actually used above the fold; set `fallback`/`adjustFontFallback` to minimize font-swap CLS. For any font/asset host you still hit directly, use `<link rel="preconnect">` (not for `next/font`, which self-hosts).

### Streaming

- Heavy async segments have a sibling `loading.tsx` so users see a skeleton, not a blank screen. Where a page renders multiple independent server-fetched panels, each slow panel is wrapped in its own `<Suspense>` so one slow fetch doesn't block the rest. Don't flag static/near-instant segments where a skeleton would just flash.

### Caching

- Fetchers use the correct cache tier + `revalidate`, and tags that can be invalidated. Cache Components model: `use cache` + a named `cacheLife` tier (freshness-based, e.g. `realtime`/`frequent`/`daily`/`static`) + a `cacheTag` constant. Legacy model: `fetch(url, { next: { revalidate, tags } })` — never `unstable_cache`. Flag data with no tier, string-literal or undeclared tags, per-user data cached as shared, and duplicate per-render fetches that need `cache(...)` memoization.
- After a mutation, data is revalidated by tag (`updateTag`/`revalidateTag`) rather than left stale or blanket `revalidatePath`. Flag writes that don't invalidate what they changed.
- Avoid over-dynamic rendering — flag stray `cookies()`/`headers()`/`searchParams` reads outside `<Suspense>` that force a whole page dynamic when it could stay a static shell (an authed page that legitimately reads cookies is fine; wrap the runtime-reading part). Deeper caching tiers/revalidation how-to → `nextjs-best-practices` `references/caching.md` when installed.

### Rendering

- Stable `key` props on mapped elements (not the array index when the list reorders). No large inline object/array/`style` props recreated every render (extract to a module constant or `useMemo`) that churn child re-renders. Media/embeds carry explicit dimensions to prevent CLS. Let the React Compiler handle memoization — don't recommend manual `memo`/`useMemo` sprawl.
- Long lists use URL-driven pagination (`?page=` / a cursor in `searchParams`) rather than loading everything client-side — an unbounded fetch grows with the data and hydrates an oversized tree, while URL-driven pages stay server-rendered, cacheable, and shareable.

### Core Web Vitals

Targets (75th-percentile field data): **LCP < 2.5s · INP < 200ms · CLS < 0.1**. From code, audit the proxies:

- **LCP** — optimized `priority` hero image, no render-blocking scripts/CSS in the root layout, low TTFB (static-renderable public pages).
- **CLS** — image/embed dimensions and `next/font` `display: swap` (covered above).
- **INP** — heavy client work / large hydration / long tasks on interactive pages (big synchronous handlers, un-debounced input, oversized client trees). **INP is field-only** — it needs real interaction, so it can't be scored from code or a lab run; track it with production RUM (`web-vitals`). Note this limitation in the report rather than assigning it a code-derived score.
- Measure LCP/CLS with a lab tool (Lighthouse, ideally Lighthouse CI on money pages — CI wiring → `devops` when installed) **and** CrUX/RUM (field). Field data is what counts; lab catches regressions.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
