---
name: tailwind-css
description: Use when setting up Tailwind, organizing CSS into files, defining design tokens/theming, or styling components. Tailwind CSS v4 (CSS-first). Enforces the house setup — CSS split by concern and imported in order, a two-layer token system (raw vars + @theme inline), token-driven dark mode, the ui-prefix scope, cn() merging, semantic tokens over literals, and custom utilities/component classes over repeated class strings.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Tailwind design system (v4)

Tailwind CSS **v4, CSS-first** — config lives in CSS via `@theme`, not a JS file (**no `tailwind.config.js`, no `content` array, no purge config**; v4 auto-detects sources).

## Setup & wiring

- **Vite:** the `@tailwindcss/vite` plugin. **Webpack / Next.js:** `@tailwindcss/postcss` as the only PostCSS plugin. v4 needs no `postcss-import` or `autoprefixer`.
- One CSS entry per compilation, starting with `@import "tailwindcss"`.
- **v4 source detection skips `node_modules` and gitignored files.** A compilation that must style files outside its own source tree declares them with `@source` — in a monorepo the app's CSS entry adds `@source "../../packages/ui/src";` (or the UI package's exported CSS carries its own `@source`). Without it the app build generates **zero** utilities for package components.

## CSS file organization — split by concern

Never dump styles into one file. Split into small files, each one concern, imported **in order** by a single entry (`globals.css`):

```css
/* globals.css — the app entry (always unprefixed) */
@import "tailwindcss";
@import "tw-animate-css";      /* plugins, if any */

@import "./tokens.css";        /* 1. raw CSS variables (+ .dark overrides) */
@import "./theme.css";         /* 2. @theme inline — map vars → Tailwind keys */
@import "./base.css";          /* 3. @layer base — element defaults */
@import "./utilities.css";     /* 4. @utility — custom utilities */
@import "./animations.css";    /* 5. keyframes + the classes using them */
@import "./components.css";    /* 6. @layer components — shared class patterns */

@custom-variant dark (&:where(.dark, .dark *)); /* opt-in manual toggle; selector is project-specific */
```

- **`tokens.css`** — raw design tokens as CSS custom properties on `:root` (OKLCH): semantic (`--background`, `--primary`, `--card`, `--border`, `--radius`) plus any decorative palette. A `.dark { … }` (or `[data-theme="dark"]`) block overrides the **same token names**.
- **`theme.css`** — `@theme inline { … }` maps the raw vars to Tailwind keys (`--color-primary: var(--primary)`, `--radius-*`, `--font-*`). See "two-layer tokens".
- **`base.css`** — `@layer base { … }` element defaults (body bg/color/font, focus & scroll behavior, `prefers-reduced-motion`).
- **`utilities.css`** — `@utility <name> { … }` custom low-level utilities (e.g. `no-scrollbar`).
- **`animations.css`** — `@keyframes` plus the classes that use them. **Before `components.css`**, so a component class can override an animation class and reference a keyframe; nothing here needs a component class.
- **`components.css`** — `@layer components { … }` + `@apply` for **repeated class patterns only** (section rhythm, marketing typography like `.section`, `.section-eyebrow`, `.section-heading`). Real UI = primitives in `components/ui`, **not** classes here.
- **Feature/domain CSS** as needed — `typography.css`, `dialog.css`, `shop.css`, `cookie-consent.css`.
- **A skeleton for each file** — what belongs in it, what does not, and which file a new rule goes in → [references/layer-files.md](references/layer-files.md).
- **Monorepo:** these files live once in a shared **`packages/tailwind-config`** (`base/themes/utilities/sections/heroes/shared-styles.css`). Apps import the **bundled** entry; the prefixed `packages/ui` build imports layers individually (see the `ui:` prefix section). New utilities go in the shared `utilities.css` only when reusable across apps — otherwise in the app's local `components.css`. Single app: everything lives in the app's `src/styles/`.

## Two-layer tokens (the important bit)

Tokens are defined **twice, on purpose**:

1. **Raw vars** in `tokens.css`: `--primary: oklch(0.58 0.18 265);` — with a `.dark` block overriding the same names.
2. **`@theme inline`** in `theme.css`: `--color-primary: var(--primary);`.

The **`inline`** keyword is what makes it work: generated utilities (`bg-primary`, `text-foreground`) keep pointing at the **live** CSS vars, so `.dark` overrides — and any scoped per-section/per-feature override of `--primary` — flow through automatically. Map the raw var; **never bake a literal into `@theme`**.

- Variants: plain `@theme` has generated utilities reference the theme variable itself (runtime overrides of the _underlying_ var don't flow through); **`@theme inline`** embeds the value (here `var(--primary)`) directly — what makes token-driven theming work; **`@theme static`** emits every theme variable into the CSS even when unused (useful when JS reads tokens).
- **OKLCH** for all colors.
- Keep **semantic** roles (`--primary`; `--accent` = muted hover surface) separate from a **decorative** palette (`--tint-1…5`) so roles never collide; consume decoratives with opacity modifiers (`bg-tint-1/10`, `border-tint-1/20`).

## Dark mode

v4's default is `prefers-color-scheme` (auto/OS). We opt into a **manual toggle** via `@custom-variant dark (…)`, driven by a theme hook. The **selector is a project fact** — a `.dark` class or a `[data-theme="dark"]` attribute (document which in `AGENTS.md`). It's **token-driven**: `.dark` overrides the raw tokens in `tokens.css`; components never hardcode light/dark pairs.

## Writing styles

- **Tokens, not literals** — style from semantic tokens (`bg-primary`, `text-foreground`); never hex/rgb or arbitrary values (`bg-[#1a1a1a]`) except a genuine one-off.
- **`@utility`** for a low-level reusable; **`@layer components` + `@apply`** for a repeated multi-utility pattern. But prefer a real **`components/ui` primitive** over a CSS class whenever it's a component (not just typography rhythm).
- **`@apply` in a separate compilation unit** (a CSS module, a framework `<style>` block) needs `@reference "../globals.css";` first, or the theme isn't visible there.
- **Merge with `cn()`** (clsx + tailwind-merge) so a caller's `className` wins. (See `reusables`.)
- **Mobile-first** — base styles, then responsive prefixes upward. Custom breakpoint scales reset the defaults first (`--breakpoint-*: initial`) so stale defaults can't leak; prefer **one** mobile→desktop break per component (start responsive work at `md:`).
- **Container queries** — v4 ships `@container` / `@min-*` / `@max-*`; prefer them over viewport breakpoints for reusable components, which can't know how wide their slot is.
- **Comment the non-obvious** — explain _why_ a token/utility exists (a role distinction, a workaround), not what the class plainly does.

## Monorepo `ui:` prefix

The apps and `packages/ui` are **separate Tailwind compilations**; the prefix isolates the package's CSS from each app's. Corollary: a `ui:` class used outside the package **fails silently** — no error, the styles just drop — so `ui:` never appears in app code or stories. A single app has no prefix.

The prefix is enabled in the **package's own CSS entry**; app entries stay bare:

```css
/* packages/ui/src/styles/globals.css — the prefixed compilation */
@import "tailwindcss" prefix(ui);
@import "@acme/tailwind-config/theme.css";     /* individual layers, NOT the bundle */
@import "@acme/tailwind-config/base.css";
@import "@acme/tailwind-config/utilities.css";
@import "./components.css";

@custom-variant dark (&:where(.dark, .dark *)); /* must be re-declared here */
```

- **Prefix first, always:** `ui:sm:flex`, never `sm:ui:flex`.
- The prefix renames only Tailwind-**generated** utilities (`ui:flex`); hand-authored class names stay unprefixed (`btn-primary`) — see `naming`.
- **Bundled vs individual layers:** apps import the bundled baseline; the prefixed build can't load preset layers full of unprefixed `@apply`, so the package entry imports the layers it needs individually.
- **Dark variant:** a package entry that skips the bundled CSS must re-declare `@custom-variant dark`, or `ui:dark:*` silently compiles to media-query dark instead of the class toggle.
- **twMerge:** inside the prefixed package, `cn()` must be built with `extendTailwindMerge({ prefix: "ui" })` — plain `twMerge` doesn't recognize `ui:` classes, so conflict resolution silently fails.
- **Component-utility classes** are _defined_ with `@apply ui:*` in the package's `components.css`, but _consumed_ unprefixed in JSX (`className="btn-primary"`).
- **Responsive `ui:` classes are unreliable for show/hide** across the prefixed compilation — use a `matchMedia`-based `useBreakpoint` hook for display toggling instead of `ui:md:hidden`.
- Some tokens (e.g. an error color) may not get an `@apply`-able utility in a prefixed setup — fall back to raw CSS `var(--color-error)`.

## v3 → v4 (only when migrating an old project)

| v3                                    | v4                                           |
| ------------------------------------- | -------------------------------------------- |
| `tailwind.config.js` `theme.extend`   | `@theme` / `@theme inline` (map vars) in CSS |
| `@tailwind base/components/utilities` | `@import "tailwindcss"`                      |
| `darkMode: "class"`                   | `@custom-variant dark (…)`                   |
| `content: [...]` purge                | automatic — no config                        |

> **Audit:** review this domain on demand with the manually-invoked `conventions-audit` / `frontend-audit` command (see `audit-all` for the whole suite).
