---
name: audit-all
description: >-
  Manually invoked. Orchestrates the full house audit suite — detects what the repo has, runs every applicable domain audit (accessibility, seo, storybook, conventions, dependencies, environment, frontend, performance, api, rbac, firestore, redis, codebase, security, docs), and aggregates the results into one consolidated health report with an overall score and cross-cutting priorities. Each domain audit also writes its own report. Not on by default (use when asked to run all audits / a full audit). Individual audits — `accessibility-audit`, `security-audit`, etc.; Firestore/Storage rules → `firebase-security-rules-auditor`.
argument-hint: "[phase]"
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Audit all

The **orchestrator** for the house audit family. It figures out what the repo actually contains, runs each **applicable** audit, and rolls everything up into a single consolidated report — so you get one health picture instead of fifteen. Each domain audit still writes its own `_reports/<name>.md`; this adds `_reports/audit-all.md` on top.

> **The family** (each is its own manually-invoked command): `accessibility-audit`, `seo-audit`, `storybook-audit`, `conventions-audit`, `dependency-audit`, `environment-audit`, `frontend-audit`, `performance-audit`, `api-audit`, `rbac-audit`, `firestore-audit`, `redis-audit`, `codebase-audit`, `security-audit`, `docs-audit`. Firestore/Storage **rule** internals → `firebase-security-rules-auditor`.

## Arguments

- `[phase]` — `development` | `production`. Optional; defaults to `production` (assume the app is live until told otherwise). Passed unchanged to every sub-audit.

Severity levels (CRITICAL/HIGH/MEDIUM/LOW) are as defined in each domain audit — this skill only aggregates them.

## Which audits apply

Detect from the repo, then run only what fits (skip the rest and say so in the report):

| Audit                                                          | Run when                                                                                                               |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `codebase-audit`                                               | always (broad triage first)                                                                                            |
| `conventions-audit`                                            | always                                                                                                                 |
| `dependency-audit`                                             | a lockfile / workspace exists (its deepest checks target pnpm workspaces; on npm/yarn repos it scopes to what applies) |
| `environment-audit`                                            | there are environment variables / `.env.example`                                                                       |
| `security-audit`                                               | always (scoped to frontend / backend / both)                                                                           |
| `frontend-audit` · `performance-audit` · `accessibility-audit` | there's browser/UI code                                                                                                |
| `seo-audit`                                                    | a public-facing app                                                                                                    |
| `storybook-audit`                                              | Storybook is configured                                                                                                |
| `api-audit` · `rbac-audit`                                     | there's an API / route-handler layer                                                                                   |
| `firestore-audit`                                              | the app uses Firestore                                                                                                 |
| `redis-audit`                                                  | the app uses Redis                                                                                                     |
| `docs-audit`                                                   | the repo has documentation (a docs site, `_docs/`/`docs/`, or substantial READMEs)                                     |

## Method

1. **Resolve phase once** — a phase arg (`development` | `production`) if given; else default `production` (assume the app is live until told otherwise). Pass the same phase to every sub-audit so tiers line up.
2. **Detect scope** — single app vs monorepo, which apps are public/internal, and which data/infra (Firestore, Redis, Storybook, API) are present, to pick the applicable audits above.
3. **Run the applicable audits** — prefer running them **in parallel** (one subagent per audit), each following its own skill and writing its own `_reports/<name>.md`. Every audit is **report-only** — none modify code.
4. **Aggregate** — collect each sub-report's score, finding counts, and top items; de-duplicate cross-cutting findings (a missing auth guard may surface in both `api-audit` and `rbac-audit` — report it once, note both).
5. **Write** `_reports/audit-all.md` (overwrite; carry forward the previous roll-up for trend). Never commit or push without explicit approval.

## Report format

```
**Date:** YYYY-MM-DD  **Phase:** <phase>  **Mode:** Report-only  **Branch:** `<branch>`  **Scope:** <apps / packages covered>  **Overall:** <X>/10

## Suite summary
| Audit | Score | Critical | High | Med | Low | Trend | Report |
| accessibility-audit | 7/10 | 0 | 2 | 3 | 1 | ▲ | _reports/accessibility-audit.md |
| … | | | | | | | |
| (skipped: storybook-audit — no Storybook; redis-audit — no Redis) |

## Top priorities (cross-cutting, worst-first)
Consolidated CRITICAL/HIGH items across all audits, each pointing to the owning sub-report + finding ID.

## Action items
Phase-aware tiers (`development` → Fix Now / Before Launch / Post-Launch; `production` → Fix Now / Next Release / Backlog), merged across audits.

## Resolved since last run
```

## Boundaries

- **Report-only** — audits never modify code; `audit-all` only aggregates their reports.
- **Don't duplicate depth** — the roll-up summarizes; the detail lives in each sub-report. De-duplicate shared findings.
- Verify sub-audits actually ran (skipped ones are stated, not silently dropped). Never commit or push without explicit approval.
