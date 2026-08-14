# Adapter templates

What `scaffold-next-app` writes, split by who owns the file:

- **Part 1 — CREATE.** Files no official starter provides. Written whole.
- **Part 2 — EDIT.** Files the starter owns. Described as precise additions/changes, never as a replacement file.
- **Part 3 — DELETE.** The demo cruft each starter ships.

Every block is real, runnable code with `// …` elisions where trimmed. Each names its owning skill; when a block and its owning skill disagree, **the skill wins and this file is the bug**. No version appears in any dependency here on purpose — the starter chose the versions, and only a genuinely new dependency gets one, resolved from the registry at scaffold time.

## Part 1 — CREATE (nothing ships these)

### `.env.example` (`devops` — every required var, zero real values)

```dotenv
# Tier is APP_ENV, never NODE_ENV. Per-tier derivable values (base URLs, cookie domain,
# CORS origins) belong in runtime config keyed off APP_ENV — not here.
APP_ENV=development

# Server-only
SESSION_SECRET=

# Exposed to the browser bundle — public values only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### `src/lib/config/env.ts` (`devops` — validate at boot; leaf module, imports only zod)

```ts
import { z } from "zod";

// Leaf module on purpose: app code imports `env`, never process.env, so a missing
// var fails the boot instead of surfacing as undefined deep inside a request.
const EnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
```

### `src/lib/config/routes.ts` + a kind barrel (`code-structure`, `naming`)

```ts
// src/lib/config/routes.ts — no hardcoded path strings anywhere else
export const ROUTES = {
  home: "/",
  login: "/auth/login",
  dashboard: "/dashboard/overview",
  // …
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
```

`endpoints.ts` is the same shape for API paths, and `site.ts` holds the canonical name, URL, and OG defaults.

```ts
// src/lib/config/index.ts — one barrel per kind, one explicit line per file
export * from "./endpoints";
export * from "./env";
export * from "./routes";
export * from "./site";
```

**One explicit export line per file, never `export *` from a directory** — the barrel is the kind's public surface, and a wildcard hides what joined it. Every kind gets this treatment; `src/lib/server/index.ts` gets its own and is **never** merged with these.

Domain files in the suffixed kinds follow `<domain>.<kind>.ts`, with the const and its inferred type in the same file:

```ts
// src/lib/constants/nav.constant.ts
import type { NavItem } from "@/lib/types";

export const NAV_ITEMS = [
  { href: "/about", label: "About" },
  // …
] as const satisfies readonly NavItem[];
```

### `src/lib/utils/cn.ts` (`reusables`)

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`clsx` and `tailwind-merge` are usually **new** deps — propose adding them, unresolved (`pnpm add clsx tailwind-merge`), and let the package manager pick the version. Inside a `ui:`-prefixed package this must be `extendTailwindMerge({ prefix: "ui" })`; plain `twMerge` does not recognize `ui:` classes and conflict resolution fails silently.

### The style layers (`tailwind-css`)

`tokens.css`, `theme.css`, and `base.css` are populated from the starter's own `globals.css` (Part 2's split) plus the house token roles. `utilities.css`, `components.css`, and `animations.css` are created as **empty concern files with a one-line comment each**, so the first addition has an obvious home.

```css
/* src/styles/tokens.css — OKLCH, semantic roles; .dark overrides the same names */
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.21 0.01 265);
  --primary: oklch(0.58 0.18 265);
  --primary-foreground: oklch(0.99 0 0);
  --border: oklch(0.92 0.01 265);
  --radius: 0.625rem;
  /* … */
}

.dark {
  --background: oklch(0.18 0.01 265);
  --foreground: oklch(0.97 0 0);
  --border: oklch(0.31 0.01 265);
  /* … */
}
```

```css
/* src/styles/theme.css — `inline` is load-bearing: utilities keep pointing at the live
   vars, so .dark and any scoped override flow through. Never bake a literal in here. */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-border: var(--border);
  --radius-lg: var(--radius);
  /* keep the --font-* mappings the starter generated for its next/font vars */
}
```

```css
/* src/styles/base.css */
@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### Page composer + section (`code-structure` — one file per section)

```tsx
// src/components/marketing/home/index.tsx — the composer owns the layout wrapper
import { Hero } from "./Hero";

export function HomePageContent() {
  return (
    <main>
      <Hero />
    </main>
  );
}
```

```tsx
// src/components/marketing/home/Hero.tsx — named export, no default
export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold text-foreground">{/* … */}</h1>
    </section>
  );
}
```

### Example component, folder-per-component (`reusables`, `naming`)

Each component owns a folder: the component, its story, its barrel, and a test **only when there is behaviour to assert**.

```tsx
// src/components/ui/base/Button/Button.tsx
/**
 * @description Base button primitive. Renders a native <button>; use Link for navigation.
 */
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

const VARIANT_CLASSES = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  ghost: "bg-transparent text-foreground hover:bg-primary/10",
} as const;

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
} as const;

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
};

export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className, // merged last so a caller's class wins
      )}
      {...rest}
    />
  );
}
```

```ts
// src/components/ui/base/Button/index.ts — the component barrel
export * from "./Button";
```

```ts
// src/components/ui/base/index.ts — the tier barrel, one line per component folder
export * from "./Badge";
export * from "./Button";
```

```ts
// src/components/ui/index.ts — re-exports every tier; all four exist from day one
export * from "./base";
export * from "./blocks";
export * from "./layouts";
export * from "./patterns";
```

A **compound component ships its parts as separate named exports**, never as static properties (`Accordion.Item`) — a static property defeats tree-shaking through the tier barrels:

```tsx
// src/components/ui/blocks/Accordion/Accordion.tsx
export function Accordion({ children }: AccordionProps) { /* … */ }
export function AccordionItem({ children }: AccordionItemProps) { /* … */ }
```

### Example story (`storybook-story-writing`, `storybook-setup`)

```tsx
// src/components/ui/base/Button/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Base/Button",
  component: Button,
  args: { children: "Button", onClick: fn() },
  argTypes: {
    variant: { control: "select", options: ["primary", "ghost"] },
    size: { control: "select", options: ["sm", "md"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Ghost: Story = { args: { variant: "ghost" } };
export const Disabled: Story = { args: { disabled: true } };
```

`storybook init` writes `.storybook/main.ts` itself — reshape it (Part 2's "files Storybook owns") rather than writing it from here.

### `lib/server` boundary — only when the answers asked for a backend layer (`backend`, `code-structure`)

```ts
// src/lib/server/index.ts — the server-only barrel; never merged with a client-safe one
import "server-only";

export * from "./actions";
export * from "./cache";
export * from "./services";
```

`clients/`, `data/`, and `utils/` stay **out** of the top barrel — they are called by the layers above them, not by app code. Exporting them invites a page to query the store directly.

One vertical slice, in the build order **schema → data → service → action**, bodies as `// TODO:`:

```ts
// src/lib/server/data/user.data.ts — store access only; no business rules
import { COLLECTIONS } from "./collections.data";
import { firestore } from "@/lib/server/clients/firebase/firebase.client";

export async function findUserById(id: string) {
  const snap = await firestore.collection(COLLECTIONS.USERS).doc(id).get();
  return snap.exists ? snap.data() : null;
}
```

```ts
// src/lib/server/services/user.service.ts — the only caller of user.data.ts
import { findUserById } from "@/lib/server/data";

export async function getUserProfile(id: string) {
  // TODO: authorize the caller, then map the record to the response shape.
  throw new Error("Not implemented");
}
```

```ts
// src/lib/server/actions/user.action.ts — one file per domain, never one actions.ts
"use server";

import { requireCaller } from "@/lib/server/utils/auth-guard.utils";

export async function updateProfile(input: unknown) {
  const caller = await requireCaller(); // authorize first — actions are reachable by direct POST
  // TODO: parse `input` with the schema, call the service, revalidate the tag.
  throw new Error("Not implemented");
}
```

```ts
// src/lib/server/data/collections.data.ts — every collection path; no literal elsewhere
export const COLLECTIONS = {
  USERS: "users",
  // …
} as const;
```

### CI, hooks, commitlint — **standalone only** (`devops`)

In a monorepo these live once at the root and belong to `scaffold-monorepo`. Standalone:

```yaml
# .github/actions/setup/action.yml — one composite setup, reused by every job
name: Setup
description: Checkout, pnpm + Node, install
runs:
  using: composite
  steps:
    - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      with: { fetch-depth: 0 }
    - run: corepack enable
      shell: bash
    - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
      with: { node-version: 22, cache: pnpm }
    - run: pnpm install --frozen-lockfile
      shell: bash
```

```yaml
# .github/workflows/ci.yml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
permissions: {} # deny-all default; grant per job
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions: { contents: read }
    steps:
      - uses: ./.github/actions/setup
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm check-types
      - run: pnpm build
```

Third-party actions are SHA-pinned with a version comment — **re-resolve the SHAs at scaffold time** instead of copying the ones above. Add a `test` job only for the runners chosen in the interview.

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

## Part 2 — EDIT (the starter owns these; change them in place)

### `package.json` — add scripts, never replace the block

Keep `dev`, `build`, `start`, and `lint` exactly as the starter wrote them (they encode its bundler choice). Add only what is missing:

```jsonc
{
  "scripts": {
    // starter's dev/build/start/lint stay untouched above
    "check-types": "tsc --noEmit",
    "format": "biome check --write .", // or prettier --write . when the starter chose ESLint + Prettier
    "format:check": "biome check .",
    "storybook": "storybook dev -p 6006", // only if Storybook was chosen
    "prepare": "husky", // standalone only
  },
  "lint-staged": {
    // standalone only
    "*.{ts,tsx,js,json}": "biome check --write",
    "*.{md,mdx}": "prettier --write",
  },
}
```

`storybook init` adds its own `storybook`/`build-storybook` scripts — if it ran, do not duplicate them.

### `tsconfig.json` — add flags and the alias; keep everything the starter set

Leave `plugins: [{ "name": "next" }]`, `include`, `moduleResolution`, `jsx`, and `lib` alone. Add, per `typescript-best-practices`:

```jsonc
{
  "compilerOptions": {
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }, // present already when created with --src-dir
  },
}
```

In a monorepo, replace the app's `compilerOptions` with `"extends": "@org/typescript-config/nextjs.json"` plus only its own `paths` — the shared package is `scaffold-monorepo`'s.

### `next.config.ts` — add house flags and headers (`nextjs-best-practices`, `devops`)

The starter writes an empty `NextConfig`. Add into the existing object (all three are current top-level keys — verify against the installed major before writing):

```ts
// next.config.ts — freshness tiers named by how fresh the data must be, called by name
// from cacheLife(), and identical across every house app so a tier means one thing.
const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  cacheLife: {
    realtime: { stale: 0, revalidate: 10, expire: 60 },
    frequent: { stale: 60, revalidate: 300, expire: 3600 },
    daily: { stale: 3600, revalidate: 86_400, expire: 172_800 },
    static: { stale: 86_400, revalidate: 604_800, expire: 2_592_000 },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
```

Internal/admin apps add `X-Robots-Tag: noindex, nofollow`; a public app also needs a CSP (policy → `frontend-security`). Leave `postcss.config.mjs` alone — the starter's `@tailwindcss/postcss` single-plugin config is already correct for v4.

### `globals.css` → the house layers (a split, not a rewrite)

The Next starter's Tailwind v4 entry is roughly this — **read the real file, it drifts**:

```css
/* app/globals.css — as shipped */
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}
```

Split it, moving each part to its layer and keeping the starter's font wiring:

| Starter fragment                      | Destination                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@import "tailwindcss"`               | stays first in the entry                                                                     |
| `:root` hex vars                      | `tokens.css`, rewritten as OKLCH semantic roles (add `--primary`, `--border`, `--radius`, …) |
| `@theme inline { … }`                 | `theme.css` — **keep the `--font-*` mappings**, they point at the starter's `next/font` vars |
| `@media (prefers-color-scheme: dark)` | **replaced** by a `.dark { … }` block in `tokens.css` overriding the same names              |
| `body` / element rules                | `base.css`, inside `@layer base`                                                             |

The resulting entry (`code-structure` puts it at `src/styles/globals.css`):

```css
@import "tailwindcss";

@import "./tokens.css"; /* 1. raw CSS vars + .dark overrides */
@import "./theme.css"; /* 2. @theme inline — vars → Tailwind keys */
@import "./base.css"; /* 3. element defaults */
@import "./utilities.css"; /* 4. @utility */
@import "./components.css"; /* 5. repeated class patterns */
@import "./animations.css"; /* 6. keyframes */

@custom-variant dark (&:where(.dark, .dark *)); /* manual toggle; document the selector in AGENTS.md */
```

In a monorepo the app entry imports the shared `@org/tailwind-config` bundle instead of local layers, stays **unprefixed**, and adds `@source "../../packages/ui/src";` — without that the app build emits zero utilities for package components.

### `src/app/layout.tsx` — repoint the CSS import, set real metadata

Change the starter's `import "./globals.css"` to `import "@/styles/globals.css"`, keep its `next/font` setup and the `className` it puts on `<html>`/`<body>`, and replace the placeholder `metadata`:

```tsx
export const metadata: Metadata = { title: "<App name>", description: "<One line>" };
```

Richer metadata (templates, OG, canonicals) → `seo`, when that extra was selected.

### `src/app/page.tsx` — make it a thin entry

The starter's demo markup is replaced wholesale; the file itself is an EDIT, not a DELETE:

```tsx
// entry files import a composed …PageContent and nothing else
import { HomePageContent } from "@/components/marketing/home";

export default function HomePage() {
  return <HomePageContent />;
}
```

### `.gitignore` — append the gaps

The starter covers `node_modules`, `.next`, and `*.tsbuildinfo`. Append only what is missing:

```gitignore
# env — .env.example is the only committed env file
.env
.env.*
!.env.example

# caches / build output
.turbo/
storybook-static/
coverage/
playwright-report/
test-results/
```

### Files `storybook init` owns

Reshape rather than rewrite: point `stories` at `../src/components/**/*.stories.@(ts|tsx)` (stories colocate with their component), trim `addons` to `@storybook/addon-a11y` + `@storybook/addon-vitest` + `@storybook/addon-docs` (controls/actions/interactions are core — installing `addon-essentials`/`addon-actions` breaks on Storybook 10), import the app's CSS entry in `preview`, and add the tier `storySort`. Details → `storybook-setup`.

## Part 3 — DELETE (demo cruft, per starter, only as approved lines)

| Starter           | Paths                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-next-app` | `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`, `README.md`, the generated `AGENTS.md` + `CLAUDE.md`, `app/favicon.ico` when the project has its own |
| `storybook init`  | its sample `src/stories/` folder (Button/Header/Page + their CSS and MDX) — the house colocates stories instead                                                                                          |

Confirm each path exists before listing it — the templates change between majors, and a DELETE line for a file that is gone is noise in the manifest.

### `package.json`

```jsonc
{
  "name": "@org/<package>",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "check-types": "tsc --noEmit",
  },
}
```

Built with **tsup**, not bare `tsc`: `tsc` does not append `.js` to relative ESM imports, so a `tsc`-emitted `dist/` breaks under Node's ESM resolution. In a workspace the version stays `0.0.0`, `private: true`, and the tsconfig extends the shared config package.

### `src/index.ts` + layout

```ts
// The public surface — everything consumers may import. Anything not re-exported is internal.
export * from "./<kind>";
```

`src/<kind>/` folders are kind-first with a barrel each (`code-structure`); no `app/`, no `styles/`. A package that ships components instead follows the four `ui/` tiers and the `ui:`-prefixed CSS compilation from `tailwind-css`.
