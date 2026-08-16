---
name: scaffold-agents-md
description: Create or update a project's AGENTS.md — the single file that documents a codebase's conventions for AI agents (tech stack, structure, commands, naming, routing, data-fetching, auth, env, boundaries). Use when starting a new project, when the user asks to "set up AGENTS.md / CLAUDE.md", document project conventions, or give agents context about this repo. Inspects the repo to fill what it can, interviews the user for the rest, and wires up CLAUDE.md to import it. Also the right prep before generic skills like pr-review, which read AGENTS.md for project rules.
argument-hint: "[path to project root]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(git symbolic-ref:*), Bash(git branch:*), Bash(gh repo view:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Scaffold AGENTS.md

Produce a complete, accurate `AGENTS.md` at the project root (default) or at `$ARGUMENTS` if a path is given — the source of truth that both Claude Code and other agents read for this project's conventions. Detect everything you can; ask only about what you genuinely can't infer; never leave `<placeholders>` behind.

The blueprint is [references/AGENTS.template.md](references/AGENTS.template.md), alongside this SKILL.md. Its headings are a contract other skills depend on — keep them intact; fill or mark each section.

## Step 1 — Detect (don't ask what you can read)

Inspect the repo and infer as much as possible:

- **Package manager**: which lockfile exists (`pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` / `bun.lockb`).
- **Scripts & commands**: `scripts` in root + workspace `package.json` (install/dev/build/typecheck/lint/format/test — use their exact names).
- **Project shape**: monorepo **only** if `package.json` has `workspaces`, or `pnpm-workspace.yaml` declares a `packages:` list, or there's an `apps/` + `packages/` layout → then list packages + import aliases (`@app/*`). A lone `pnpm-workspace.yaml` with only pnpm settings (no `packages:`) is a **single app** → note the `src/` layout and its path aliases (e.g. `@/*`). Never infer a monorepo from the file's mere presence.
- **Framework & language**: from dependencies (Next.js version, React, TypeScript strict, App vs Pages Router by folders present).
- **Tooling**: Tailwind (version/config), Biome/ESLint/Prettier, commitlint, Zod.
- **Structure**: top-level folders, where routes/endpoints/env/i18n live.
- **Default branch**: `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`, else `git symbolic-ref --short refs/remotes/origin/HEAD`.
- **Existing docs**: an existing `AGENTS.md`, `_docs/`, `CONTRIBUTING.md`, `README.md` — reuse their content, don't contradict it.

## Step 2 — Interview (only the gaps)

Ask the user concise, batched questions **only** for what you couldn't determine and a reviewer would need — typically: data-fetching approach (client vs server, which helpers), mutation approach, auth/RBAC gating, i18n usage, and whether tests/stories are required. Don't ask about anything already answered by Step 1.

## Step 3 — Write

1. Fill every section of the template from Steps 1–2. Replace all placeholders. Where something truly doesn't apply, write "None" rather than deleting a heading other skills expect.
2. **Merge with the standard winning**: if `AGENTS.md` already exists, preserve its **project-specific (bucket B)** content — framework, auth, data model, product, env — but **overwrite the global-standard (bucket A) sections with the current standard**, correcting any drift (e.g. a `Type`-suffix rule, non-Conventional commits) rather than keeping it. Show a diff-style summary of changes.
3. **Wire up the import**: ensure a root `CLAUDE.md` exists whose content is `@AGENTS.md` (create it if missing; add the import line if the file exists without it). This makes Claude Code read the same source.
4. Write per-app/package `AGENTS.md` stubs only if the user asks — the closest file wins.

## Step 4 — Report

If the repo has no structure yet (an empty or freshly-initialised project), say so and point at `scaffold-next-app` (one app or package, on top of an official starter) or `scaffold-monorepo` (the workspace shell around several apps) — the folder tree, configs, and tooling should exist before this file documents them.

Summarize what was detected vs. what the user supplied, and list anything still marked "None" or assumed so they can confirm. Do not commit — leave staging/committing to the user (or the `stage-commit` skill).
