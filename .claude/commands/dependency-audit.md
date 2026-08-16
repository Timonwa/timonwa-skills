---
name: dependency-audit
description: >-
  Manually invoked. Dependency-health audit of a monorepo — version consistency across workspace members, unused/duplicate/misplaced dependencies, workspace-protocol usage (`workspace:*`), the pnpm catalog, deprecated-package regressions, lifecycle scripts, lockfile integrity, and known vulnerabilities (`pnpm audit`). Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `devops` and `turborepo-monorepo` are an optional enhancement. Part of the house audits family (see `audit-all`).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
argument-hint: "[phase] [path]"
model: opus
effort: high
---

# Dependency audit

A **manually-invoked, red-team dependency audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/dependency-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`devops`** and **`turborepo-monorepo`** ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/dependency-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/dependency-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/dependency-audit.md`:

```
# Dependency audit — <app/scope>

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
| Version consistency | <X>/10 | <one-line justification> |
| Workspace protocol | <X>/10 | <one-line justification> |
| Unused deps | <X>/10 | <one-line justification> |
| Duplicates | <X>/10 | <one-line justification> |
| Removed-package regressions | <X>/10 | <one-line justification> |
| Vulnerabilities & supply chain | <X>/10 | <one-line justification> |
| Lockfile | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/dependency-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Read the root `package.json`, `pnpm-workspace.yaml` (incl. its `catalog:` block), every member `package.json` (`apps/*`, `packages/*`, any `functions/*`), and the lockfile (`pnpm-lock.yaml`). Everything you need to judge each item is inlined below; `turborepo-monorepo` / `devops` add fuller rationale _if_ installed, but aren't required.

### Version consistency

- Shared runtime/framework deps hold the **same major/minor** across every member — e.g. `next`, `react`/`react-dom`, `typescript`, `tailwindcss`, `zod`, `firebase-architecture`/`firebase-admin`. A member one **major** behind is `HIGH`; one **minor** behind is `MEDIUM`.
- Coupled pairs move together: `react` + `react-dom` share a version; `firebase-architecture` + `firebase-admin` stay compatible; a plugin matches its host (`@types/react` ↔ `react` major, `eslint-*` ↔ `eslint`, `@tailwindcss/*` ↔ `tailwindcss`).
- Framework/runtime deps shared across apps are **pinned once via the pnpm catalog** — `catalog:` in `pnpm-workspace.yaml`, referenced as `"next": "catalog:"` in each member — not repeated as literal ranges that silently drift. A shared dep with divergent literal ranges that _should_ be a catalog entry is a finding.
- **Root vs member** versions for the same dep don't disagree; a `pnpm.overrides` / `resolutions` entry doesn't mask a member declaring a conflicting range.
- Ranges are consistent in style and not dangerously loose — no bare `*` or `latest` on a runtime dep, and no mix of pinned-exact vs `^`/`~` for the same shared package.

### Workspace protocol

- Internal `@app/*` packages are referenced with **`workspace:*`**, never a literal version or range (a literal version won't resolve to the local package and will drift).
- Every internal package a member imports is actually **declared** as a dependency of that member — no relying on hoisting / phantom dependencies. Likewise no dep is declared but the package doesn't exist in the workspace.
- Internal packages sit in the right field: build/type-only ones (`typescript-config`, `eslint-config`, `tailwind-config`) in `devDependencies`; runtime ones (`ui`, `utils`, `hooks`, `schemas`) in `dependencies`.

### Unused deps

- Each declared dep (in `dependencies` / `devDependencies`) is imported somewhere in that member — `import`, `require`, dynamic import, CSS `@import`, or a config-file plugin reference.
- **Don't flag** compiler/tooling deps used indirectly: `typescript`, `@types/*`, `eslint*`, `@tailwindcss/*`, `turbo`, `postcss`/`autoprefixer`, formatters, test runners, build tools, and declared **peer dependencies**.
- **Misplaced deps** — a package used only in build/test/config lives in `devDependencies`, not `dependencies` (bloats what ships / gets installed in prod); a package imported by shipped runtime code isn't hiding in `devDependencies`.
- **Missing deps** — a package imported in a member's source but not declared anywhere in that member's manifest (resolving only via hoisting) is a finding, since it breaks under stricter installs.

### Duplicates

- No package resolves to **multiple versions** in the lockfile — focus on heavy or singleton-sensitive ones (`react`, `react-dom`, `next`, `firebase-architecture`, `zod`, state/context libs) where two copies cause bloat or "two Reacts" runtime bugs. Confirm with `pnpm ls --depth 0` (or `pnpm why <pkg>`) per member and by grepping the lockfile.
- **Overlapping/redundant** packages that solve the same job in one tree (two date libs, two HTTP clients, two icon sets) — flag for consolidation.

### Removed-package regressions

- Deliberately dropped / replaced packages haven't crept back in any member (deprecated-or-replaced packages the house no longer uses — e.g. an HTTP client superseded by native `fetch`, a client data-fetching lib superseded by Server Components/Actions, sitemap/SEO packages superseded by the Next Metadata/route conventions). Flag as a regression.
- **Deprecated / unmaintained** packages generally — anything `pnpm install` reports as `deprecated`, or a package with no releases in years where a maintained successor exists.

### Vulnerabilities & supply chain

- Run **`pnpm audit`**; triage **critical/high** advisories — package, severity, advisory, whether a **non-major** fix exists. Non-major fixes are low-risk; major-only fixes are recommendations.
- **Lifecycle-script exposure** — note dependencies with `postinstall`/`preinstall`/`install` scripts (the top npm-malware vector); the house default is to **disable install scripts** (`ignore-scripts`) and allow-list only packages that genuinely need one. Flag if scripts run unrestricted.
- Prefer deps published with **provenance** (npm green-check / Trusted Publishing) for anything newly added or newly relied on.

### Lockfile

- The lockfile (`pnpm-lock.yaml`) is **committed** and **in sync** with the manifests — `pnpm install --frozen-lockfile` succeeds with **no changes**. A drifted or uncommitted lockfile is `HIGH` (it means CI installs something different from local, and `--frozen-lockfile` in CI will fail).
- Exactly **one** lockfile at the workspace root; no stray `package-lock.json` / `yarn.lock` from another package manager, and `packageManager: "pnpm@…"` is set so `corepack` pins the version.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
