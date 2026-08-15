---
name: code-structure
description: Use when creating, editing, or refactoring pages/screens, route entries, components, or lib/ modules — in any framework (Next.js, React, Astro). Enforces the required structure; thin route AND layout entries, components/ mirroring the route groups, feature-grouped section-based pages composed by an index, one folder per component in the four ui/ tiers, small isolated files (one per section/modal/hook), components/ holding only .tsx, and a kind-first lib/ that stays flat inside each kind with `<domain>.<kind>.ts` filenames. Apply whenever you add or restructure a page, build a screen, split UI, or organize lib/.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Code structure — pages, components, and lib

Every page/screen is built this way, in every framework. **Never write a page as one large inline file.** Only the route/entry file differs per framework; the structure below is identical everywhere.

## Rules

1. **Thin route/entry.** The framework's entry file only imports a composed `…PageContent` and renders it — no markup, data, or logic inline. That file is `app/**/page.tsx` (Next.js), `src/pages/*.astro` (Astro), or a route element (React Router) — see Entry files below. **A layout file is an entry too**: `layout.tsx` renders a shell from `ui/layouts/` and nothing else. The one thing that stays in the route file is a **guard** — a layout that throws escapes its own `error.tsx`, so the check belongs where the boundary is visible.
2. **Feature-grouped UI.** A page's components live under `components/<feature>/<page>/` (e.g. `components/marketing/landing/`, `components/owner/dashboard/`).
3. **One file per section.** Split the page into section components — PascalCase, **named export**, one concern each (`Header.tsx`, `Hero.tsx`, `HowItWorks.tsx`, `Footer.tsx`). Named (not default) so the file name, export name, and every import match — never renamed on import.
4. **`index.tsx` composes.** It imports the sections and stacks them into a named-exported `…PageContent` that owns the page's layout wrapper.
5. **Reusable primitives** (Button, Card, …) live in `components/ui/`. Section-local data/constants live with the section, not in the entry file.
6. **Sections are self-contained.** A section owns its own wrapper/`Card`/markup. `index.tsx` and the entry file only import and stack — they never wrap a section in a primitive or add inline JSX beyond the layout container.
7. **Extract repeated UI** (wordmark, nav, a title+description heading) into reusable components; anything every page in a route group shares goes in that group's layout.

## Small, isolated files (≤ ~200 lines)

Never cram many components/logic into one file. When a file grows past ~200 lines or mixes concerns, **split it**: one file per modal/overlay, one file per section, and stateful logic into a `use-*.ts` hook. Shared hooks live in the `hooks` kind (`lib/hooks/<feature>/use-*.ts`, or `packages/hooks` when shared in a monorepo); a hook used by exactly one section may colocate with it; a hook that returns JSX (a provider component) is a component file, not a hook file. The orchestrator only composes the pieces. Don't duplicate — extract. As soon as the same UI or logic is used in two places (or clearly will be), pull it into one reusable piece: shared UI becomes a component with props for whatever differs; shared logic becomes a helper or hook. (See the `reusables` skill for how to build them.)

## The tree

The concrete end-to-end trees live with the commands that produce them — the single-app tree in `scaffold-next-app`, the workspace tree in `scaffold-monorepo`. This skill owns the rules those trees obey; the sections below are the authority when the two disagree.

## Where things live

- `components/ui/` — generic, app-agnostic reusables, **always organized into 4 tiers** (from day one): `base/` = primitive atoms (Button, Input, Badge, Avatar, Checkbox); `blocks/` = composed components built from base (Card, Modal, DataTable, Tabs, Accordion, Toast); `patterns/` = whole page regions (Navbar, Sidebar, Footer, SidePanel); `layouts/` = page-level wrappers/shells. **Decision — an ordered ladder, first match wins:** `base` = renders one thing, no internal sub-components, no children orchestration; `blocks` = has internal structure, may ship as a multi-export pair (`Accordion` + `AccordionItem`), manages its own state; `patterns` = a whole region of the page, often with several variants; `layouts` = slot-based API (navbar/sidebar/footer as slot props).
- **One folder per component inside a tier**, holding the component, its story, its barrel, and a test when there is one: `ui/base/Button/{Button.tsx, Button.stories.tsx, Button.test.tsx, index.ts}`. The tier barrel lists one line per component folder; a root `ui/index.ts` re-exports all four tiers.
- **Every component ships a story. A test only where there is behaviour** — state, keyboard handling, conditional rendering, focus management. A component that renders what it is given has nothing to assert that the story does not already show, and a test asserting "it rendered" is maintenance without cover.
- **A compound component's parts are separate named exports**, never static properties (`Accordion.Item`) — a static property defeats tree-shaking through the tier barrels.
- **A layout takes its regions as slot props.** `DashboardLayout` never imports `Sidebar`; the route's `layout.tsx` passes it in, with this app's nav items from `constants/`. That is what lets one shell serve every app.
- `components/_shared/` — cross-feature widgets (e.g. `otp/`).
- `components/<feature>/_shared/` — shared within one feature.
- `components/<feature>/<page>/` — a page's sections + `index.tsx`.
- **`components/` mirrors the route tree, group for group.** One folder per route group (`marketing/`, `dashboard/`, `admin/`, `legal/`, `auth/`), one folder per page inside it, each pairing with the segment it serves — so a wrong pairing is visible on sight. A group with a single page keeps its sections flat in the group folder; framework boundaries (`error`, `not-found`, `unauthorized`) group by kind in `components/errors/` rather than by the route that hosts them.
- **`components/` holds only component `.tsx`.** The allowed exceptions: colocated `*.stories.tsx` and `*.test.tsx` files, CSS modules where a project uses them, a stub `data.ts` beside the component it feeds (placeholder records until the real source is wired — it sits next to the UI so deleting it is obviously part of wiring that source), and the barrels. Real static content is not a stub: it belongs in `lib/data/`. A `const` whose values are React components is UI — it lives in a `.tsx`, not `lib/`.
- **`lib/` is strictly kind-first, and flat inside each kind.** Every top-level folder is a _kind_: `config/ constants/ data/ hooks/ schemas/ types/ utils/` (use the ones the app needs). Exactly one folder per kind — **never a domain/feature folder at the `lib/` root**, and never a mini `hooks/`/`types/` rebuilt inside a feature. No loose files at the `lib/` root.
- **The domain is a filename prefix, not a subfolder.** `constants/auth.constant.ts`, not `constants/auth/index.ts`; `utils/seo.utils.ts`, not `utils/seo/`. One grammar per kind, so a path is predictable before you look:

| Kind         | Grammar                | Holds                                                               |
| ------------ | ---------------------- | ------------------------------------------------------------------- |
| `config/`    | bare names             | one-per-app settings: `env`, `routes`, `endpoints`, `site`          |
| `constants/` | `<domain>.constant.ts` | frozen domain values; the const and its inferred type, together     |
| `data/`      | `<domain>.data.ts`     | static content records — pricing tiers, FAQs, team                  |
| `hooks/`     | `use-<subject>.ts`     | one hook per file, named for what it gives you                      |
| `schemas/`   | `<domain>.schema.ts`   | Zod schemas with their inferred types, in the same file             |
| `types/`     | `<domain>.type.ts`     | shapes with no const or schema behind them                          |
| `utils/`     | `<domain>.utils.ts`    | pure helpers; a single-function file may keep a bare name (`cn.ts`) |

- **`schemas/`, `constants/`, and `types/` each own their inferred type.** A Zod schema keeps `z.infer` beside it in `schemas/`; a const keeps its inferred type beside it in `constants/`; `types/` holds only what neither produces. Re-declaring any of them in `types/` is how the three kinds drift.
- **`schemas/` mirrors the monorepo's `packages/schemas`** — same `<domain>.schema.ts` grammar, same schema-and-type-together rule — so moving an app into a workspace is a folder move, not a rewrite (`typescript-best-practices`).
- **A const's inferred type lives in the constant file** — `AUTH_METHODS` → `AuthMethodType` beside it, never re-declared in `types/`.
- **Every kind has a barrel with one explicit export line per file** (`@/lib/<kind>`) — never `export *` from a directory. The barrel is the kind's public surface, and a wildcard hides what joined it.
- **Never create an empty kind.** A folder holding only a barrel is noise; add the kind when its first file exists.
- **Server-only code lives under one `lib/server/` boundary** — the single sanctioned exception to "kinds only at root", because server/client is a hard runtime boundary. It has **its own barrel** (`@/lib/server`) marked `server-only`, and the same kind-first, flat-inside rule as the rest of `lib/`:

| Kind        | Grammar               | Holds                                                                  |
| ----------- | --------------------- | ---------------------------------------------------------------------- |
| `actions/`  | `<domain>.action.ts`  | Server Actions by domain — never one giant `actions.ts`                |
| `cache/`    | `<domain>.cache.ts`   | the cached readers (`use cache` + `cacheLife` + `cacheTag`)            |
| `clients/`  | `<service>.client.ts` | one configured SDK singleton per external service                      |
| `data/`     | `<domain>.data.ts`    | store access only — plus the collection-path registry and batch writer |
| `services/` | `<domain>.service.ts` | business logic; the only caller of `data/`                             |
| `utils/`    | `<domain>.utils.ts`   | server-only helpers: the guard, response builders, logger, errors      |

- **A client is not a util, a config, or a query.** A configured SDK singleton holds a live connection, so it gets its own kind rather than being filed under the values you read at boot or the queries that use it. A client that outgrows one file becomes a folder (`clients/redis/redis.client.ts`, `redis.keys.ts`, `redis.locks.ts`, …).
- **The top-level `server/` barrel exports `actions`, `cache`, and `services` only.** `clients/`, `data/`, and `utils/` are called by the layers above them, not by app code — exporting them invites a page to query the store directly.
- Mark browser-only entry points `client-only`. **Never share a barrel between server-only and client-safe code** — a client importing a mixed barrel drags server code into the client bundle (or fails the build). Everything _outside_ `server/` is client-safe by default.
- **Server Actions group by concern in separate files** under `server/actions/` — never one giant `actions.ts`; shared action result types live in their own file.
- **Next-specific placement:** `error.tsx` / `not-found.tsx` / `loading.tsx` live beside their segment; private folders (`_components/`) are allowed for route-local pieces that must not become routes.
- **A route group that needs a URL prefix keeps a real segment inside it.** `(auth)/auth/` and `(dashboard)/dashboard/` — the parens buy the shared layout, the inner folder buys the `/auth` and `/dashboard` prefix. A group that is grouping only (`(legal)`, `(marketing)`) has no inner segment, because its pages sit at the root of the URL.
- **`layout.tsx` is a thin entry too** — it renders a shell from `ui/layouts/` and passes this app's regions in as slots. **But a guard stays in the route file, never the layout:** a layout that throws escapes its own `error.tsx`, so the redirect or 403 never renders.
- **`styles/` is one entry plus one file per layer**, never a single growing stylesheet: the entry imports the layers in a fixed order, and a layer that gets long splits by scope rather than absorbing more. Which layers exist, what belongs in each, and the import order → `tailwind-css`.
- **No hardcoded paths.** Page paths come from `config/routes.ts`, API paths from `config/endpoints.ts` — never a literal path/URL string in a component or service (see `naming`).
- **Both are grouped objects, never one flat map.** Fifty keys in a single `const` is unscannable and merge-hostile, and says nothing about where a new path belongs. `routes.ts` groups **by route group**, mirroring the app tree; `endpoints.ts` groups **by the backend's own resource or service** — the API's shape is what changes, so the config follows the API and not the pages that call it. A path taking a parameter is a function inside its group, so no caller concatenates. **The API version is a constant the endpoints are built from**, never repeated on each line — a version bump is then one edit that no endpoint can be missed by, and two versions running side by side is a small map rather than a second copy of the file.
- **Keep the `use client` boundary small** (React Server Components (RSC)/SSR frameworks): add `"use client"` only to the interactive leaf components, not whole trees — a Server Component composes Client Components and passes server data/children to them as props (client code can't import server code). A smaller boundary ships less JS and prevents accidental server-code leaks.
- **Monorepo variant:** shared reusable kinds live as workspace packages instead of a `lib/` folder — `packages/ui`, `packages/hooks`, `packages/schemas`, `packages/utils` (imported as `@app/<kind>`). `packages/ui` uses the same 4 tiers and folder-per-component as `components/ui/` above, and the shared kinds keep the same `<domain>.<kind>.ts` grammar. Each app's own `src/lib/` stays kind-first for app-local code.

## Naming

Follow the **`naming`** skill for the full standard — verb-first functions (`get`/`fetch`/`format`…), boolean assertions (`is`/`has`/`can`), `use*` hooks, component/props/`Schema`/type conventions, the file casing rule (PascalCase for component/story files, kebab-case for everything else), and the feature-ownership prefix (a symbol used by one feature carries that feature's prefix; shared ones keep the bare name).

## Entry files (only this differs per framework)

```tsx
// Next.js — app/(marketing)/about/page.tsx  (this file MUST default-export)
import { AboutPageContent } from "@/components/marketing/about";
export default function AboutPage() {
  return <AboutPageContent />;
}
```

```tsx
// Next.js — app/(marketing)/layout.tsx  (a layout is a thin entry too)
import { NAV_ITEMS } from "@/lib/constants";
import { MarketingLayout } from "@/components/ui";

export default function MarketingRouteLayout({ children }: { children: React.ReactNode }) {
  return <MarketingLayout nav={NAV_ITEMS}>{children}</MarketingLayout>;
}
```

```astro
---
// Astro — src/pages/landing.astro
import { LandingPageContent } from "@/components/marketing/landing";
---
<LandingPageContent />
```

```tsx
// React Router — in your routes table
// { path: "/landing", element: <LandingPageContent /> }
```

## Section + index template

```tsx
// components/marketing/landing/Hero.tsx
export function Hero() {
  return <section>{/* ... */}</section>;
}
```

```tsx
// components/marketing/landing/index.tsx
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Footer } from "./Footer";

export function LandingPageContent() {
  return (
    <div className="page-wrapper">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
```

## Checklist before finishing a page

- [ ] The route/entry file is ~3 lines (import + render); default export only where the framework requires it — and its `layout.tsx` is thin too, renderering a shell from `ui/layouts/`.
- [ ] Every visual section is its own file with a named export.
- [ ] `index.tsx` composes the sections and holds the layout wrapper.
- [ ] Reusable bits are in `components/ui/`, one folder per component, each with a story.
- [ ] `components/` mirrors the route groups and holds only `.tsx` (+ colocated stories/tests and an approved stub).
- [ ] `lib/` is kind-first and flat inside each kind, files named `<domain>.<kind>.ts`, every kind barrel listing one explicit export per file.
- [ ] Nothing in `types/` re-declares a type a constant file already infers.

> **Audit:** review this domain on demand with the manually-invoked `codebase-audit` / `conventions-audit` command (see `audit-all` for the whole suite).
