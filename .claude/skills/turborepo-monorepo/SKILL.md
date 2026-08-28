---
name: turborepo-monorepo
description: Use when setting up or working in a monorepo — pnpm workspaces + Turborepo (v2). Covers workspace layout, turbo.json tasks/caching/dependsOn graph, shared config packages, the pnpm catalog, dev/build orchestration, remote caching, and CI with --affected. What goes INSIDE packages (code layout) → `code-structure`; the tsconfig/tailwind config packages → `typescript-best-practices` / `tailwind-css`.
metadata:
  version: 1.0.1
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Turborepo monorepo

House monorepo = **pnpm workspaces + Turborepo v2**. This skill owns the _build tooling_ (workspaces, `turbo.json`, caching, task graph, CI). The _code layout inside_ `apps/` and `packages/` → `code-structure`.

> **Project facts → `AGENTS.md`:** the `@org/*` scope, which apps exist, whether there's a `functions/*` tier, and whether the pnpm catalog is used. This skill is the standard shape; those are per-repo.

## Workspace layout

- `apps/*` — deployable apps (Next.js, Astro, a Storybook app). `packages/*` — shared libraries. `functions/*` — serverless/workers, **only when present**.
- Shared packages are **`@org/*`**-scoped and consumed via the **`workspace:*`** protocol: typically `typescript-config`, `eslint-config` (or `biome-config`), `ui`, `utils`, `hooks`, `contracts`, `tailwind-config`. What lives inside each → `code-structure`.

## pnpm setup

- **`packageManager: "pnpm@10.19.0"`** in the root `package.json` — corepack requires an **exact version**, not a range (activate with `corepack enable`).
- `pnpm-workspace.yaml` lists the globs:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- **Catalog** — pin shared major deps once and reference them everywhere, so every app moves in lockstep:
  ```yaml
  catalog:
    next: 16.2.10 # keep current — example values, check the registry
    react: 19.2.0 # keep current
    react-dom: 19.2.0 # keep current
  ```
  Consume with `"next": "catalog:"` in each app's `package.json`. Use it for the framework/runtime deps shared across apps.
- **The catalog only covers deps you put in it** — catch drift in the rest with `pnpm dedupe` and syncpack (`pnpm dlx syncpack list-mismatches`).
- **pnpm blocks dependency lifecycle scripts by default** — allowlist the few that genuinely must build via **`allowBuilds`** in `pnpm-workspace.yaml`, a name → boolean map (`sharp: true`, `esbuild: true`); never flip a blanket ignore-scripts switch off. `onlyBuiltDependencies` was the pnpm 10 form and is **removed in 11**; in 11 `strictDepBuilds` defaults to `true`, so an unreviewed build fails the install.

## turbo.json — the house shape

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build":       { "dependsOn": ["^build"], "inputs": ["$TURBO_DEFAULT$", ".env*"],
                     "env": ["NEXT_PUBLIC_*", "APP_ENV"],
                     "outputs": ["dist/**", ".next/**", "!.next/cache/**", "storybook-static/**"] },
    "lint":        { "dependsOn": ["^build", "^lint"] },
    "check-types": { "dependsOn": ["^build", "^check-types"] },
    "test":        { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "dev":         { "cache": false, "persistent": true }
  }
}
```

- **It's `tasks`, not `pipeline`.** `pipeline` was renamed in Turborepo 2.0 — never write it (migrate old configs with `npx @turbo/codemod migrate`). Schema host is `turborepo.com`.
- `test` is optional (include it in repos that have tests). No `globalDependencies`/`globalEnv` by default — add `globalDependencies` only for a genuinely cross-cutting file.

## Task graph

- **`"^build"`** = run this task in _dependencies_ first (topological). **`"build"`** = same package. **`"pkg#task"`** = one specific package.
- Independent tasks (format) declare no `dependsOn`; build → `["^build"]`; typecheck/lint → `["^build", "^<self>"]`; test → `["^build"]`; **dev → `cache:false, persistent:true`**.
- A **`persistent`** task (dev servers) **can't have dependents** — nothing may `dependsOn` it.

## Env vars & strict mode

Turborepo 2 runs tasks in **strict env mode**: an env var not declared in the task's `env` (or `globalEnv`) is **not passed to the task's process** and is excluded from its cache key. Two silent failure modes:

- A build that reads `NEXT_PUBLIC_*` gets `undefined` — the app "builds fine" with missing config baked in.
- A changed secret doesn't change the hash, so turbo restores a **stale cached build** made with the old value.

Declare per-task `env` — wildcards allowed: `"env": ["NEXT_PUBLIC_*", "APP_ENV"]`. `inputs: [".env*"]` is **not a substitute**: it hashes the files, not the process env, and CI-injected vars never touch a `.env` file.

## Caching

- **Declare `outputs` or the task won't cache.** Fine-tune `inputs` with `$TURBO_DEFAULT$` + negations (`"!**/*.md"`); include `.env*` where builds read env.
- Always **exclude `.next/cache/**`** from Next build outputs (it's not a build artifact).
- **Remote cache**: `turbo login` + `turbo link` (Vercel Remote Cache); in CI, provide `TURBO_TOKEN` + `TURBO_TEAM` so cache is shared across machines.
- **`outputLogs`** (per task, or the `--output-logs` flag) tames log noise: `full` (default), `new-only` (replay only cache misses — the CI sweet spot), `errors-only`.

## Per-package config

A package overrides/extends the root by `extends`:

```json
{ "extends": ["//"], "tasks": {
  "build": { "dependsOn": ["build:styles", "build:components"] },
  "build:styles": { "outputs": ["dist/**"] },
  "build:components": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
  "dev": { "with": ["dev:styles", "dev:components"] }
}}
```

(This is the real `packages/ui` pattern — a build split into styles + components. Use `$TURBO_EXTENDS$` to add to an inherited array; `extends: false` to opt a task out.)

## Running tasks

- `turbo run build` / `lint` / `check-types` — cached, parallel, topologically ordered.
- **`--filter`** to scope: `web` (one), `web...` (web + its deps), `...web` (web + its dependents), `./apps/*` (by path).
- **CI: `turbo run <task> --affected`** — runs only packages changed vs the base branch. Use this, not the legacy `--filter=[HEAD^]`.
- **Dev is orchestrated by pnpm, not turbo**: `pnpm -r --parallel --filter web --filter app dev` (turbo's `dev` task is persistent; pnpm picks which apps start).
- **`turbo boundaries`** (2.x) — enforces cross-package import rules: no reaching into another package's internals, no importing undeclared dependencies.
- **`turbo prune <app> --docker`** — writes a partial monorepo containing only `<app>` + its deps, for slim Docker/App Hosting builds (v2 syntax; the v1 `--scope` flag is gone).

## Cache troubleshooting

- **Cache invalidates unexpectedly** → inspect `globalDependencies`, the task's `inputs`, and its `env` — one over-broad glob or wildcard var re-hashes everything.
- **Type errors survive a cache hit** → check types through **transit nodes** so packages type-check in parallel yet re-run when a dependency changes: `"transit": { "dependsOn": ["^transit"] }` and give `check-types` `"dependsOn": ["transit"]`.
- **`turbo run build --dry-run --filter=<pkg>`** — shows what would run and why (the hash inputs) without running anything.
- **`--force`** bypasses the cache entirely; **`--continue`** keeps running past a failed task (use in CI to surface every failure in one run).
- **Large monorepos** may need a raised `concurrency` (default 10).

## Framework build outputs

Next.js → `.next/**` (exclude `!.next/cache/**`); Astro → `dist/**`; Storybook → `storybook-static/**`. (No NestJS in the house stack — API needs are Next route handlers + Firebase, or an external backend.)

## Shared-package gotchas

- **Apps consume built output (`dist/`)** — a type change in a shared package is invisible to consumers until that package rebuilds. Wire `dependsOn: ["^build"]` on build/lint/check-types, run the package's watch task in dev; if types look stale, `pnpm --filter @org/<pkg> build`.
- **An ESM package that Node loads needs `moduleResolution: "NodeNext"`, not `"bundler"`.** Under `bundler`, `tsc` emits extensionless relative imports, which Node’s ESM resolver rejects — the build passes and `dist/` cannot be imported (`ERR_MODULE_NOT_FOUND` naming a file that exists). `NodeNext` makes TypeScript require the `.js` extension in source and error without it, so plain `tsc` emits loadable output. Split the shared configs by consumer (a `node-library.json` beside `react-library.json`) rather than rewriting emitted imports in a post-build script.

## CI & versioning

- **GitHub Actions** (house CI): `corepack enable` → `pnpm install --frozen-lockfile` → `turbo run lint check-types build test --affected`, with remote-cache env. Template + a fuller root/`ui` config in `references/config-templates.md`.
- **Versioning**: manual by default (house repos don't ship packages externally). Add **Changesets** only if you start publishing a package to a registry.

## Do / Don't

- **Do** use `tasks` + the `turborepo.com` schema; declare `outputs` on every cacheable task; declare per-task `env` for every var a task reads (strict mode); depend on `^build`; pin shared deps via the pnpm catalog; `extends: ["//"]` in packages; run `--affected` in CI; orchestrate dev with pnpm.
- **Don't** write `pipeline` (v1); forget `outputs` (silent cache misses); rely on `inputs: [".env*"]` instead of `env` (hashes files, not the process env); give a `persistent` task dependents; hardcode diverging dep versions across apps; reach for NestJS/Jest/CircleCI/GitLab/Docker recipes (off-stack).

> **Audit:** review this domain on demand with the manually-invoked `dependency-audit` command (see `audit-all` for the whole suite).
