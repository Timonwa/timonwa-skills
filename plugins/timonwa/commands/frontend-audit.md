---
name: frontend-audit
description: >-
  Manually invoked. Self-contained Next.js App Router frontend audit — Pages Router residue, thin route/entry files and feature-grouped sections, the server/client boundary, server-side data fetching, Server Actions placement, caching tiers and revalidation, Metadata API usage, component organization and shared-UI adoption, and React 19 idioms. Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `nextjs-best-practices`, `code-structure`, `reusables`, and `react-best-practices` are an optional enhancement, and deep performance goes to `performance-audit` while client security goes to `security-audit`. Part of the house audits family (see `audit-all`).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
argument-hint: "[phase] [path]"
model: opus
effort: high
---

# Frontend audit

A **manually-invoked, red-team frontend audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/frontend-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`nextjs-best-practices`**, **`code-structure`**, **`reusables`**, and **`react-best-practices`** (deep perf → **`performance-audit`**; client security → **`security-audit`**) ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/frontend-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/frontend-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/frontend-audit.md`:

```
# Frontend audit — <app/scope>

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
| Router hygiene | <X>/10 | <one-line justification> |
| Page structure | <X>/10 | <one-line justification> |
| Server/client boundary | <X>/10 | <one-line justification> |
| Data fetching | <X>/10 | <one-line justification> |
| Mutations | <X>/10 | <one-line justification> |
| Caching | <X>/10 | <one-line justification> |
| Components | <X>/10 | <one-line justification> |
| React | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/frontend-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Enumerate from each app's `app/` route tree, its component tree, and its server data layer. Each item states its own pass/fail criterion — run the whole checklist without any other skill. Where a fix benefits from deeper guidance, the optional references (`nextjs-best-practices` / `code-structure` / `reusables` / `react-best-practices`) are noted, but they're never needed to detect the issue.

### Router hygiene

- **Zero Pages Router residue** — no `pages/` dir, `_app`/`_document`/`_error`, `getServerSideProps`/`getStaticProps`/`getStaticPaths`/`getInitialProps`, or `next/router` imports (use `next/navigation`); no legacy SEO stack (`next-seo`/`NextSeo`, `next-sitemap`).
- **No `next/head`** — page/route metadata comes from the Metadata API (`metadata` export or `generateMetadata`), never a `next/head` or custom head component.
- **Async `params`/`searchParams`** — dynamic segments and search params are `await`ed (they are promises in current Next); flag props destructured as sync objects or read without `await`.
- **Route-level UI boundaries present** — a data-fetching segment has a `loading.tsx` (streaming/Suspense fallback) and, where an error is possible, an `error.tsx`; dynamic routes that can 404 call `notFound()`/have a `not-found.tsx`. Flag a segment that fetches with no loading or error boundary.

### Page structure

- **Thin route/entry files** — each `page.tsx` (and `layout.tsx`) is a small Server Component that resolves data and delegates JSX to a composed `PageContent`/index; flag inline JSX beyond a few lines and client state (`useState`/`useEffect`/`useRouter`) living directly in a route file.
- **Feature-grouped, section-per-file** — content is composed from a per-page index of sections, one section/modal/hook per file, grouped by feature; flag a flat component dump or a route file that inlines whole sections.
- **Small files** — files stay small (~200 lines); flag oversized sections/components that should be decomposed.

### Server/client boundary

- **Server Components by default** — a component is server unless it needs the client; flag `use client` on files with no hook, browser API, or event handler.
- **`use client` only for hooks/browser APIs/handlers** — the directive sits on the leaf that needs interactivity, not high in the tree; flag a boundary pushed up so a whole subtree ships to the client, and barrels re-exporting server + client code together.
- **No server-only libs in the client bundle** — `next/headers` (`cookies()`/`headers()`), the server data layer, and secret-reading code stay out of client modules.

### Data fetching

- **Server-side only** — initial data is read on the server (in the route/section or the `lib/server` layer), never fetched from the client for first render; flag client fetch-in-effect and `useFetch`/`useQuery`-style hooks for initial data, plus `axios`/`apiClient` calls to internal APIs from client code.
- **Parallelized, no waterfalls** — independent reads run concurrently (e.g. `Promise.all`), not awaited one after another; flag sequential awaits that have no data dependency. (Perf depth → `performance-audit`.)

### Mutations

- **Server Actions in the server boundary** — writes are Server Actions in the server layer (`"use server"`), invoked via a `<form action>` or called from a handler; flag mutations done via client `fetch`/`axios` to an internal API, or a Server Action wrapped in a client data hook.
- **Validated with Zod** — every action validates its input with a Zod schema before doing work and returns a typed result; flag unvalidated inputs or untyped error returns.

### Caching

- **Cache tiers + revalidation** — server reads pass an explicit cache tier/lifetime and a tag; mutations revalidate the affected tags; flag uncached expensive reads, missing tags (can't be invalidated), or a revalidate call for a tag nothing sets. (Caching mechanics → `nextjs-best-practices`.)

### Components

- **Organized by feature** — components live in feature/section folders (with a shared bucket for cross-cutting ones), not a flat root; flag misplaced or root-level components.
- **Shared UI adopted, not re-implemented** — raw elements that have a shared-UI equivalent use it, and app code doesn't re-build a primitive/widget the UI package already ships; flag duplication and one-off re-implementations. (Reusable design → `reusables`.)
- **Primitives prop-driven** — shared primitives are self-contained and controlled via props with sensible defaults, no hardcoded magic values; flag context-coupled or hardcoded reusables.

### React

- **Derive, don't sync** — state derived from props/other state is computed during render, not mirrored via an effect; flag effect-driven state syncing.
- **Keys & no needless effects** — stable list keys (no index-as-key on dynamic lists); no effects for what belongs in an event handler or a derived value.
- **Let the compiler memoize** — rely on the React Compiler rather than hand-rolled `useMemo`/`useCallback`/`memo`; flag manual memoization added defensively where the compiler covers it.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
