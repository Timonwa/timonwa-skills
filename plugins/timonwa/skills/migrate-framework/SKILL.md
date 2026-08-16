---
name: migrate-framework
description: >-
  Guided framework/library migration and major-version upgrades — analyze the current setup, produce a step-by-step migration plan with checkpoints, then apply changes incrementally with verification after every step, stopping at breakage. Use when the user asks to migrate, upgrade a framework or major dependency (Next.js, React, Tailwind, Storybook, a major package bump), or move from one library to another. Plan first and get approval; never migrates the whole codebase in one shot; never commits.
argument-hint: "[from] [to] | [migration description]"
allowed-tools: Read, Grep, Glob, Edit, Write, WebSearch, WebFetch, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(ls:*), Bash(pnpm:*), Bash(npm:*), Bash(yarn:*), Bash(npx:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Migrate framework

Runs a framework, library, or major-dependency migration as a gated workflow: analyze what's installed, research the breaking changes, present a checkpointed plan, and — only after approval — apply it one verified step at a time.

## Arguments

- `[from] [to]` — the package and target, e.g. `next 16`, `tailwind 4 5`, `dep firebase 12`, or `latest` as the target.
- `[migration description]` — free-form for library-to-library moves or custom migrations, e.g. `"styled-components to tailwind"`.
- No arguments → show the supported forms above with one example each and ask what to migrate.

## Guardrails — read first

- **Never migrate the whole codebase in one shot.** The only allowed path is plan → explicit approval → small increments, each verified before the next.
- **Presenting the plan is not approval.** Do not touch a single file until the user has approved the plan; if the plan changes mid-migration, re-present the changed part.
- **Stop at breakage.** If a step fails verification, stop, report the error and a suggested fix, and wait for user input — never plow through a red step to "fix it later".
- **Never `git commit` or `git push`.** When the migration is done, hand off to `stage-commit`.
- **"Upgrade X" authorizes analysis and planning only** — applying changes always needs the plan approved first.

## Step 0 — Orient

Detect, never assume:

1. Read the project's `AGENTS.md` for facts: monorepo or single app, which apps/packages exist, framework, package manager, verify commands.
2. Confirm the package manager from the lockfile (`pnpm-lock.yaml` / `package-lock.json` / `yarn.lock`).
3. `git status` — warn if the tree is dirty; a migration should start from a clean state so failures are revertible.
4. Read the root (and per-app, if monorepo) `package.json` to pin down current versions of the packages involved.

## Step 1 — Analyze current state

1. **Configuration** — read the configs the migration touches (e.g. `next.config.*`, the CSS/Tailwind entry, `tsconfig.json`, `.storybook/main.*`).
2. **Usage patterns** — grep for APIs the target version deprecates or removes, and count affected files.
3. **Breaking changes** — research the official migration guide / changelog between the current and target versions (WebSearch/WebFetch); never work from memory for version-specific behavior. Note any official codemods.

## Step 2 — Generate the migration plan

Produce a step-by-step plan where every step states: **what** changes (specific files/patterns), **why** (which breaking change or deprecation drives it), **risk** (low/medium/high), and whether it's **automated** (codemod/find-replace) or needs manual review. Group steps into **checkpoints** — after each checkpoint the project must type-check and build green. Include:

1. Pre-migration checks (clean git state, current verify commands passing).
2. Dependency bumps (which packages, which versions, in which workspaces).
3. Config changes.
4. Code changes, with file locations and counts.
5. Post-migration verification (Step 5's list, tailored to this migration).

## Step 3 — Approval gate

Present the plan and wait for explicit approval. The plan must be clear enough for the user to judge scope and risk. Offer to trim scope (e.g. one app at a time in a monorepo).

## Step 4 — Apply incrementally

For each step, in order: make the change → verify it compiles (`tsc --noEmit` or the project's check task) → run relevant tests if they exist → report status → move on. On failure: stop, report, suggest a fix, wait (see Guardrails).

## Step 5 — Post-migration verification

1. Full type check (repo-wide in a monorepo).
2. Run the existing test suite(s).
3. Start the dev server(s) for affected apps and confirm they boot.
4. Storybook builds, if UI packages changed.
5. Grep for leftovers: removed APIs, old version strings, codemod artifacts.

## Step 6 — Report

Write `_reports/migration-report.md` (overwrite) and show it in chat:

```markdown
# Migration report

**Date:** <YYYY-MM-DD> · **Migration:** <description> · **From:** <version/state> · **To:** <version/state>

## Scope
| App/package | Status |
| --- | --- |
| <name> | UPDATED / SKIPPED / FAILED |

## Changes applied
### Step <n> — <description>
- <file>: <what changed>
- **Verification:** passed/failed

## Breaking changes handled
| Change | Resolution |
| --- | --- |

## Post-migration checklist
- [ ] Type check passes
- [ ] Tests pass
- [ ] Dev servers start
- [ ] Visual spot-check in browser
- [ ] Storybook builds (if UI changed)

## Known issues
<anything unresolved that needs manual attention>
```

## Output

The report file at `_reports/migration-report.md`, the same content posted in chat, and a closing note listing any manual follow-ups. Uncommitted changes are left for the user to review and commit via `stage-commit`.

## Boundaries

- **Never commits or pushes** — committing the migration → `stage-commit`.
- Structure and naming of any code it rewrites follow `code-structure` and `naming`.
- Monorepo task-graph/caching fallout → `turborepo-monorepo`; CI pipeline updates the migration requires → `devops`.
- A post-migration health sweep → the audit family via `audit-all`.
