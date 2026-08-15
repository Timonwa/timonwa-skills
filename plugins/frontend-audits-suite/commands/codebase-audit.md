---
name: codebase-audit
description: >-
  Manually invoked. Broad repo-health triage that routes to the deep audits and covers the code-quality
  hygiene no other audit owns — tech debt (TODO/FIXME), dead/unused code, TypeScript strictness,
  error-handling consistency, test coverage of shared/critical paths, and git hygiene. Verifies each
  finding and writes a prioritized report with an overall health score. Not on by default. Self-contained;
  the house standards `typescript-best-practices`, `code-structure`, and `devops` are an optional
  enhancement. Part of the house audits family (see `audit-all`).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
argument-hint: "[phase] [path]"
model: opus
effort: high
---

# Codebase audit

A **manually-invoked, red-team codebase audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/codebase-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`typescript-best-practices`**, **`code-structure`**, and **`devops`** ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/codebase-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/codebase-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/codebase-audit.md`:

```
# Codebase audit — <app/scope>

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
| Tech debt | <X>/10 | <one-line justification> |
| Dead code | <X>/10 | <one-line justification> |
| TypeScript strictness | <X>/10 | <one-line justification> |
| Error handling | <X>/10 | <one-line justification> |
| Tests | <X>/10 | <one-line justification> |
| Git hygiene | <X>/10 | <one-line justification> |

## Deep audits to run next
<Triage pointer — for each domain that showed smells, name the audit to run and why. Keep this shallow; the depth lives there. If the owner audit isn't installed, flag the domain for a focused manual review instead.>

| Domain | Signal spotted | Run |
| --- | --- | --- |
| <e.g. authorization> | <e.g. route with no role guard> | `rbac-audit` |

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

- **Full report** → `_reports/codebase-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Routing — hand off to a deep audit, or flag for manual review

This map keeps codebase-audit shallow: when the sweep surfaces a smell in a domain another audit owns, **don't investigate it here** — record a one-line signal in the report's "Deep audits to run next" table. The handoff is **not a hard dependency**. For each row:

- **If the owner audit is installed** — point at it (record "run `X-audit`") and leave the depth to it.
- **If it isn't** — don't assume it exists. Flag the domain as **"needs a focused manual review"**, note the signal you spotted, and still surface it so the gap is visible. Never route to a skill you can't confirm is available.

| Smell you spot                                                                                                                         | If installed, hand off to | Otherwise flag for manual review |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------- |
| XSS sink, weak/missing Content Security Policy (CSP), secret in bundle, injection, Server-Side Request Forgery (SSRF), fail-open catch | `security-audit`          | Focused security review          |
| Route/action with no role check, "logged-in ≠ authorized", IDOR, tenant leak                                                           | `rbac-audit`              | Focused authorization review     |
| Route handler missing Zod validation, rate limit, pagination, typed errors, response builder                                           | `api-audit`               | Focused API-layer review         |
| Dependency version drift, unused/duplicate deps, stale lockfile, known vulnerability                                                   | `dependency-audit`        | Focused dependency review        |
| Missing `.env.example`, unvalidated env at boot, `NEXT_PUBLIC_` misuse, committed env file                                             | `environment-audit`       | Focused env/secrets review       |
| Missing labels/alt/focus, poor contrast, keyboard traps, ARIA misuse                                                                   | `accessibility-audit`     | Focused accessibility review     |
| Waterfalls, missing memo/code-split, oversized bundle, unoptimized images, N+1                                                         | `performance-audit`       | Focused performance review       |
| Generic/library-default UI, inconsistent tokens, unstructured components/sections                                                      | `frontend-audit`          | Focused frontend/UI review       |
| Naming/structure/routing drift from the project's own documented conventions                                                           | `conventions-audit`       | Focused conventions review       |
| Missing page metadata, no sitemap/robots, absent structured data                                                                       | `seo-code-audit`          | Focused SEO review               |

## Checklist — code-quality hygiene (owned here)

This is what codebase-audit investigates itself, and it stands alone: every check states its criterion inline, so the sweep runs in full even with no other skill installed. Standards references (`→ skill`) are optional pointers to the fuller rule, not prerequisites. Keep it broad and generic; anything domain-specific routes above.

### Tech debt

- Count `TODO` / `FIXME` / `HACK` / `XXX` / `@deprecated` markers; flag old or business-critical ones — a `FIXME` on an auth or payment path is `HIGH`, a stray `TODO` is `LOW`.
- Commented-out code blocks left in source — dead weight; git history is the archive, so it should be deleted.
- Duplicated logic (copy-pasted blocks/near-identical functions) that should be extracted; magic numbers/strings that should be named constants.
- Oversized units — files or functions well past the house norm (e.g. a multi-hundred-line file, a function doing many jobs) that signal debt.

### Dead code

- Unused **exports**, whole unreferenced **files/modules**, unused local **vars/imports** (→ `code-structure`).
- **Unreachable branches** — code after a `return`/`throw`, conditions that can't be true, disabled feature paths, dead feature flags never toggled on.

### TypeScript strictness

- `strict` (and its family — `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` where the house uses it) is on in `tsconfig`; flag `strict: false` or the family disabled (→ `typescript-best-practices`).
- No `any` (explicit or implicit on params/returns), no unsafe `as` casts (especially `as unknown as`, `as any`), no non-null `!` used to paper over nullability, no `@ts-ignore` / `@ts-expect-error` silencing real errors.
- No untyped external boundaries — network/JSON/`process.env`/user input consumed without validation or a declared type (a Zod schema where the house parses at the edge).

### Error handling

- Consistent, **typed** errors — no throwing bare strings or plain objects; a shared error shape where the house has one.
- No **empty catches** and no **swallowed errors** — every catch logs, rethrows, or handles; no `catch {}` that only `console.log`s and continues on a critical path.
- No unhandled promise rejections or **floating promises** (async calls not awaited/handled); async paths in loops/handlers actually settle.

### Tests

- A test setup exists and is runnable at all (a test script + runner configured) — flag a repo with source but no test infrastructure.
- Shared functions, critical business paths (auth, payments, data mutations), and API routes have **at least one behavioral test** — flag ones that don't.
- No **skipped/disabled** tests (`.skip` / `.only` / `xit` / `describe.only`) left committed; no empty test bodies or assertion-free tests that always pass.

### Git hygiene

- No **committed secrets** (API keys, tokens, private keys, credentials in tracked files), large binaries, or build artifacts (`dist/`, `build/`, `.next/`, coverage, `node_modules/`) tracked — verify with `git ls-files` before flagging (→ `devops`).
- `.gitignore` exists and is sane — covers env files, build/artifact dirs, dependency dirs, and OS/editor cruft.
- Committed `.env` files with real values, or an `.env`-style file tracked at all (only `.env.example` should be) — cross-check with `git ls-files`.
- No leftover **debug logging** (`console.log`, `debugger`, `print`, verbose dumps) in shipped/non-test code.
- No unresolved **merge-conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) left in tracked files.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
