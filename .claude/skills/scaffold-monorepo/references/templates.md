# Workspace-shell templates

Only the shell files that `turborepo-monorepo/references/config-templates.md` does **not** already template. The root `turbo.json`, root `package.json` essentials, `pnpm-workspace.yaml`, the per-package `ui` `turbo.json`, and the CI workflow are written **verbatim from that file** — it is the authority; if a template here disagrees with an owning skill, the skill wins and this file is the bug.

`@app` is a placeholder scope — substitute the repo's. Every version below is illustrative: keep whatever the scaffolder chose, and resolve genuinely new deps with `npm view <pkg> version`.

## Root — files the starter usually omits

### `.npmrc`

```ini
# corepack activates the exact packageManager version; this keeps installs honest.
engine-strict=true
# Workspace packages resolve to the local copy rather than the registry.
link-workspace-packages=deep
# A dependency must be declared to be importable — catches phantom deps at install, not in prod.
strict-peer-dependencies=false
resolution-mode=highest
```

Yarn Berry equivalent lives in `.yarnrc.yml` (`nodeLinker`, `enableGlobalCache`); there is no catalog protocol, so hold versions with `resolutions` + syncpack.

### Root `package.json` — the shell additions

Beyond the essentials in `turborepo-monorepo`, the root also carries the hook wiring and the dev orchestration (`devops`):

```jsonc
{
  "scripts": {
    // dev is orchestrated by pnpm filters, not turbo — turbo's dev task is persistent
    "dev": "pnpm -r --parallel --filter web --filter admin dev",
    "format": "biome check --write .",
    "format:check": "biome check .",
    "prepare": "husky",
    "deps:check": "pnpm dlx syncpack list-mismatches",
  },
  "lint-staged": {
    "*.{ts,tsx,js,json}": "biome check --write",
    "*.{md,mdx}": "prettier --write",
  },
}
```

### Hooks (`devops`)

```sh
# .husky/pre-commit
pnpm lint-staged
```

```sh
# .husky/commit-msg
pnpm commitlint --edit "$1"
```

```js
// commitlint.config.js
export default { extends: ["@commitlint/config-conventional"] };
```

Hooks live at the **repo root only**. An app-level `.husky/` left behind after a move never fires — git reads `core.hooksPath` from the repo, not the package.

### `.github/CODEOWNERS` (`devops` — placeholder owners; real handles are project facts)

```txt
# Later rules win, so order from broad to specific.
*                       @<org>/<team>

/.github/               @<org>/<platform-team>
/packages/tsconfig/     @<org>/<platform-team>
/packages/ui/           @<org>/<design-system-team>
/apps/web/              @<org>/<web-team>
/apps/admin/            @<org>/<web-team>
```

### CI — the affected/full split and a deploy stub (`devops`)

The workflow body comes from `turborepo-monorepo`; these are the two shell-level additions.

```yaml
# .github/workflows/ci.yml — PRs run only what changed; protected branches run everything
- name: Checks
  run: pnpm turbo run lint check-types build test ${{ github.event_name == 'pull_request' && '--affected' || '' }}
```

```yaml
# one deploy job per app — a marked stub; real orchestration (OIDC, previews, health check, rollback) → devops
deploy-web:
  needs: check
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  timeout-minutes: 20
  environment: production # required reviewers live on the environment, not in the workflow
  permissions: { contents: read, id-token: write } # id-token for OIDC cloud auth
  steps:
    - uses: ./.github/actions/setup
    - run: pnpm turbo run build --filter web
    # TODO(devops): authenticate via OIDC and deploy apps/web to <target>
```

## Shared packages

### `packages/tsconfig` (`typescript-best-practices`)

```jsonc
// packages/tsconfig/package.json
{
  "name": "@app/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-library.json"],
}
```

```jsonc
// packages/tsconfig/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "preserve",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
  },
}
```

`nextjs.json` and `react-library.json` extend `base.json` and add only `jsx`, `lib`, and `plugins`. An app's own `tsconfig.json` becomes:

```jsonc
// apps/<name>/tsconfig.json — paths stay relative to the APP, not the old repo root
{
  "extends": "@app/tsconfig/nextjs.json",
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
}
```

### `packages/ui` — the package boundary (`design-system`, `tailwind-css`, `reusables`)

```jsonc
// packages/ui/package.json — per-tier subpath exports keep the import site honest about the tier
{
  "name": "@app/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./base": "./src/base/index.ts",
    "./blocks": "./src/blocks/index.ts",
    "./patterns": "./src/patterns/index.ts",
    "./layouts": "./src/layouts/index.ts",
    "./styles.css": "./dist/styles.css",
  },
  "scripts": {
    "build:styles": "tailwindcss -i ./src/styles/globals.css -o ./dist/styles.css",
    "check-types": "tsc --noEmit",
  },
  "devDependencies": { "@app/tsconfig": "workspace:*", "@app/tailwind-config": "workspace:*" },
}
```

The split styles/components build wiring is the per-package `turbo.json` in `turborepo-monorepo/references/config-templates.md`.

```css
/* packages/ui/src/styles/globals.css — the prefixed compilation */
@import "tailwindcss" prefix(ui);
@import "@app/tailwind-config/theme.css"; /* individual layers, NOT the bundle */
@import "@app/tailwind-config/base.css";
@import "@app/tailwind-config/utilities.css";
@import "./components.css";

/* Must be re-declared here or ui:dark:* silently falls back to the media query. */
@custom-variant dark (&:where(.dark, .dark *));
```

```ts
// packages/ui/src/lib/cn.ts — prefix-aware: plain twMerge doesn't recognize ui:* and conflict resolution fails silently
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({ prefix: "ui" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Each consuming app's own CSS entry stays **unprefixed** and adds `@source "../../packages/ui/src";` — without it the app build emits zero utilities for package components.

### `packages/tailwind-config` (`tailwind-css`)

```jsonc
// packages/tailwind-config/package.json — layers exported individually AND as a bundle
{
  "name": "@app/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./index.css",
    "./tokens.css": "./tokens.css",
    "./theme.css": "./theme.css",
    "./base.css": "./base.css",
    "./utilities.css": "./utilities.css",
  },
}
```

Apps import `@app/tailwind-config` (the bundle); the prefixed `ui` build imports the layers one by one. Token values and layer order → `tailwind-css`.

### `packages/schemas` (`typescript-best-practices` — the four layers)

```txt
packages/schemas/src/
  constants/     # shared enums, status unions, limits
  schemas/       # Zod schemas — the cross-boundary contract
  types/         # z.infer'd types + hand-written shared types
  permissions/   # permission strings, role → permission maps, can() (only with RBAC)
  index.ts       # the whole public surface
```

```jsonc
// packages/schemas/package.json
{
  "name": "@app/schemas",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "check-types": "tsc --noEmit" },
  "dependencies": { "zod": "catalog:" },
}
```

### `packages/utils` (`code-structure` — the `@app/<kind>` shared-kind form)

Kind-first folders with a barrel each and a single `src/index.ts` public surface; same `package.json` shape as `schemas` minus the zod dependency. Only genuinely cross-app helpers belong here — app-local helpers stay in that app's `src/lib/utils/` (`scaffold-next-app`).

## `functions/*` (only when the tier exists)

```jsonc
// functions/<group>/package.json
{
  "name": "@app/functions-<group>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": { "build": "tsc", "check-types": "tsc --noEmit" },
  "dependencies": { "@app/schemas": "workspace:*" },
  "devDependencies": { "@app/tsconfig": "workspace:*" },
}
```

Add `- "functions/*"` to the workspace globs. The root `turbo.json` already covers `dist/**` in `build.outputs`; deploy wiring → `devops`.

## Situation A — the moved app's `package.json`

```jsonc
// apps/<name>/package.json — after the move
{
  "name": "@app/<name>",
  "private": true, // never publish an app
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev --turbopack --port 3000", // the port from the interview
    "build": "next build",
    "start": "next start",
    "check-types": "tsc --noEmit",
  },
  "dependencies": {
    "next": "catalog:", // was the literal version the scaffolder picked — now recorded in the catalog
    "react": "catalog:",
    "react-dom": "catalog:",
    "@app/ui": "workspace:*",
    "@app/schemas": "workspace:*",
  },
  "devDependencies": { "@app/tsconfig": "workspace:*", "@app/tailwind-config": "workspace:*" },
}
```

`packageManager` is **removed** from here and set once at the root. Cataloging a version is not re-picking it — the catalog records exactly what the scaffolder resolved.
