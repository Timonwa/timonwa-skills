---
name: environment-audit
description: >-
  Manually invoked. Environment + secrets audit — Zod-validated env at boot (no direct `process.env` reads), env-file presence, `.env.example` completeness, nothing in env that isn't a secret, `NEXT_PUBLIC` vs server-only correctness, no secrets committed or exposed to the client, cross-app consistency, and `APP_ENV` vs `NODE_ENV` usage. Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `devops` (env strategy) and `backend-security` (secret hygiene) are an optional enhancement. Part of the house audits family (see `audit-all`).
argument-hint: "[phase] [path]"
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Environment audit

A **manually-invoked, red-team environment audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/environment-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`devops`** and **`backend-security`** ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/environment-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/environment-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/environment-audit.md`:

```
# Environment audit — <app/scope>

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
| Validation | <X>/10 | <one-line justification> |
| Completeness | <X>/10 | <one-line justification> |
| Public vs server | <X>/10 | <one-line justification> |
| Secret leak | <X>/10 | <one-line justification> |
| Tiering | <X>/10 | <one-line justification> |
| Cross-app / parity consistency | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/environment-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Audit every app with a `.env.example`, its leaf `config/env.ts`, and the repo `.gitignore`. The criteria below are complete on their own; if the `devops` (env strategy) and `backend-security` (secrets) skills are installed, they add extra rationale and house patterns.

### Validation

- **Zod at boot** — env is parsed and validated with Zod at module level in a leaf `config/env.ts` (imports only zod), so missing/invalid vars fail fast at startup, not at first use. The validated `env` object is the only export other code imports.
- **No raw reads** — no app code reads `process.env.*` directly (grep for `process.env`); all access goes through the validated `env` object. Allowlist the legitimate direct readers before flagging: the env module itself, `next.config.ts`, `app/global-error.tsx` (must render even when env validation throws), test setup files, and standalone scripts under `scripts/`. Environment-flag helpers (`isProd`/`isDev`) derive from validated `env`, not raw `process.env`.
- **No silent passes** — required vars have no empty-string `.default("")` or `.optional()` masking a genuinely-required value; each has the _right_ Zod type and bound (`z.string().url()`, `z.enum([...])`, `z.string().min(1)`, `z.coerce.number()` for numerics, `z.coerce.boolean()` for flags) — not a bare `z.string()` where a URL/number/enum is meant.
- **Fails on unknown/extra keys where it should** — schema doesn't silently accept typo'd or stray keys that then read as `undefined` at use sites.

### Completeness

- **An env file is present per app** — an app with a `.env.example` counts as configured if `.env` OR `.env.local` exists (Next.js loads both); never flag an app for lacking `.env.local` specifically.
- **Example tracks required vars** — every var the schema requires appears in `.env.example`; no schema var is missing from the example (developer won't know to set it) and no example var is dead config (absent from the schema). Names match exactly between schema, example, and use sites (no casing/typo drift).
- **No local extras** — vars present in local env files but absent from `.env.example`/the schema are deprecated vars or typos; flag them.
- **Nothing in env that isn't a secret** — apply the one gate from `devops`: would leaking this value hurt? A base URL, cookie domain, CORS origin, allowlist, analytics id, project id, or public key answers no, so it belongs in a committed config module keyed off `APP_ENV`, not in `.env`. Flag each one, and say which tier's value is missing from config.
- **`.env.example` is placeholder-only and self-documenting** — every entry has a safe placeholder or example value (never a real credential), and non-obvious vars carry a one-line comment on format/where to get them.
- **Gitignored** — `.env.local`, `.env.*.local`, and other real `.env*` files are gitignored; only `.env.example` is committed. Confirm the `.gitignore` pattern actually covers the files the app uses.

### Public vs server

- **`NEXT_PUBLIC_*` only for truly-public values** — no server-only secret (API key, DB URL, service-account field, private token) is prefixed `NEXT_PUBLIC_`; that inlines it into the browser bundle at build time and it cannot be un-leaked without rotating.
- **Client code uses only public vars** — browser-reachable modules (`"use client"` files and anything they import) reference only `NEXT_PUBLIC_*`; a server-only var read in a client module is both a leak risk and an `undefined`-at-runtime bug.
- **Public vars carry no sensitive data** — even correctly-prefixed `NEXT_PUBLIC_*` values contain nothing that should stay private (they are world-readable in the shipped bundle).

### Secret leak

- **Nothing committed or hardcoded** — no API keys, private keys (`-----BEGIN`), JWTs/tokens (`eyJ...`), service-account JSON, connection strings with embedded passwords, or plaintext passwords in tracked files. Grep source, config, and history-adjacent files for secret shapes; `git ls-files` shows no real `.env`, `*.pem`, `*-key.json`, or credential file tracked. `.env.example` holds only placeholders.
- **No real `.env` ever committed** — check that a `.env`, `.env.local`, or key file wasn't committed then gitignored (still present in history / still tracked). If found, it is **report-only**: flag it, tell the developer to **rotate the credential** and purge it from history — do not attempt to fix.
- **Secrets sourced from a manager, not inline** — real secrets come from a Secret Manager / platform secret store and are injected at runtime, never inline in code, `next.config`, CI YAML, or committed config. (`backend-security` / `devops` cover the house approach if installed.)
- **Not leaked to logs/URLs** — secrets aren't `console.log`-ed, thrown in error messages, or placed in query strings.

### Tiering

- **`APP_ENV`, not `NODE_ENV`** — the environment tier (dev/staging/prod) is driven by `APP_ENV`; `NODE_ENV` isn't repurposed for tiering or set explicitly in env/deploy config (frameworks own `NODE_ENV`). `APP_ENV` is validated as an enum with an explicit allowed set.
- **Derived values in runtime config, not env** — cross-app / per-tier derived values (base URLs, cookie domain, CORS origins, feature toggles that follow the tier) live in a runtime config keyed off `APP_ENV`, not as separately-set environment variables that can drift out of sync.

### Cross-app / parity consistency

- **Shared shapes agree across apps** — vars shared across apps (same-purpose base URLs, shared provider config) use the same names and Zod shapes; flag an app missing a var its peers all have, or a name/type mismatch across apps.
- **Runtime env matches the schema** — required vars are actually provided in each deploy target / CI environment (spot-check CI config and host env against the schema); a var required in code but unset in an environment is a boot-time crash waiting to happen.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
