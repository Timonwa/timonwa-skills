---
name: sync-apps
description: >-
  Detect drift in files that should stay identical — or share sections — across sibling apps, packages, or starter templates, report every difference against the source of truth, and propagate fixes only after approval. Use when the user asks to sync apps, check for config/asset/boilerplate drift across a monorepo, align starter templates, or "why do these apps differ". Report-first; never applies a fix without approval.
argument-hint: "[path-or-glob] [--fix]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(ls:*), Bash(diff:*), Bash(cmp:*), Bash(shasum:*), Bash(cp:*), Bash(git log:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Sync apps

Compares the files a project declares "must stay in sync" across its sibling apps/templates, reports drift against the source of truth, and — only with `--fix` and explicit approval — propagates the canonical version.

## Arguments

- `[path-or-glob]` — scope the check to one file, category, or glob (e.g. `apps/*/src/config/env.ts`, `apps/templates/*/README.md`). Omitted → the project's full sync manifest.
- `--fix` — after the drift report is approved, apply the agreed canonical versions. Omitted → report only.

## Guardrails — read first

- **Report-first, always.** Even with `--fix`, first present the drift report with the proposed canonical version per item and wait for explicit approval before editing any target.
- **The sync manifest is a project fact, not yours to invent.** Read it from the project's `AGENTS.md` (or take it from the arguments). If neither exists, discover candidates (same-named files across siblings) and propose a manifest — never silently assume a file "should" be identical.
- **Never overwrite intentionally per-app values.** Shared-fields and templated files keep their declared per-app parts; a "sync everything" request does not authorize flattening them.
- **Never `git commit` or `git push`** — committing applied fixes → `stage-commit`.

## Sync rule types

Every manifest entry declares one source of truth, its targets, and one of these rules:

1. **Byte-identical** — files that must match exactly across siblings (a shared client config, an env schema, `.env.example`, brand assets/favicons).
2. **Shared fields** — identical except explicitly named per-app fields (a site-metadata file where only `url` differs; a webmanifest where only `name`/`short_name` differ). Sync the shared fields, preserve the per-app ones.
3. **Shared pattern** — the same setup shape with app-specific additions allowed (e.g. every root layout loads the base font the same way; an app may add extra fonts). Check the pattern is present and correctly configured, don't force byte equality.
4. **Templated siblings** — generated-from-one-template files (starter-template READMEs and the like) that share most of their content, with only per-template substitutions (template name, folder path). Shared sections must match modulo the substitutions; declared unique sections (feature lists, structure trees, template-specific steps) are never synced. Canonical facts that recur across them — required runtime version, org-name casing, canonical URLs — should be stated once in `AGENTS.md` and enforced from there.

## Step 0 — Orient

1. Read the project's `AGENTS.md` for the sync manifest (sources, targets, rules, per-app fields) and any canonical facts.
2. Discover the actual siblings dynamically (`ls apps/`, glob the template dirs) — never hardcode the list; new siblings appear.
3. If no manifest exists, propose one from discovered same-named files and stop for confirmation before checking.

## Step 1 — Compare

For each manifest entry (independent entries in parallel): read source and targets, diff per its rule type, and record what differs, which targets drifted, and — via `git log` on the drifted files — which version is newest (the likely canonical).

## Step 2 — Propose canonical versions

For each drifted item, propose the canonical content (usually the source of truth; flag it when a target actually holds the newer/better version and the manifest's source should be updated instead). Also flag targets missing a file the source has.

## Step 3 — Report

Write `_reports/sync-report.md` (overwrite) and post it in chat:

```markdown
# Sync report

**Date:** <YYYY-MM-DD> · **Mode:** <Report only / Fix> · **Scope:** <manifest / path-or-glob>

## Results
| Item | Rule | Status | Details |
| --- | --- | --- | --- |
| <manifest entry> | <byte-identical / shared fields / pattern / templated> | IN_SYNC / DRIFT_FOUND / FIXED | <which targets drifted, what differs> |

## Summary
<X of Y items in sync. Proposed canonical versions for the drifted items. If --fix ran, what was applied.>
```

## Step 4 — Apply (only with `--fix`, only after approval)

For each approved item: replace or patch the targets per the rule type, preserving per-app fields and unique sections; re-read each changed file to verify the result; update the report statuses to `FIXED`.

## Output

The report at `_reports/sync-report.md`, the same content in chat, and — in fix mode — the list of files changed, left uncommitted for `stage-commit`.

## Boundaries

- **Never applies fixes without approval**, and never without `--fix`.
- The sync manifest and canonical facts live in the project's `AGENTS.md` → maintained via `scaffold-agents-md`.
- Judging documentation content itself (stale claims, broken links) → `docs-audit`; README structure/content → `readme-writer`.
- Committing applied fixes → `stage-commit`.
