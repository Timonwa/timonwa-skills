---
name: scaffold-feature
description: >-
  Scaffold a new feature end-to-end following the house standards — schema, service, route handler or Server Action, page + components, and stories, each generated per its owning skill, with project facts (paths, aliases, helpers) read from AGENTS.md and sibling code. Use when the user asks to scaffold, bootstrap, or spin up a new feature, endpoint, page, CRUD slice, schema, or hook. Proposes the file plan first; scaffolds compile-ready boilerplate with TODOs, never invents business logic; never commits.
argument-hint: "[feature-name] [scope hints]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls:*), Bash(pnpm:*), Bash(npm:*), Bash(yarn:*), Bash(npx:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Scaffold feature

Creates a new feature's files in the right places with the right imports from day one — by following the owning skill for each layer (rather than restating conventions here), and by reading the project's `AGENTS.md` and existing code for the facts those skills can't know.

## Arguments

- `[feature-name]` — the feature/resource to scaffold, e.g. `notifications`.
- `[scope hints]` — optional subset or context, e.g. `api only`, `page + action`, `schema`, `hook`, `component`, or which app in a monorepo. Omitted → plan the full slice and confirm scope in the plan.

## Guardrails — read first

- **Plan before files.** Present the full file list (create + modify) and wait for confirmation before writing anything.
- **The standard wins; siblings supply only the facts.** Structure, naming, layering, and schema shape come from the owning skills below — never inferred from existing code. Read siblings for _project facts_ the skills can't know: real paths and aliases, which helper wrappers exist, how this repo names its barrels. Read **two or three** of them, not one, and take the dominant pattern; a single sibling may be the outlier.
- **Never propagate a violation.** If the siblings disagree, or the dominant pattern contradicts an owning skill, follow the skill and note the deviation in the plan — scaffolding a copy of existing drift multiplies it once per feature.
- **Boilerplate only.** Generated bodies are compile-ready stubs with `// TODO:` markers; never invent business logic, copy, or data models the user didn't describe.
- **Never `git commit` or `git push`** — committing the scaffold → `stage-commit`.

## Owning skills — delegate, don't restate

This skill only sequences the work; every convention lives in its owning skill. When generating a layer, follow that skill's rules in full:

| Layer                                                       | Owning skill                |
| ----------------------------------------------------------- | --------------------------- |
| Folder placement, thin pages, sections, `lib/` layout       | `code-structure`            |
| Route handlers, services, Server Actions, guards, responses | `api-architecture`          |
| Zod schemas + inferred types                                | `typescript-best-practices` |
| Every identifier and file name                              | `naming`                    |
| Reusable components and hooks                               | `reusables`                 |
| Stories                                                     | `storybook-story-writing`   |
| OpenAPI registry entry for a new route                      | `api-docs`                  |

## Step 0 — Orient

Read the project's `AGENTS.md` for the facts that shape the plan: monorepo or single app; whether the API layer is a dedicated API app/BFF or Server Actions; where schemas, hooks, and UI live (shared packages vs app-local `lib/`); path aliases; whether Storybook exists. Then sample two or three siblings per layer you'll generate — for the facts above, not for the conventions — and note any that already deviate from their owning skill so the plan can say so.

## Step 1 — Plan the slice

From the arguments, decide which artifacts the feature needs — the full slice is `schema → service → route (or Server Action) → page + components → stories`, but a hint may reduce it to a subset. Present the plan as a file list with a one-line purpose each, flag any files that will be modified (barrels, route constants), and wait for approval.

## Step 2 — Schema

Per `typescript-best-practices`: the create/document/update schema set with inferred types, in the project's schema location (shared package or app `lib/`), exported through its barrel. Add a constants file only if the schema needs enums/status arrays. Shared-vs-app placement follows where the schema will be consumed.

## Step 3 — Service

Per `api-architecture`: one service file per resource, grouping its functions; typed errors; no route/transport concerns inside.

## Step 4 — Route handler or Server Action

Which one is a project fact (`AGENTS.md`). Per `api-architecture`:

- **Route handler** — thin: validate input, resolve the actor, guard permissions, call the service, return via the shared response builders. Register it in the OpenAPI registry in the same change if the project has one (`api-docs`).
- **Server Action** — `safeParse` the input, re-resolve the actor and re-check permissions server-side (never trust client-supplied identity), call the fetch/service layer, revalidate affected cache tags, return a discriminated success/failure result.

## Step 5 — Page + components

Per `code-structure`: add the route constant, a thin `page.tsx` in the correct route group (so the right layout/auth guard applies) that renders a `…PageContent`, sections split one-per-file, client parts isolated behind `"use client"` leaves. Metadata matches the audience — public pages indexable, internal pages noindex (details → `seo`). Reads go through the project's server fetchers; never fetch from a Client Component.

## Step 6 — Stories

If the project has Storybook, ship the story for any new reusable component in the same change, per `storybook-story-writing`.

## Step 7 — Verify and hand off

Run the project's type check (repo-wide in a monorepo). Then report every file created/modified plus the follow-up checklist, keeping only the items relevant to what was scaffolded:

- Rate limiting for sensitive operations, audit logging for admin operations, and RBAC/permission registration if the route is gated (→ `api-architecture`).
- Schema placement double-checked — move to the shared package if a second consumer appears.
- Route constant added and the page sits in the route group whose layout carries the right guard.
- SEO/noindex matches the page's audience.
- The `// TODO:` markers left to implement, listed.

## Output

The approved file plan, the created/modified file list, the type-check result, and the remaining-TODOs checklist — all in chat. No report file; the scaffold itself is the artifact. Uncommitted changes are left for `stage-commit`.

## Boundaries

- **Sequencing only** — structure → `code-structure`, API layer → `api-architecture`, schemas → `typescript-best-practices`, names → `naming`, reusables → `reusables`, stories → `storybook-story-writing`, registry entries → `api-docs`.
- **Never commits** → `stage-commit`.
- **Never implements business logic** — it scaffolds the shape and stops.
- **Features inside an existing project only** — a brand-new repo needs its structure, configs, and tooling first → `scaffold-next-app` (one app) or `scaffold-monorepo` (a workspace).
- Project facts it reads (`AGENTS.md`) are produced by `scaffold-agents-md`; large framework/version moves → `migrate-framework`.
