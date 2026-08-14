---
name: pr-review
description: Self-contained, project-aware review of a pull request or branch diff. Use when the user asks to review a PR, review their changes/branch before merge, self-review, or run a code review. Hunts bugs and quality issues across many angles in parallel, verifies each finding to drop false positives, checks the changes against THIS project's own documented conventions, writes a numbered report, and can post PR comments or apply requested fixes. Never commits or pushes without explicit, per-change approval.
argument-hint: "[pr-number | pr-url | base...head] [--comment] [--fix] [--deep]"
model: opus
effort: high
allowed-tools: Read, Grep, Glob, Task, Write, Edit, Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git status:*), Bash(git symbolic-ref:*), Bash(git merge-base:*), Bash(git add:*), Bash(git commit:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr list:*), Bash(gh repo view:*), Bash(gh pr comment:*), Bash(pnpm run:*), Bash(npm run:*), Bash(yarn run:*), Bash(bun run:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# PR review

A complete, standalone review pipeline for a pull request or a branch diff. It finds real bugs and quality problems, proves each one before reporting it, and judges the change against the conventions the project documents about itself. It depends on nothing but `git`, `gh` (optional), and your own tools — no built-in reviewer.

`$ARGUMENTS` may contain a PR number/URL, an explicit `base...head` range, and any of the flags `--comment` (post findings to the PR), `--fix` (apply findings after review), `--deep` (widen the hunt). Parse them out; treat leftover text as extra focus for the review.

## Guardrails — read first

- **Read-only by default.** Steps 0–5 never modify code. Fixes happen only in Step 6, on explicit request.
- **Never `git commit` or `git push` on your own.** Committing happens only when the user says to, and each such instruction is a **one-time approval covering only that specific set of changes** — it never authorizes future commits.
- **Report findings; don't silently fix them.** Even with `--fix`, apply only what the user confirmed and then stop for review.

## Step 0 — Orient (project-aware setup)

Detect the project's shape instead of assuming it. Run these once and reuse the results:

1. **Base branch:** try `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`; else `git symbolic-ref --quiet --short refs/remotes/origin/HEAD` (strip `origin/`); else fall back to the first that exists of `main`, `master`, `dev`. If a `base...head` range was passed, use it verbatim.
2. **Package manager & scripts:** read the nearest `package.json` (and root, in a monorepo) — note the lockfile (`pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` / `bun.lockb`) and the available `scripts` (typecheck, lint, test). Use these exact commands later; never hardcode `pnpm check-types`.
3. **Workspace layout:** treat it as a monorepo **only** if `package.json` has `workspaces`, or `pnpm-workspace.yaml` actually declares a `packages:` list, or there's an `apps/` + `packages/` layout — a bare `pnpm-workspace.yaml` holding only pnpm settings is still a single app. If it's a monorepo, list the workspace packages and their import aliases (these are what "reuse"/"shared code" mean below); otherwise note the single-app `src/` layout and its path alias (e.g. `@/*`).
4. **Load conventions = the global standard (always) + this project's facts.** The **global standard applies regardless of what the repo documents**: Conventional Commits; type/schema naming (`Props` / `Schema` / clean PascalCase type names, no `Type` suffix); kind-first `lib/` + feature-first `components/` (`ui/`, `_shared/`, `layout/`) + `@/*` alias + import order; comments-only-when-non-obvious; reuse the shared layer; semantic HTML + a11y; no scope creep. Then read the project's `AGENTS.md` (via `CLAUDE.md → @AGENTS.md`), `CONTRIBUTING.md`, and config (`tsconfig`, ESLint/Biome, Prettier) for its **project facts**: framework, framework-specific structure/routing/rendering, auth, data model, env. Build one checklist = standard + facts.

## Step 1 — Gather the diff

1. If a PR number/URL was given: `gh pr view {n} --json title,body,files,additions,deletions,baseRefName,headRefName` for metadata and `gh pr diff {n}` for the full diff.
2. Otherwise: `git diff {base}...HEAD` for the diff and `git log {base}..HEAD --oneline` for intent. (Use `git merge-base` if a three-dot range misbehaves.)
3. **Exclude generated and vendored content from the hunt:** lockfiles, `dist/`/`build/`/`.next/`/`plugins/` and other generated output, minified bundles, binaries, and vendored third-party code. Note their presence in one line if relevant (e.g. "lockfile updated"), never review them line-by-line.
4. **Very large diffs (>~3000 changed lines):** don't dilute the hunt evenly. Prioritize by risk — server/auth/data-mutation code first, then shared packages, then UI; sample mechanical bulk changes (renames, codemods) by spot-checking a few instances and verifying the pattern instead of every line. Say in the report's Overview what was prioritized and what was sampled.
5. Identify every changed file and read the surrounding code where a hunk isn't self-explanatory. Do **not** dump the file list into the report.

## Step 2 — Hunt in parallel (spawn one subagent per angle)

Run these angles **simultaneously** via the Task tool so they don't share bias. Each returns up to 6 potential issues (up to 12 with `--deep`), and every issue must carry: `file`, `line`, `category`, `severity` (error / warning / info), `summary` (one sentence), and `failure_scenario` (a concrete trigger → the wrong output or cost).

- **A — Line-by-line scan.** Read every changed line literally: inverted/wrong conditions, off-by-one, null/undefined deref, missing `await`, falsy-zero checks, wrong-variable copy-paste, swallowed errors.
- **B — Removed-behaviour audit.** For each deleted/replaced line, name the invariant it enforced and find where the new code re-establishes it. A dropped guard, error path, or narrowed validation is a finding.
- **C — Cross-file tracer.** For each changed function, grep its callers/callees; flag any call site broken by a new precondition, changed return shape, or timing dependency.
- **D — Reuse.** Flag new code that re-implements something the repo already has; name the existing helper/shared package (from Step 0).
- **E — Simplification.** Flag redundant/derivable state, copy-paste variants, dead code, deep nesting; name the simpler form.
- **F — Efficiency.** Flag redundant computation, repeated I/O, needless sequential work that could be parallel, expensive work on hot/startup paths; name the cheaper alternative.
- **G — Altitude.** Check each change is at the right depth — special-case bandaids on shared infrastructure signal a too-shallow fix. Prefer generalizing the mechanism.
- **H — Conventions & standard.** Check the diff against the Step 0.4 checklist. Enforce the **global standard even when the project's existing code or docs disagree** — a `Type`-suffixed type, a re-implemented shared util, a broken `lib/`/`components/` placement, a non-standard alias, or an `AGENTS.md` rule that contradicts the standard are all findings (flag the stale doc too). Then check the project facts (framework structure, auth, data model, env). Cite the rule you're applying.
- **I — Security.** Flag injection, secrets/keys in code, missing authz, unsafe deserialization, `dangerouslySetInnerHTML` without sanitization, Server-Side Request Forgery (SSRF), path traversal, and dependency risks introduced by the diff.
- **J — Coverage** _(only if the project requires tests/stories)_. New shared components without a Storybook story; new shared functions / API routes without tests. Skip cleanly if the project doesn't require these.
- **K — Documentation impact.** Does the change leave the app's docs stale or something undocumented? Flag, with the exact file+line to update: (1) statements in `README`, `AGENTS.md` / `CLAUDE.md`, or `_docs/` / `docs/` that the diff now **contradicts** — renamed/removed/behaviour-changed things still described the old way; (2) new user- or dev-facing surface not reflected where it should be — commands/scripts, config/env vars (and `.env.example`), public APIs, component props, routes, features; (3) **convention changes that should update `AGENTS.md` itself**. Read the relevant docs to confirm staleness before flagging — don't assume.

## Step 3 — Verify (kill false positives)

Dedup issues pointing at the same line/mechanism, keeping the most concrete failure scenario. Then, for each remaining issue, spawn a verifier subagent that returns exactly one verdict:

- **CONFIRMED** — can name the exact inputs/state that trigger it and the wrong result; quotes the line.
- **PLAUSIBLE** — real mechanism, uncertain trigger (timing/env/config); states what would confirm it.
- **REFUTED** — factually wrong or guarded elsewhere; quotes the line that proves it.

Drop REFUTED. Keep CONFIRMED and PLAUSIBLE — these are the final findings. Default to REFUTED when the verifier can't substantiate the claim; a smaller true report beats a padded one.

## Step 4 — Write the report

Write to `_reports/PR_REVIEW_REPORT.md` (create the folder if needed). If a previous report exists, read it first and note in the Overview which prior findings are now fixed and which are still open, then overwrite. Also print the findings table to the chat.

```markdown
# PR Review Report

**Date:** {YYYY-MM-DD} · **Branch:** {head} · **Base:** {base} · **PR:** {link or "none"}

## Overview

{2–3 sentences on what the change does and your overall read. No file list.}

## Findings

| #   | Severity | Category | File | Line | Issue | Suggestion |
| --- | -------- | -------- | ---- | ---- | ----- | ---------- |
| 1   | error    | Bug      | `path` | 23 | {one line} | {one line} |

{If nothing: "No issues found."}

## Failure scenarios

**#1** — {summary}
> {full failure_scenario}
```

Rules: one flat findings table (no per-category tables); numbers are sequential and never restart; severities are `error` (must fix) / `warning` (should fix) / `info` (nice to fix); categories are Bug · Convention · Architecture · Reuse · Simplification · Efficiency · Security · Coverage · Docs. Mark PLAUSIBLE findings as such in the Issue cell. No "Verdict"/"Summary" section.

## Step 5 — Post PR comment (only with `--comment`, or if a PR exists and the user asked)

Post with `gh pr comment {n} --body "..."` using a condensed version of the findings table (drop the Suggestion column), a 2–3 sentence overview, and a footer: `_Reply with finding numbers to fix (e.g. "fix #1, #3"). Full report: _reports/PR_REVIEW_REPORT.md_`. Posting a comment is an outward action — confirm before posting unless `--comment` was explicitly passed.

## Step 6 — Apply fixes (only with `--fix`, or when the user says "fix #1, #3")

1. Apply **only** the requested findings — don't touch the others.
2. Run the project's typecheck (and lint, if relevant) commands detected in Step 0 to verify the fixes are clean.
3. Report in chat only (do not rewrite the report file): **Fixed** (numbered, one line each) and **Remaining** (numbered). End with "Needs your review before continuing."
4. Stop. Do **not** commit.

## Step 7 — Commit (only on explicit instruction)

When the user says to commit: commit only the current applied set, with a Conventional Commits message (see the `stage-commit` skill for the format). This approval covers this one commit only; anything after needs a fresh instruction. Never push. After committing, report what was committed and stop.
