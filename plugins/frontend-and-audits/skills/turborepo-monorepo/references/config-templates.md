# Monorepo config templates

Copy-paste-able house templates behind `SKILL.md`. All app-agnostic — replace `@org` with the repo's scope.

## Root `turbo.json`

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "env": ["NEXT_PUBLIC_*", "APP_ENV"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "storybook-static/**"]
    },
    "lint": { "dependsOn": ["^build", "^lint"] },
    "check-types": { "dependsOn": ["^build", "^check-types"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

Strict env mode: list every var a task reads in its `env` (wildcards fine) — undeclared vars aren't passed to the task and don't affect its cache key. `inputs: [".env*"]` hashes the files only; it does not cover CI-injected env.

## Root `package.json` (essentials)

```json
{
  "name": "@org/root",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.19.0",
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types",
    "dev": "pnpm -r --parallel --filter web --filter app dev"
  },
  "devDependencies": { "turbo": "^2.9.6" }
}
```

## `pnpm-workspace.yaml` (with catalog)

```yaml
packages:
  - "apps/*"
  - "packages/*"
  # - "functions/*"   # only if the repo has serverless/workers

catalog:
  next: 16.2.10 # keep current — example values, check the registry
  react: 19.2.0 # keep current
  react-dom: 19.2.0 # keep current

# pnpm blocks dependency lifecycle scripts by default — allowlist only what must build.
# pnpm 11 form; `onlyBuiltDependencies` (a list) was the 10 form and is removed in 11.
allowBuilds:
  esbuild: true
  sharp: true
```

Consume in an app: `"next": "catalog:"`, `"react": "catalog:"`.

## Per-package `turbo.json` — a `ui` package with a split build

```json
{
  "extends": ["//"],
  "tasks": {
    "build": { "dependsOn": ["build:styles", "build:components"] },
    "build:styles": { "outputs": ["dist/**"] },
    "build:components": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "with": ["dev:styles", "dev:components"] },
    "dev:styles": { "cache": false, "persistent": true },
    "dev:components": { "cache": false, "persistent": true }
  }
}
```

## Shared config package — `packages/typescript-config`

```json
// package.json
{ "name": "@org/typescript-config", "version": "0.0.0", "private": true,
  "files": ["base.json", "nextjs.json", "react-library.json"] }
```

```jsonc
// an app's tsconfig.json
{ "extends": "@org/typescript-config/nextjs.json", "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

Same shape for `@org/eslint-config` (or `@org/biome-config`): the config lives in the package, apps extend it. Add both to the consuming app's `devDependencies` as `"@org/typescript-config": "workspace:*"`.

## CI — GitHub Actions

```yaml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
permissions:
  contents: read # least-privilege token (house devops rule)
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true # supersede stale runs on the same ref
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { fetch-depth: 0 }          # --affected needs history to diff the base
      - run: corepack enable
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint check-types build test --affected
```

`--affected` runs only the packages changed vs the base branch; remote cache (`TURBO_TOKEN`/`TURBO_TEAM`) shares artifacts across runs.

Actions are pinned to full commit SHAs with a version comment (house `devops` rule — tags are mutable, SHAs aren't). SHAs above were verified against `actions/*` releases in Aug 2026; when bumping, update the SHA and the `# vX.Y.Z` comment together (Renovate/Dependabot do this for you).
