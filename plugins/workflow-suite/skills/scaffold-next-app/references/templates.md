# Adapter templates

The file contents `scaffold-next-app` writes, **ordered by the step that writes them** — so a step tells you which blocks to fetch, and a block with no step is visibly orphaned.

| Step                        | What it covers                                                       |
| --------------------------- | -------------------------------------------------------------------- |
| [Step 4](#step-4)           | The files the starter already owns — edited in place, never replaced |
| [Step 5](#step-5)           | The client-side `lib/` kinds                                         |
| [Step 6](#step-6)           | The `lib/server` boundary, when the answers asked for one            |
| [Step 7](#step-7)           | The design-system proof — style layers, one component, its story     |
| [Step 8](#step-8)           | What gets deleted, per starter                                       |
| [Step 9](#step-9)           | Standalone-only extras — CI, hooks, commitlint                       |
| [Package variant](#package) | What changes when the target is a shared package, not an app         |

Every block is real, runnable code with `// …` elisions where trimmed. Each names its owning skill; when a block and its owning skill disagree, **the skill wins and this file is the bug**. No version appears in any dependency here on purpose — the starter chose the versions, and only a genuinely new dependency gets one, resolved from the registry at scaffold time.

Two rules cut across every step: **a file the starter provided is edited, never overwritten**, and **nothing conditional is written unless an interview answer earned it**.

<a id="step-4"></a>

## Step 4 — Edit the files the starter owns

These exist already and hold decisions worth keeping. Every block below is an addition or a targeted change.

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

<a id="step-5"></a>

## Step 5 — Create the client-side `lib/` kinds

Seven kinds, each flat, each with a barrel of explicit exports.

### `.env.example` (`devops` — secrets only, named with no values)

**`.env` holds secrets and nothing else.** A credential, a signing key, a token issued by a third party — anything that must not be committed. Everything else is a constant, even when it changes per tier: base URLs, cookie domains, CORS origins, analytics ids, feature toggles, public keys. Those go in `config/site.ts`, keyed off `APP_ENV`, where they are reviewable in one diff instead of retyped into three dashboards.

`APP_ENV` is the one exception, because it is the key the constants are selected by, and it has to arrive from the environment to be known at all.

```dotenv
 # The tier this deployment is running as — the key config/site.ts reads.
 # local | development | staging | production. `local` is your machine on localhost;
 # `development` is the deployed dev environment, which has its own URL and cookies.
 # Always APP_ENV, never NODE_ENV: the framework owns NODE_ENV and a staging
 # build is a production build, so the two answer different questions.
APP_ENV=development

 # Secrets — no values here, ever. One line per secret the app cannot boot without.
SESSION_SECRET=
```

### `src/lib/config/env.ts` (`devops` — validate at boot; leaf module, imports only zod)

```ts
import { z } from "zod";

// Leaf module on purpose: app code imports `env`, never process.env, so a missing
// var fails the boot instead of surfacing as undefined deep inside a request.
const EnvSchema = z.object({
  APP_ENV: z.enum(["local", "development", "staging", "production"]),
  SESSION_SECRET: z.string().min(32),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
```

### `src/lib/config/routes.ts` + a kind barrel (`code-structure`, `naming`)

**Group by surface, never one flat object.** A single `ROUTES` with fifty keys is impossible to scan, merges badly, and gives no clue where a new path belongs. One nested group per route group, mirroring the app tree, so a path's home is obvious before you look:

```ts
// src/lib/config/routes.ts — no hardcoded path strings anywhere else
export const ROUTES = {
  marketing: {
    home: "/",
    pricing: "/pricing",
  },
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
  },
  dashboard: {
    overview: "/dashboard/overview",
    settings: "/dashboard/settings",
  },
  // one group per route group; a group gets a nested object, never a prefixed key
} as const;
```

A function takes a parameter, and lives beside the group it belongs to — never a template string assembled at the call site:

```ts
  dashboard: {
    overview: "/dashboard/overview",
    project: (id: string) => `/dashboard/projects/${id}`,
  },
```

`endpoints.ts` is grouped the same way, but **by the backend's own shape — resource or service, not by which page calls it.** The API's structure is the thing that changes, so the config mirrors the API and not the UI:

```ts
// src/lib/config/endpoints.ts — every API path; no literal URL in a service or component

// The version lives here once. A v2 migration edits this line, not every endpoint —
// and because each path is built from it, none of them can be missed.
const API_BASE = "/api/v1";

export const API_ENDPOINTS = {
  users: {
    list: `${API_BASE}/users`,
    detail: (id: string) => `${API_BASE}/users/${id}`,
  },
  billing: {
    subscription: `${API_BASE}/billing/subscription`,
    invoices: `${API_BASE}/billing/invoices`,
  },
} as const;
```

When two versions run side by side during a migration, the base becomes a small map rather than a second copy of the file — the endpoints still read the same:

```ts
const API_BASE = { v1: "/api/v1", v2: "/api/v2" } as const;

export const API_ENDPOINTS = {
  users: {
    list: `${API_BASE.v2}/users`, // migrated
  },
  billing: {
    invoices: `${API_BASE.v1}/billing/invoices`, // still v1
  },
} as const;
```

Two rules that keep either file honest as it grows:

- **A group earns its own file once it outgrows the shared one.** `routes.ts` splitting into `routes/dashboard.route.ts` is the same kind-first move as any other folder (`code-structure`); the barrel re-exports one `ROUTES`.
- **Never build a path by concatenation at the call site.** `` `${ROUTES.dashboard.overview}/${id}` `` defeats the point — add the function to the group instead, so every caller gets the same shape.
- **No exported union of every path.** Flattening a nested tree into one string type needs a recursive helper that breaks the moment a group holds a function, and `typedRoutes` already type-checks `href` against the real file system. Type a prop as `string` and pass `ROUTES.x.y`.

`site.ts` holds the canonical name, OG defaults, and **every value that differs by tier** — derived from `APP_ENV` rather than added to `.env`:

```ts
// src/lib/config/site.ts — one place per-tier values are resolved
import { env } from "./env";

// Keyed off APP_ENV so a new deployment needs no new env vars, and so the values
// for every tier are reviewable in one diff instead of scattered across dashboards.
// Four tiers, and `local` is not a synonym for `development`: local is your machine,
// development is the deployed dev environment with a real URL and real cookies.
const PER_TIER = {
  local: { url: "http://localhost:3000", cookieDomain: "localhost", analyticsId: null },
  development: { url: "https://dev.example.com", cookieDomain: ".dev.example.com", analyticsId: null },
  staging: { url: "https://staging.example.com", cookieDomain: ".staging.example.com", analyticsId: null },
  production: { url: "https://example.com", cookieDomain: ".example.com", analyticsId: "TODO" },
} as const;

export const SITE = {
  name: "TODO: product name",
  description: "TODO: one sentence, used as the OG and meta default",
  ...PER_TIER[env.APP_ENV],
} as const;
```

**Only secrets earn a place in `.env`.** Everything above is a constant that happens to vary by tier — committing it is the point, because that is what makes it reviewable. A public analytics id is not a secret; a signing key is (`devops`).

```ts
// src/lib/config/index.ts — one barrel per kind, one explicit line per file
export { API_ENDPOINTS } from "./endpoints";
export { env, type Env } from "./env";
export { ROUTES } from "./routes";
export { SITE } from "./site";
```

**One explicit export line per file, never `export *` from a directory** — the barrel is the kind's public surface, and a wildcard hides what joined it. Every kind gets this treatment; `src/lib/server/index.ts` gets its own and is **never** merged with these.

The one exception is a barrel that composes other barrels — `ui/index.ts` over the four tiers, `lib/server/index.ts` over its kinds. Each thing it re-exports is already an explicit list, so nothing is hidden; `export *` over a _directory of files_ is what the rule forbids.

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

<a id="step-6"></a>

## Step 6 — The `lib/server` boundary

Only when the answers asked for a backend layer. It sits behind its **own** `server-only` barrel, never shared with client-safe code (`backend`, `code-structure`).

### The barrel and the vertical slice

```ts
// src/lib/server/index.ts — the server-only barrel; never merged with a client-safe one
import "server-only";

// Same as ui/index.ts: each kind barrel below is an explicit list, so this re-export
// is a composition of curated surfaces rather than a wildcard over files.
export * from "./actions";
export * from "./cache";
export * from "./services";
```

`clients/`, `data/`, and `utils/` stay **out** of the top barrel — they are called by the layers above them, not by app code. Exporting them invites a page to query the store directly.

One vertical slice, in `backend`'s build order **schema → service → route (or action)**, bodies as `// TODO:`. `data/` is not a step in that order — it is what the service calls:

```ts
// src/lib/schemas/user.schema.ts — the validated shape, written first (its own kind)
import { z } from "zod";

// A write schema is an allowlist: .pick() the fields a caller may send, so a new
// column is never mass-assignable by default.
export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  bio: z.string().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
```

```ts
// src/lib/server/data/user.data.ts — store access only; no business rules
import { COLLECTIONS } from "./collections.data";
import { firestore } from "@/lib/server/clients/firebase";

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

<a id="step-7"></a>

## Step 7 — Design-system proof

The smallest end-to-end proof that tokens, tiers, aliases, barrels, and stories are all wired.

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
export { Button, type ButtonProps } from "./Button";
```

```ts
// src/components/ui/base/index.ts — the tier barrel, one line per component folder
export { Badge, type BadgeProps } from "./Badge";
export { Button, type ButtonProps } from "./Button";
```

```ts
// src/components/ui/index.ts — re-exports every tier; all four exist from day one.
// Each tier barrel is already an explicit list, so re-exporting it is not a wildcard
// over a directory — it is the one place the rule reads as `export *` and means it.
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

<a id="step-8"></a>

## Step 8 — Delete the demo cruft

| Starter           | Paths                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-next-app` | `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`, `README.md`, the generated `AGENTS.md` + `CLAUDE.md`, `app/favicon.ico` when the project has its own |
| `storybook init`  | its sample `src/stories/` folder (Button/Header/Page + their CSS and MDX) — the house colocates stories instead                                                                                          |

Confirm each path exists before listing it — the templates change between majors, and a DELETE line for a file that is gone is noise in the manifest.

<a id="step-9"></a>

## Step 9 — Standalone-only extras

In a monorepo these live once at the root and belong to `scaffold-monorepo`.

### CI, hooks, commitlint (`devops`)

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

```ts
// commitlint.config.ts
export default { extends: ["@commitlint/config-conventional"] };
```

<a id="package"></a>

## The library-package variant (not an app)

When the target is a shared package rather than an app, the two files below replace their app equivalents in Step 4. Everything else still applies — kinds, barrels, folder-per-component — except there is no `app/`, no route groups, and no `styles/` entry.

### `package.json` (a package, not an app)

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
