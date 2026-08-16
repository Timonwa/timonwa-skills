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
/packages/typescript-config/     @<org>/<platform-team>
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
    # Checkout must precede a LOCAL composite action — the runner reads it from the
    # workspace, so it does not exist until this step has run.
    - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      with: { fetch-depth: 0 }
    - uses: ./.github/actions/setup
    - run: pnpm turbo run build --filter web
    # TODO(devops): authenticate via OIDC and deploy apps/web to <target>
```

## Shared packages

### `packages/typescript-config` (`typescript-best-practices`)

```jsonc
// packages/typescript-config/package.json
{
  "name": "@app/typescript-config",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "node-library.json", "react-library.json"],
}
```

```jsonc
// packages/typescript-config/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
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

**`base.json` deliberately sets no `module` or `moduleResolution`** — those depend on who resolves the imports, so each target config declares its own:

| Target config        | Adds                                                                         | For                                              |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| `nextjs.json`        | `module: "preserve"`, `moduleResolution: "bundler"`, `jsx`, `lib`, `plugins` | an app the framework bundles                     |
| `react-library.json` | `module: "preserve"`, `moduleResolution: "bundler"`, `jsx`, `lib`            | a package every consumer bundles (`ui`, `hooks`) |
| `node-library.json`  | `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `outDir`, `rootDir`    | a package **Node** loads (`contracts`, `utils`)  |

Under `node-library.json` TypeScript requires the `.js` extension on relative imports and errors without one, so `"build": "tsc"` emits output Node can load with no post-processing. Set `bundler` on one of those packages instead and the build passes while `dist/` cannot be imported — `ERR_MODULE_NOT_FOUND` naming a file that exists. That is a compiler-option bug; do not paper over it with a script that rewrites the emitted imports.

An app's own `tsconfig.json` becomes:

```jsonc
// apps/<name>/tsconfig.json — paths stay relative to the APP, not the old repo root
{
  "extends": "@app/typescript-config/nextjs.json",
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
    "./assets": "./src/assets/index.ts",
    "./base": "./src/base/index.ts",
    "./blocks": "./src/blocks/index.ts",
    "./icons": "./src/icons/index.ts",
    "./layouts": "./src/layouts/index.ts",
    "./patterns": "./src/patterns/index.ts",
    "./styles.css": "./dist/styles.css",
  },
  "scripts": {
    "build:styles": "tailwindcss -i ./src/styles/index.css -o ./dist/styles.css",
    "check-types": "tsc --noEmit",
  },
  "devDependencies": {
    "@app/typescript-config": "workspace:*",
    "@app/tailwind-config": "workspace:*",
    // the colocated *.stories.tsx import Meta and StoryObj, so this package's own
    // check-types needs them. Story files are excluded from the build include,
    // so nothing Storybook-related reaches a consumer.
    "@storybook/react": "catalog:",
  },
}
```

The split styles/components build wiring is the per-package `turbo.json` in `turborepo-monorepo/references/config-templates.md`.

```css
/* packages/ui/src/styles/index.css — the prefixed compilation */
@import "tailwindcss" prefix(ui);
/* Individual layers, NOT the bundle: an unprefixed @apply preset cannot load
   inside a prefix(ui) build. Same order as shared-styles.css. */
@import "@app/tailwind-config/tokens.css";
@import "@app/tailwind-config/theme.css";
@import "@app/tailwind-config/base.css";
@import "@app/tailwind-config/utilities.css";
@import "@app/tailwind-config/animations.css";
@import "./components.css";

/* Must be re-declared here or ui:dark:* silently falls back to the media query. */
@custom-variant dark (&:where(.dark, .dark *));
```

```ts
// packages/ui/src/cn.ts — at src root, not in a lib/ folder: one file is not a kind — prefix-aware: plain twMerge doesn't recognize ui:* and conflict resolution fails silently
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
    ".": "./shared-styles.css",
    "./tokens.css": "./tokens.css",
    "./theme.css": "./theme.css",
    "./base.css": "./base.css",
    "./utilities.css": "./utilities.css",
    "./components.css": "./components.css",
    "./animations.css": "./animations.css",
    "./postcss.config.js": "./postcss.config.js",
  },
}
```

Apps import `@app/tailwind-config` (the bundle); the prefixed `ui` build imports the layers one by one. Token values and layer order → `tailwind-css`.

### `packages/eslint-config` and `packages/hooks`

```jsonc
// packages/eslint-config/package.json — config only, nothing to build
{
  "name": "@app/eslint-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "files": ["base.js", "next.js", "react-internal.js"],
  "exports": {
    "./base": "./base.js",
    "./next": "./next.js",
    "./react-internal": "./react-internal.js",
  },
  "peerDependencies": { "eslint": "catalog:" },
}
```

```jsonc
// packages/hooks/package.json — react is a PEER, never a dependency: two copies of
// React in one app is the invalid-hook-call error
{
  "name": "@app/hooks",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "check-types": "tsc --noEmit" },
  "peerDependencies": { "react": "catalog:" },
  "devDependencies": { "@app/typescript-config": "workspace:*", "react": "catalog:" },
}
```

`hooks` is consumed by bundlers only, so it extends `react-library.json` and ships source rather than `dist` — the same reason `ui` does. Its concern folders and what belongs in each → the tree.

### `packages/contracts` (`typescript-best-practices` — the four layers)

```txt
packages/contracts/src/
  constants/     # shared enums, status unions, limits
  schemas/       # Zod schemas — the cross-boundary contract
  types/         # z.infer'd types + hand-written shared types
  permissions/   # permission strings, role → permission maps, can() (only with RBAC)
  index.ts       # the whole public surface
```

```jsonc
// packages/contracts/package.json
{
  "name": "@app/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  // plain tsc — node-library.json makes TypeScript emit the .js extensions Node needs,
  // so there is nothing to post-process
  "scripts": { "build": "tsc", "check-types": "tsc --noEmit" },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": { "@app/typescript-config": "workspace:*" },
}
```

### `packages/utils` (`code-structure` — the `@app/<kind>` shared-kind form)

Flat `<domain>.utils.ts` files with a single `src/index.ts` public surface, plus a `server/` subfolder with its own `server-only` barrel for anything that must never reach a browser. Same `package.json` shape as `contracts` minus the zod dependency — including the `dist` exports and the plain `tsc` build, because the API and the workspace scripts load this package from Node too.

Only genuinely cross-app helpers belong here — app-local helpers stay in that app's `src/lib/utils/` (`scaffold-next-app`).

Both packages extend `@app/typescript-config/node-library.json`; `ui` and `hooks` extend `react-library.json`. Getting that backwards builds clean and fails at import time.

## `functions/*` (only when the tier exists)

```jsonc
// functions/<group>/package.json — one codebase per folder, with its own deps, so a
// cold start loads this worker's tree and nothing else
{
  "name": "@app/functions-<group>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "lib/index.js",
  "scripts": { "build": "tsc", "check-types": "tsc --noEmit" },
  "dependencies": { "@app/contracts": "workspace:*" },
  "devDependencies": { "@app/typescript-config": "workspace:*" },
}
```

```jsonc
// functions/<group>/tsconfig.json
{
  // NOT react-library: a Cloud Function is loaded by Node, so it needs the same
  // NodeNext resolution packages/contracts does. With `bundler` this builds clean
  // and fails at deploy.
  "extends": "@app/typescript-config/node-library.json",
  "compilerOptions": { "outDir": "lib", "rootDir": "src" },
  "include": ["src/**/*"],
}
```

Add `- "functions/*"` to the workspace globs, and `lib/**` to the root `turbo.json` `build.outputs` alongside `dist/**`. Every folder here must also appear in `firebase.json`'s `codebases` map — one that is missing simply never deploys, silently. Deploy wiring → `devops`.

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
    "@app/contracts": "workspace:*",
  },
  "devDependencies": { "@app/typescript-config": "workspace:*", "@app/tailwind-config": "workspace:*" },
}
```

`packageManager` is **removed** from here and set once at the root. Cataloging a version is not re-picking it — the catalog records exactly what the scaffolder resolved.

Also removed from the app during the move, because they now govern the whole workspace and live at its root: `biome.json`, `commitlint.config.*`, `.husky/`, `.github/`, `.nvmrc`, `renovate.json`, `lint-staged.config.*`, and the lockfile. An app-level copy of any of these is dead config — it never runs, and it drifts from the one that does.

What each app keeps, because it genuinely differs per deployment: its `.env`/`.env.example`, its `next.config.ts`, its hosting config, its `eslint.config.mjs` (three lines, extending `@app/eslint-config/next`), its own `_docs/`, and its `README.md` + `AGENTS.md`. **Every app and every package carries that pair, config-only packages included** — the root files cover the workspace, the local ones cover what only that folder knows, and the closest file wins (`readme-standards`, `scaffold-agents-md`).
