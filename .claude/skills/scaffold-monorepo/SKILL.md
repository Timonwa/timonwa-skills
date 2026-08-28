---
name: scaffold-monorepo
description: >-
  Converts what an official scaffolder already produced — a single app from `pnpm create next-app`, or a `create-turbo` starter workspace — into the house pnpm + Turborepo monorepo shell, by editing and moving files rather than regenerating them. Use when the user asks to scaffold a monorepo, convert to a monorepo, set up turborepo, add a pnpm workspace, move this app into a monorepo, restructure a create-turbo starter, or add a second app to an existing workspace. Interviews first in grouped batches, gates on one file manifest labelled CREATE / EDIT / MOVE / DELETE, and never installs, moves paths with git, or commits without explicit approval.
argument-hint: "[scope] [--apps web,admin] — e.g. `@app`, `--apps web,admin,api`"
allowed-tools: Read, Grep, Glob, Write, Edit, AskUserQuestion, Bash(ls:*), Bash(mkdir:*), Bash(cat:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git ls-files:*), Bash(git mv:*), Bash(npm view:*), Bash(pnpm:*), Bash(corepack enable), Bash(pnpm dlx syncpack:*)
metadata:
  version: 1.0.1
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Scaffold monorepo

Takes a repo that an **official scaffolder already created** and adapts it into the house workspace — pnpm workspaces + Turborepo v2, a shared `packages/*` set, one task graph, one CI pipeline. It is an **adapter, not a generator**: the framework's own `create-*` tool owns day-zero file generation and dependency versions; this skill owns everything **above the apps** and rewrites only what the house standard requires.

It scopes strictly to the **workspace shell**: `pnpm-workspace.yaml` and the catalog, `turbo.json`, the root `package.json`, `.npmrc`, the shared packages, root CI, hooks, CODEOWNERS, and the `functions/*` tier. The **inside of each app** — folder tree, component tiers, kind-first `lib/`, styles, env validation, Storybook wiring — belongs to `scaffold-next-app`, which this skill delegates to per app as its final step.

## Arguments

- `[scope]` — the npm scope for shared packages (`@app`, `@acme`, …). Omitted → detect from an existing `package.json`, else ask. Never invent one.
- `--apps <list>` — comma-separated app names to end up with (`web,admin,api`). Omitted → asked in the interview.
- `--no-interview` — use every default from the interview tables below without asking. Still gates on the manifest.

## Guardrails — read first

- **Never generate an app from nothing.** If the directory is empty (or has only a `README`/`.git`), stop and tell the user to run `pnpm dlx create-turbo@latest` for a fresh workspace, or `pnpm create next-app` for a first app, then re-invoke this skill. Do not hand-write a Next.js app.
- **EDIT, never overwrite.** Everything the scaffolder produced is the starting point. `Write` is only for files that do not exist yet; existing files are changed with `Edit` so the scaffolder's own choices survive. If a file genuinely must be replaced wholesale, it is listed as DELETE + CREATE in the manifest and approved by name.
- **Never pin versions the scaffolder chose.** Framework, React, TypeScript, and lint deps keep exactly the versions in the generated `package.json`. Resolve from the registry (`npm view <pkg> version`) **only** for genuinely new deps this skill adds (`turbo`, `husky`, `commitlint`, `lint-staged`, `syncpack`).
- **The skill is the standard, not the starter.** Where `create-turbo`'s example layout, its `@repo/*` scope, its `packages/eslint-config`, or its unprefixed `ui` package conflict with the house standard, restructure them and say so in the manifest. Never "match the existing pattern" or let the scaffolder's layout win.
- **`git mv` needs approval.** Moving an app rewrites every tracked path. Propose the exact `git mv` commands, wait, then run only those. Never `git add`, `git commit`, or `git push` — committing → `stage-commit`.
- **No installs without approval.** `pnpm install`, `pnpm dlx`, `corepack enable` are proposed as exact commands and run only once approved.
- **No project-specific facts.** No real org scopes, domains, project ids, secret values, or client names in any written file. `.env.example` lists names only. Real values are project facts for `scaffold-agents-md`.
- **Verify tooling, don't recall it.** Confirm the pnpm major (its workspace keys changed — see Step 5), the current Turborepo schema keys, and the `create-turbo` output shape before writing config.

## Owning skills — the source of every decision

| Part of the shell                                                       | Owning skill                 |
| ----------------------------------------------------------------------- | ---------------------------- |
| Workspace layout, `turbo.json` tasks/caching/graph, catalog, strict env | `turborepo-monorepo`         |
| CI job graph, composite setup action, SHA-pinning, hooks, CODEOWNERS    | `devops`                     |
| The shared `typescript-config` package, the `contracts` package layout  | `typescript-best-practices`  |
| The `tailwind-config` package and the `ui:` prefix mechanism            | `tailwind-css`               |
| What belongs in the `ui` package (tiers, governance) and each primitive | `design-system`, `reusables` |
| `@app/<kind>` shared-kind packages as the monorepo form of `lib/`       | `code-structure`             |
| Package, folder, and script names                                       | `naming`                     |
| A separate API app's route/service architecture                         | `api-architecture`           |
| Everything inside an app                                                | `scaffold-next-app`          |

`turborepo-monorepo/references/config-templates.md` is the **authority** for the root `turbo.json`, root `package.json`, `pnpm-workspace.yaml`, the per-package `ui` `turbo.json`, and the CI workflow — write those **verbatim from there**, substituting the scope. Only the shell files that skill does not template live in [references/templates.md](references/templates.md).

## The target tree

The full annotated workspace tree — every folder and file, each line saying what it is and, where conditional, what turns it on — is [references/target-tree.md](references/target-tree.md). **Read it before planning the manifest**; it is the specification this command executes.

A monorepo **mirrors the single app as closely as possible**: same kinds, same grammar, same barrel rules. What changes is only how much of each kind stays in an app — **consumer count decides**, two or more → a package, one → that app. A kind is never removed from an app because a package exists; it holds what only that app uses. The rules behind the shape live in `code-structure`.

## Step 0 — Detect the entry situation

Detect, never assume. Run: `ls -a`, `git rev-parse --is-inside-work-tree`, `git status --short`, `ls apps packages 2>/dev/null`, and read any root `package.json`, lockfile, `turbo.json`, and `pnpm-workspace.yaml`.

| Signal                                                                          | Situation                                                 |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Empty / only `.git` + `README`                                                  | **Stop.** Tell them which scaffolder to run (Guardrails). |
| One app at the root (`next.config.*` or `astro.config.*` beside `package.json`) | **A — move the app in** (Step 3)                          |
| `turbo.json` + `apps/*` + `packages/*` with `@repo/*` names, `apps/docs`        | **B — adapt the `create-turbo` starter** (Step 4)         |
| Already a house-shaped workspace, user wants another app                        | **C — extend** (Step 4b)                                  |

Also record, as facts for the interview: the lockfile (which package manager and which major), the `packageManager` field, existing app names, existing package names and scope, the dev script and port in each app, and whether a `functions/` tier exists. List anything that already deviates from the house standard — the manifest reports it as EDIT with the skill it contradicts.

## Step 1 — The interview (grouped batches, defaults preselected)

Use `AskUserQuestion` in **four batches of at most four questions**, each option carrying the house default first. Skip any question Step 0 already answered from disk, but **confirm detections rather than asking blind** ("lockfile says pnpm 10 — keep pnpm?").

**Batch 1 — Foundations**

| Question                             | Options (default first)                       |
| ------------------------------------ | --------------------------------------------- |
| Package manager                      | `pnpm` (house default, always) / `yarn`       |
| Shared-package scope                 | detected scope / `@app` / custom              |
| pnpm catalog for shared dep versions | yes / no                                      |
| Turborepo remote caching             | yes (`TURBO_TOKEN` + `TURBO_TEAM` in CI) / no |

**Batch 2 — Apps**

| Question                                   | Options (default first)                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Which apps should exist when this finishes | detected + `web` / `web,admin` / `web,admin,api` / custom                        |
| Dev port per app                           | `web` 3000, `admin` 3001, `api` 3002, `docs` 3003, `storybook` 6006 / custom     |
| Separate API app                           | no (route handlers inside `web`) / yes (`apps/api`, wiring → `api-architecture`) |
| A `functions/*` tier                       | no / yes (serverless/workers)                                                    |

**Batch 3 — Shared packages**

| Question                                      | Options (default first)                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Which shared packages                         | all five — `ui`, `schemas`, `tsconfig`, `tailwind-config`, `utils` (recommended) / subset |
| `ui:` Tailwind prefix on the `ui` package     | yes (house default) / no                                                                  |
| A dedicated Storybook app in `apps/storybook` | yes, pointing at `packages/ui` / no (per-app Storybook → `scaffold-next-app`)             |
| The starter's own packages (Situation B only) | replace with the house set / keep `packages/eslint-config` too                            |

**Batch 4 — Automation and delivery**

| Question              | Options (default first)                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| CI                    | GitHub Actions with a composite setup action + `turbo … --affected` / none |
| Git hooks             | husky + lint-staged + commitlint / none                                    |
| `.github/CODEOWNERS`  | yes / no                                                                   |
| Deploy target per app | per-app target named only (specifics → `devops`) / decide later            |

**Record every answer verbatim** — app list, ports, scope, catalog usage, functions tier, deploy targets. They are the project facts `scaffold-agents-md` will write into `AGENTS.md`, and this skill must hand them over rather than leaving them implicit in the file tree.

## Step 2 — The manifest (the one gate)

Present a single table and wait for approval. Every row carries an action label:

- **CREATE** — the file does not exist (`pnpm-workspace.yaml`, `.npmrc`, a shared package, CI).
- **EDIT** — the scaffolder made it and it stays, with the named change (`package.json`, `turbo.json`, an app's `tsconfig.json`).
- **MOVE** — `git mv <from> <to>`, with the exact command.
- **DELETE** — a starter example being pruned, listed individually with why.

Also include: the target tree, the exact commands that would run (installs, `corepack enable`), each detected deviation with the skill it contradicts, and the per-app `scaffold-next-app` delegations queued for Step 10. One approval covers this manifest and nothing more.

## Step 3 — Situation A: move the existing app into `apps/<name>`

The move is the risky part. Do it in this order, and expect these breakages.

1. **Move tracked files with `git mv`** (approval-gated) so rename detection preserves history: `mkdir -p apps/<name>` then `git mv` each tracked top-level entry that belongs to the app (`src`, `public`, `package.json`, `next.config.*`, `postcss.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `components.json`…). Never `git mv .git`, `node_modules`, or build output.
2. **Do not move generated or ignored artifacts.** Delete `node_modules/`, `.next/`, `.turbo/`, `*.tsbuildinfo` at the old location instead of moving them — a moved `node_modules` produces broken symlinks. Untracked-but-real files (`.env.local`) move with plain `mv` and stay ignored.
3. **Split the root.** Repo-wide tooling moves **up** or stays at root: `.gitignore` (root ignores at root, app-specific `.next/` entries in the app), `.editorconfig`, `.nvmrc`, `biome.json`/`.prettierrc`, `commitlint.config.js`, `.husky/`, `.github/`, `LICENSE`, `README.md`. App-scoped config **stays in the app**: `next.config.*`, `postcss.config.mjs`, the app's CSS entry, `.env*` (turbo hashes them per package).
4. **One lockfile, at the root.** Delete the app's lockfile after the move and re-resolve from the root with a single `pnpm install` (approval-gated). Keeping two lockfiles is how apps silently drift onto different versions.
5. **`packageManager` belongs to the root only.** Move it out of the app's `package.json` into the new root one, with the exact version corepack requires.
6. **Rewrite the app's `package.json`**: name it `@<scope>/<app>`, add `"private": true`, keep every dependency version the scaffolder chose, convert only the cataloged ones to `"catalog:"`, and add `"@<scope>/<pkg>": "workspace:*"` for each shared package it consumes.
7. **Fix `tsconfig.json`**: `"extends": "@<scope>/tsconfig/nextjs.json"`, and keep `paths` relative to the app (`{"@/*": ["./src/*"]}`) — a path left relative to the old root resolves to nothing and every `@/` import breaks at once.
8. **Fix the CSS entry**: an app that renders `packages/ui` components must add `@source "../../packages/ui/src";` or the app build emits **zero** utilities for them (`tailwind-css`).
9. **Framework-level workspace awareness**: verify against current framework docs whether the app needs `outputFileTracingRoot` pointed at the workspace root (standalone builds trace the wrong root otherwise) and whether consuming TS source from a workspace package needs `transpilePackages` at the framework version in use. Verify — do not assume either way.
10. **Scripts and CI change shape**: root scripts become `turbo run <task>`, CI becomes `turbo run … --affected` with `fetch-depth: 0`, and dev is orchestrated by pnpm filters (`turborepo-monorepo`).
11. **The deploy target's root directory now points at `apps/<name>`** — flag it as a manual follow-up; the mechanics belong to `devops` and the value is a project fact.

## Step 4 — Situation B: adapt the `create-turbo` starter

The starter is a demo, not the house standard. Verify its current output shape first (`ls apps packages`, read every `package.json`) — at the time of writing it ships two Next.js apps (`web`, `docs`) plus `ui`, `eslint-config`, and `typescript-config` packages under a `@repo/*` scope.

- **Apps** — rename the ones you're keeping to the agreed names (`git mv apps/docs apps/admin`), DELETE the ones you aren't, and set each app's dev port from the interview. Renaming an app means updating its `package.json` name, every `workspace:*` consumer, and any `--filter` that referenced it.
- **Scope** — rewrite `@repo/*` to the agreed scope across every `package.json`, every `extends`, and every import. Grep for the old scope afterwards; a single leftover reference fails install, not type-check.
- **Packages** — replace the starter set with the house set: `typescript-config` and `eslint-config` keep their names (both match the house tree); `packages/ui` keeps its folder but is restructured into the design-system package (tiers, subpath exports, its own prefixed Tailwind compilation) and its starter `turbo gen` scaffolding is dropped unless the user asked to keep it. Add `contracts`, `hooks`, `tailwind-config`, and `utils`.
- **`turbo.json`** — EDIT it to the house task graph verbatim from `turborepo-monorepo/references/config-templates.md`. The starter typically lacks per-task `env` declarations; under Turborepo 2's strict env mode that means builds read `undefined` for `NEXT_PUBLIC_*` and cache hits restore stale builds after a secret changes.
- **`pnpm-workspace.yaml`** — add the catalog (the starter doesn't use one) and the build-allowlist key, then convert each app's shared dep specifiers to `"catalog:"`.
- **Keep the starter's dependency versions.** It generated a coherent set; the catalog records them, it does not re-pick them.

### Step 4b — Situation C: extend an existing house workspace

Skip the shell. Confirm it already matches the standard (report any drift), then: add `apps/<new>` to the workspace globs if a new glob is needed, give it a free dev port, add it to the root `dev` filter list, wire its `workspace:*` shared deps and `catalog:` versions, extend the shared `tsconfig`, add it to CODEOWNERS and any per-app CI deploy job — then delegate its insides to `scaffold-next-app`. Drift **between** existing apps is `sync-apps`, not this skill.

## Step 5 — The workspace shell

Written verbatim from `turborepo-monorepo/references/config-templates.md`, scope substituted: root `turbo.json`, root `package.json`, `pnpm-workspace.yaml`. Additions and traps:

- **Match the detected pnpm major before writing workspace keys.** The build-script allowlist was renamed between majors — pnpm 10 uses `onlyBuiltDependencies` (a list), pnpm 11 uses `allowBuilds` (a name → boolean map) and removes the old keys. Read the installed pnpm's docs for the major in `packageManager` rather than copying whichever form you saw last; a stale key is silently ignored and native deps fail to build.
- **Globs**: `apps/*`, `packages/*`, plus `functions/*` only when that tier exists.
- **Catalog**: the framework/runtime deps every app shares. It only covers what you put in it — catch the rest with `pnpm dedupe` and `pnpm dlx syncpack list-mismatches`.
- **Root scripts**: `build`, `lint`, `check-types`, `format`, `format:check` as `turbo run …`; `dev` orchestrated by pnpm filters, never by turbo (turbo's `dev` is `persistent` and a persistent task can have no dependents).
- **`.npmrc`** and the remaining shell files → [references/templates.md](references/templates.md).
- **Yarn instead of pnpm**: workspace globs live in the root `package.json` `workspaces` field, there is no catalog protocol (use `resolutions` + syncpack to hold versions in lockstep), and CI swaps the pnpm steps for yarn's. Everything else — layout, turbo graph, shared packages — is unchanged. Say plainly that pnpm is the house default.

## Step 6 — Shared packages

The full set is in [references/target-tree.md](references/target-tree.md) — **create only the agreed ones**, each a real workspace package with a name, `exports`, a `check-types` script, and **its own `README.md` and `AGENTS.md`** (no exceptions, including the config-only ones). Contents and layout come from the owning skill, not from here — this step creates the package boundary, its manifest, and its barrel, then stops:

- **`packages/ui`** — the shareable design system: the six tiers (`assets base blocks icons layouts patterns`) with per-tier subpath exports, **one folder per component** inside each tier (`index.tsx` IS the component, + **story** + a test only where there is behaviour — same rule as an app; no per-component barrel), its own `@import "tailwindcss" prefix(ui)` compilation, a re-declared dark variant, and `extendTailwindMerge({ prefix: "ui" })` so conflict resolution still works. **Every story file sits beside its component here, not in `apps/storybook`** — that app owns only the config, the shared decorators, and a `_Template.stories.tsx`, and reaches these with a glob. The tier comes from the story `title`, so a mirrored `stories/base`, `stories/blocks` tree would be a second copy of the tier structure to keep in sync (`storybook-setup`). Tiers and governance → `design-system`; each primitive → `reusables`; the prefix mechanism → `tailwind-css`. Its split styles/components build → the per-package `turbo.json` in `turborepo-monorepo`.
- **`packages/contracts`** — everything both sides of the wire must agree on, in the four layers `constants/ permissions/ schemas/ types/`, each flat with the `<domain>.<kind>.ts` grammar and its own explicit-export barrel (`typescript-best-practices`, `naming`). A const or schema keeps its inferred type in the same file, so `types/` holds only shapes nothing else infers. Named for what it holds rather than for one of its four kinds.
- **`packages/hooks`** — `use-<subject>.ts` under **concern folders** (`auth/ data/ profile/ ui/`), each with its own barrel, because a package serving several apps is past the flat threshold on day one (`code-structure`). A hook that returns JSX is a provider component, and still lives in its concern folder. **Only generic hooks belong here** — the ones any project of this shape needs. A hook naming a product noun (an album, a photo queue, an export format) is that product's and stays in the app that owns it, however many apps end up calling it; promoting it makes every sibling rebuild for a domain none of them share. What is here is mostly required rather than illustrative: the whole `auth/` group once auth is Firebase, `profile/use-permission` once there is RBAC, and the flag, cursor, maintenance, consent, and theme hooks are each the only client half of a server feature. The tree marks which.
- **`packages/utils`** — flat `<domain>.utils.ts` files with an explicit-export barrel, per `code-structure`'s `@app/<kind>` shared-kind form; anything server-only sits behind a `server/` subfolder with its own `server-only` barrel.
- **`packages/tailwind-config`** — the tokens and layers, once, for every app, plus the self-hosted font files and the shared `postcss.config.js`. Apps import the bundled entry; the prefixed `ui` build imports the layers individually.
- **`packages/typescript-config`** — `base.json` (the strict flags, and no `moduleResolution`) plus one config per consumer: `nextjs.json`, `react-library.json`, and `node-library.json`. Every app's `tsconfig.json` extends the matching one and adds only its own `paths`.
- **`packages/eslint-config`** — `base.js`, `next.js`, `react-internal.js`; the linter itself is a peer dep. Named for the linter it configures: a move to Biome replaces the formatter too, so that is a new package rather than a renamed one.

Two traps, both from the tree:

- **`moduleResolution` follows who resolves the imports, and it is per-target, not per-workspace.** A package that **Node** loads (the API importing `contracts`, a script importing `utils`) extends `node-library.json` → `NodeNext`; a package a **bundler** loads (`ui`, `hooks`) extends `react-library.json` → `Bundler`. Under `NodeNext` TypeScript requires the `.js` extension on relative imports and errors without it, so plain `tsc` emits something Node can load and `build` stays one command. **Set `Bundler` on a Node-loaded package and the build passes while the output cannot be imported** — `ERR_MODULE_NOT_FOUND` naming a file that plainly exists. Fix the compiler option; never add a post-build script that rewrites the emitted imports, and delete one if you find it.
- **Consumers see a shared package's built output**, so build/lint/check-types depend on `^build` — a type change is invisible until that package rebuilds. Shared packages are consumed as `workspace:*`.

## Step 7 — The `functions/*` and `extensions/` tiers (only if asked)

- **`functions/`** — add the glob, then one package per deployable worker, each with its own `package.json` and `tsconfig.json` extending the tier's shared base, plus a tier-level `.gitignore` for the compiled `lib/`. **One codebase per folder is the point:** a cold start loads that worker's dependency tree and nothing else, so a shared `functions/package.json` holding every worker's deps undoes the split. A worker with its own runtime config carries `.env.example` plus one `.env.<project-id>` per tier. The `firebase.json` `codebases` map must name every folder — one that is missing simply never deploys, silently.
- **`extensions/`** — one `<instance-id>.env` per installed Firebase Extension, committed. These hold settings, not secrets; extension secrets are params stored in Secret Manager.

Deploy wiring is `devops`; the runtime code inside a worker is out of scope here.

## Step 8 — CI, hooks, CODEOWNERS

Per `devops`, with the workflow written from `turborepo-monorepo/references/config-templates.md`:

- **One composite `.github/actions/setup`** — checkout with `fetch-depth: 0` (`--affected` needs history to diff the base), `corepack enable`, Node with the package manager's cache, frozen-lockfile install, remote-cache env. Every job reuses it; setup steps are never re-pasted.
- **The job graph** — format check → lint + check-types → build → test, running `--affected` on PRs and full on protected branches. Workflow-level `permissions: {}` deny-all with per-job grants, `concurrency` + `cancel-in-progress`, `timeout-minutes` on every job, and every third-party action pinned to a full commit SHA with a `# vX.Y.Z` comment — **re-resolve the SHAs when scaffolding**, never copy stale ones.
- **Deploy jobs** — one per app, named for the target the user gave, gated on green CI. Keep them as clearly-marked stubs; the real orchestration (OIDC, previews, health check, rollback) is `devops`.
- **Hooks** — husky at the **root** (`prepare: "husky"`), pre-commit running lint-staged on staged files, commit-msg running commitlint. Hooks stay fast: staged and affected only.
- **`.github/CODEOWNERS`** — one route per top-level path so CI config, shared packages, and each app get an owner. Use placeholder owners; real handles are project facts.

## Step 9 — Install and verify (second gate)

Propose the exact commands, wait, then run only the approved ones: `corepack enable`, `pnpm install` at the root, and the repo's own `pnpm turbo run check-types lint build`. Report the real output. Also grep for leftovers the move and rename usually miss — the old scope, the old lockfile, paths pointing above an app's new root. A workspace that doesn't install and build isn't finished; fix it before handing off.

## Step 10 — Delegate each app's insides to `scaffold-next-app`

The shell is the whole job here. Finish by delegating, explicitly and by name:

- **Each frontend app** → **`scaffold-next-app`**, one at a time, passing the app name, its port, its shared-package deps, and whether it has an API layer. It owns the app's folder tree, kind-first `lib/`, styles entry, and env validation.

  **Hand it the frontend tree from [references/target-tree.md](references/target-tree.md), not its own.** Two differences are structural: `app/` sits at the app root rather than under `src/`, and `styles/` is two files because the layers are `packages/tailwind-config`. It also drops the workspace-level root config (`biome.json`, `.husky/`, `.github/`, lockfile, `renovate.json`) — those govern every app and live at the root where `turbo` and the hooks can see them.

  **Everything else is the same folder holding less, and "less" is not "none".** `components/ui/`, `lib/hooks/`, `lib/utils/`, `lib/constants/` and the rest all stay, holding whatever only that app uses — a reusable starts app-scoped and gets promoted on its second consumer, not before. Say this explicitly when delegating, in both directions: left to its standalone default the app rebuilds what the packages already own, and over-corrected it hoists app-local code into packages that then rebuild every sibling for a change none of them care about.

- **The backend app** → its tree is in this skill, not `scaffold-next-app`'s: route handlers over a service layer, versioned `v1/`, `server/` at `src/` root, `guards/` as its own kind, and a committed `scripts/` tier for seeds and backfills. Its internals → `api-architecture`.

- **`apps/storybook`** → **`storybook-setup`**, passing the tiers it must mirror. It is a real app: on a team it is hosted **behind auth**, because a public Storybook publishes every unreleased component and its props. Drop the hosting config and it stays a local `dev` surface — the rest of its tree is unchanged either way.
- **`AGENTS.md`** (+ the `CLAUDE.md → @AGENTS.md` import) → **`scaffold-agents-md`**, handing over the recorded interview answers as project facts: app list and ports, the package scope, catalog usage, the functions tier, deploy target per app.
- **`README.md`** → **`readme-standards`**, once for the workspace root and once per app and package. **Committing** → **`stage-commit`**.

Scaffold no documentation tree — a README and `AGENTS.md` are the entire doc surface a repo gets by default. **Every app and every package gets both**, config-only packages included: the root pair covers the workspace, the local pair covers what only that folder knows, and the closest file wins.

## Output

In chat only: the detected entry situation, the recorded interview answers, the approved manifest with its CREATE / EDIT / MOVE / DELETE outcomes, the `git mv` commands run, the install/verify output verbatim, every deviation found and corrected with the skill it contradicted, the manual follow-ups (deploy root directory, remote-cache secrets), and the queued `scaffold-next-app` delegations. The workspace itself is the artifact — no report file, nothing staged, nothing committed.

## Boundaries

- **Never generates an app from scratch, never overwrites what a scaffolder produced, never re-pins its dependency versions, never runs `git mv`/installs without approval, and never commits** → `stage-commit`.
- **The shell and the three trees.** This skill owns the shape of the workspace, of a frontend app inside it, and of the backend app — that is what [references/target-tree.md](references/target-tree.md) is. What it does not own is the code inside them: a frontend app's implementation → **`scaffold-next-app`**, the API's → `api-architecture`, Storybook's → `storybook-setup`.
- **Executes a standard it does not invent** — workspace/turbo/catalog → `turborepo-monorepo`; CI, hooks, CODEOWNERS, deploy → `devops`; shared tsconfig + the contracts layers → `typescript-best-practices`; `tailwind-config` + the `ui:` prefix → `tailwind-css`; the `ui` package's contents → `design-system` + `reusables`; shared-kind packages and the grouping thresholds → `code-structure`; names → `naming`; a separate API app's internals → `api-architecture`.
- **Project facts belong elsewhere** — real scopes, domains, ports in prose, deploy hosts, owner handles, secret names → `scaffold-agents-md`; README → `readme-standards`.
- **Adjacent jobs** — realigning apps that have already diverged → `sync-apps`; a framework or major upgrade → `migrate-framework`; a feature inside an app → `scaffold-feature`.
- Called **into** by `scaffold-next-app` when an app turns out to need a workspace around it first, and by `scaffold-agents-md` when a repo's shape must be settled before its facts are written.

## References

- [references/target-tree.md](references/target-tree.md) — the full annotated workspace tree: every folder and file, what each is, and what turns the conditional ones on. The specification this command executes.
- [references/templates.md](references/templates.md) — file contents and the exact edits, per step.
