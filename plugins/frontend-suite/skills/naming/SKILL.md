---
name: naming
description: Use whenever naming or renaming anything — code (functions, hooks, components, variables, booleans, types, Zod schemas, constants, files), CSS classes, design tokens, assets (icons/illustrations/logos), and design files. Enforces descriptive, verb-first, ownership-revealing names with the house casing, the `<domain>.<kind>.ts` file suffixes, and structured patterns. Apply when writing new code, creating assets/tokens, reviewing names, or refactoring.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Naming

Every name says **what the thing does and what it belongs to** — never vague, never cryptic. A reader (or reviewer) should know a symbol's job from its name alone.

**Principles:** every name is **predictable · consistent · scalable · scannable · unambiguous.**

## Golden rules

- **Descriptive over terse.** Full words: `createGeminiClient`, not `getGemini`; `currentUser`, not `usr`. No ambiguous `data` / `item` / `temp` / `val` / `handle`; no cryptic abbreviations (`btn`, `qty`) — except the well-worn `i` in a tight loop.
- **File name = export name = usage.** One canonical name per symbol, everywhere — never rename on import (`import X as Y`).
- **Ownership.** A symbol used by a single feature carries that feature's prefix; only genuinely shared symbols keep a bare generic name (shared `HistoryEntry`; feature-local `SeoMetaHistoryEntry`).
- **Casing.** `camelCase` for variables, functions, props, and hooks; `PascalCase` for components and types; `UPPER_SNAKE_CASE` for constants; `kebab-case` for files, folders, and CSS classes — **except React component and story files, which are PascalCase** (see Files).

## Functions — verb first

Lead with the verb that names the action, then the subject:

| Prefix                                  | Meaning                         | Example                      |
| --------------------------------------- | ------------------------------- | ---------------------------- |
| `get`                                   | sync / local read or derive     | `getUserId`, `getFullName`   |
| `fetch`                                 | async / remote (network) read   | `fetchCurrentUser`           |
| `create` / `update` / `delete` / `save` | mutations                       | `createEvent`, `deleteAlbum` |
| `build` / `make`                        | construct an object/config      | `buildMetadata`              |
| `format` / `<x>To<y>`                   | transform; state input → output | `formatIsoToString`          |
| `parse`                                 | string → structured             | `parseFrontmatter`           |
| `handle`                                | internal event handler          | `handleSubmit`               |
| `on`                                    | event **callback prop**         | `onOpenChange`               |

`get` vs `fetch`: `get` is synchronous/local; `fetch` crosses the network. Never call a network read `getUser`.

## Hooks — `use` + subject/behavior

`useCurrentUser`, `useClickOutside`, `useMountTransition`. The name states what it gives you or does.

## Booleans — read as assertions

Prefix with `is` / `has` / `are` / `can` / `should` / `will`: `isOpen`, `hasAccess`, `canEdit`, `shouldRender`. Applies to variables, props, and boolean-returning functions (`isValidEmail`).

## Components — PascalCase noun phrase

Name for what it renders: `SearchInput`, `UserCard`, `EmptyState`. Feature-local components are feature/tool-prefixed to avoid bare duplicates across features (`SeoMetaHero`, not a second `Hero`). A component's props type is `<Component>Props` (`SearchInputProps`).

## Types, schemas, constants

- **Component props** → `Props` suffix (`ButtonProps`).
- **Zod schema (the value)** → `Schema` suffix (`UserSchema`); the inferred type takes the clean name (`type User = z.infer<typeof UserSchema>`). Its file is `<domain>.schema.ts`, and the schema and its inferred type live together.
- **Inferred / domain / union types** → clean PascalCase noun, **no `Type` suffix** (`User`, `EventStatus`).
- **Constants** → `UPPER_SNAKE_CASE` (`EVENT_STATUSES`); an `as const` union's type stays a clean noun (`EventStatus`).
- **Generic type params** → descriptive `T`-prefixed names (`TItem`, `TResponse`) whenever a signature has more than one; a lone `T` is fine.

## Files & folders

- **React component and story files** — `PascalCase`, matching the primary export: `SearchInput.tsx`, `SearchInput.stories.tsx`, `Hero.tsx`.
- **Everything else** — `kebab-case`, matching the primary export's concept. Framework-mandated names (`page.tsx`, `layout.tsx`) are their own convention.
- **A `lib/` file carries its kind as a suffix — `<domain>.<kind>.ts`, singular.** The folder says which kind, and the filename repeats it so an import line stands alone: `auth.constant.ts`, `nav.type.ts`, `plan.data.ts`, `string.utils.ts`, and on the server `user.action.ts`, `user.cache.ts`, `user.data.ts`, `user.service.ts`, `redis.client.ts`. Two exceptions: **`config/` uses bare names** (`env.ts`, `routes.ts`, `site.ts` — one per app, so a suffix adds nothing), and a **single-function util may keep a bare name** (`cn.ts`).
- **Hooks are the one kind whose grammar is a prefix, not a suffix** — `use-<subject>.ts` (`use-click-outside.ts`, `use-media-query.ts`), because `use` is what makes it a hook.
- **The domain is a filename prefix, never a subfolder.** `utils/seo.utils.ts`, not `utils/seo/index.ts`. A kind stays flat.
- **Folders** — `kebab-case` (`components/marketing/landing/`), except a component's own folder, which is `PascalCase` matching the component (`ui/base/Button/`).
- **Test files** — `<name>.test.ts(x)` beside the unit they test (`string.utils.test.ts`, `Button.test.tsx` inside `Button/`).
- Code files are named for their **primary export**; the `[type]-[name]-[variant].[ext]` pattern applies to assets and design tokens (`icon-arrow-left.svg`), not code files.

## Routes, env, and infrastructure

- **Route constants** — page paths come from `config/routes.ts`, API paths from `config/endpoints.ts`; never hardcode a path/URL string in a component or service.
- **Route segments** — `kebab-case` (`/forgot-password`); dynamic params `camelCase` (`[userId]`).
- **Env vars** — `UPPER_SNAKE_CASE`; the `NEXT_PUBLIC_` prefix only for values safe to expose in the browser bundle.
- **Cache tags** — from a central `CACHE_TAGS` const, `entity:id` grammar (`user:123`).
- **Branch names** — `type/short-kebab-description` (`feat/`, `fix/`, `chore/`, `docs/`).

## CSS classes

`kebab-case` (`page-hero`, `section-eyebrow`, `btn-primary`). Hand-authored class names are **never prefixed**: in a monorepo `packages/ui`, Tailwind v4's `prefix(ui)` namespaces only Tailwind-**generated** utilities (`ui:flex`) — an authored component class stays `btn-primary`, written unprefixed and consumed unprefixed in JSX (mechanics in `tailwind-css`).

## Design tokens

Structured, hierarchical — `{category}-{property}-{concept}-{variant}-{state}`, dropping parts that don't apply: `color-bg-primary`, `color-text-foundation-muted`, `color-border-primary-hover`, `space-inline-sm`. Defined via `@theme` (see `tailwind-css`).

## Assets

`kebab-case` with a typed prefix so they group and scan:

- **UI icons** — `icon-[name]-[size]` (`icon-search-24`). The `[name]` is always present, which is what keeps these clear of the brand `icon.svg` / `icon-dark.svg` below: a bare `icon` or `icon-<variant>` is the brand symbol, `icon-<name>-<size>` is an interface glyph.
- **Illustrations** — `illust-[scene]-[variant]` (`illust-empty-cart-dark`)
- **Brand logo** — `logo[-variant]` is the symbol plus the name; `icon[-variant]` is the symbol on its own: `logo.svg`, `logo-dark.svg`, `logo-cream.svg`, `icon.svg`, `icon-light.svg`. The bare name is the default; **the suffix is the colour of the artwork, never the background it sits on** — pick one reading and hold it everywhere, because mixing the two inverts half the usages. Named brand colours are legitimate variants (`logo-cream`), which is exactly why the artwork's own colour wins here.
- **Other** — `[type]-[name]-[variant].[ext]`

Ship logos and symbols as **SVG**; add a PNG only where a raster is genuinely required (email, social cards, an OS icon), with the same stem. Favicon and app-icon files are not brand assets — in Next they are metadata files in `app/` (`favicon.ico`, `icon.svg`, `apple-icon.png`) whose `<link>` tags are injected automatically, so they keep the framework's required names rather than these.

## Design files (Figma / design tool)

Pages are **numbered + descriptive** (`01-foundations`, `02-components`, `03-patterns`); components use **PascalCase** matching their code counterpart (`SearchInput`) so design ↔ code stay 1:1. Layers are addressed as `[category]/[name]/[variant]/[state]` (`blocks/Card/elevated/hover`) — in code, `variant`/`state` are props and story states, not folders.

> **Audit:** review this domain on demand with the manually-invoked `conventions-audit` command (see `audit-all` for the whole suite).
