---
name: storybook-setup
description: Use when adding or configuring Storybook in a project — monorepo or single app. Covers init with the right framework package, the Storybook 9/10 addon landscape (controls/actions/interactions are core; add a11y, vitest, docs), a minimal main.ts, colocated story files tiered by title + a _Template story, preview wiring (storySort, styles, provider decorator, class-toggled dark mode, a11y ladder), and optional visual regression + deploy. Follows the current Storybook standard.
metadata:
  version: 1.1.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Storybook — setup

Stand up Storybook in a project. Two decisions that are often confused, so keep them apart:

- **Where the Storybook _app_ lives** — in a **monorepo** it is its own app (`apps/storybook`) with its own `package.json`, config, and decorators, pointed at the shared UI package; that is Storybook's own recommendation and it keeps the tooling out of every product app. In a **single app** it is just a `.storybook/` folder inside that app.
- **Where a story _file_ lives** — **always beside the component it documents**, in the component's own folder (`ui/base/Button/Button.stories.tsx`). The Storybook app reaches it with a glob; it never needs the file nearby.

Colocating costs nothing visually, because **the sidebar is built from each story's `title` plus `storySort` — never from the file path**. It buys the thing a separate tree cannot: a component and its story rename, move, and delete together, so a story is never orphaned by a refactor.

## 1. Init

Run `npx storybook@latest init` (installs Storybook 10) and pick the **framework package** that matches the app: `@storybook/nextjs-vite` (Next.js) or `@storybook/react-vite` (React + Vite). It scaffolds `.storybook/` (`main.ts` + `preview.ts`) and sample stories — delete the samples.

## 2. Addons (Storybook 9/10)

**Controls, actions, and interactions are core** — no addon needed. Do **not** install `@storybook/addon-essentials`, `addon-controls`, `addon-actions`, or `addon-interactions`: they were folded into core in Storybook 9 and are empty or unpublished in 10 (`addon-actions` throws a migration error). Actions come from the `storybook/actions` module; spies come from `storybook/test` via `fn()`.

Addons still worth installing:

- **`@storybook/addon-a11y`** — non-negotiable; catches contrast/role/label issues right in the story UI.
- **`@storybook/addon-vitest`** — runs stories (including `play` functions) as Vitest component tests; supersedes the old test-runner.
- **`@storybook/addon-docs`** — if autodocs is wanted; set `tags: ["autodocs"]` (globally in `preview` or per-meta).
- **Chromatic** (`@chromatic-com/storybook`) — optional, for visual regression.

## 3. `main.ts` — minimal config

```ts
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/components/**/*.stories.@(ts|tsx)"], // colocated beside each component
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest", "@storybook/addon-docs"],
  staticDirs: ["../public"],
};

export default config;
```

## 4. Story structure — colocated, tiered by title

A story file sits **in its component's folder**, next to the component, its barrel, and its test. The **tier comes from the `title`** (`Base/Button`, `Blocks/Accordion`, `Patterns/Navbar`, `Layouts/DashboardLayout`), which is what groups the sidebar — so the tiers stay visible without a mirrored folder tree to keep in sync.

The glob differs only by where the components are:

```ts
// single app — the app's own components
stories: ["../src/components/**/*.stories.@(ts|tsx)"];

// monorepo — the Storybook app reaching into the shared UI package
stories: ["../../../packages/ui/src/**/*.stories.@(ts|tsx)"];
```

Keep a **`_Template.stories.tsx`** the team duplicates to start a new story — in the Storybook app's own source in a monorepo, or `src/components/` in a single app, since it documents no component. Writing the stories themselves is the `storybook-story-writing` skill.

## 5. `preview` — sort, styles, providers, dark mode, a11y

- **Story sort** — without an explicit order the sidebar alphabetizes and scrambles the tier progression. Pin the group order, alphabetical within:

  ```ts
  options: {
    storySort: {
      method: "alphabetical",
      order: ["Assets", "Icons", "Base", "Blocks", "Patterns", "Layouts"],
    },
  },
  ```

- **Styles** — in a prefixed monorepo **both stylesheets are load-bearing**: the **built UI package CSS** (the prefixed classes — e.g. via a Vite alias to the package's dist CSS; the package must be built first or styles are simply missing) **and** the app-level/unprefixed CSS for the stories' own wrapper JSX. In a single app, load the app's global CSS.
- **Providers** — wrap every story in the app's providers via a **global decorator** (theme, fonts, etc.), or hooks like `useTheme` throw.
- **Dark mode** — when dark mode is class-toggled (a `.dark` class on the root), **disable the built-in `backgrounds` addon** — it conflicts with the class model. Drive dark mode through the app's own theme toggle/decorator instead.
- **a11y enforcement ladder** — start with `a11y: { test: "todo" }` to surface violations in the story UI; flip to `"error"` to fail CI when ready.
- **Layout** — use `parameters: { layout: "fullscreen" }` for pattern/layout-tier stories.

## 6. Optional

- **Visual regression** — Chromatic; **interaction tests** — `play` functions, run by `@storybook/addon-vitest`.
- **Deploy** — `storybook build` → host the static output (Chromatic / Vercel / etc.).

## Format

**Default to CSF3 + TypeScript** (`satisfies Meta<typeof X>`, `type Story = StoryObj<typeof meta>`) — the house default today, even though `init` installs Storybook 10. **CSF Next** (factories, formerly "CSF4") is stable in Storybook 10 and becomes the default in 11 — adopt it per-project when the whole project migrates; don't mix formats in one repo.

## Troubleshooting

| Symptom                       | Fix                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Styles not rendering          | Rebuild the UI package CSS; check both stylesheet imports and the alias        |
| Component not found           | Rebuild the UI package or check the tier barrel export                         |
| Dark mode not working         | The theme decorator/toggle isn't toggling the class on the root element        |
| Hook throws (`useTheme` etc.) | Missing provider decorator in `preview`                                        |
| Story missing from sidebar    | `stories` glob or `title` mismatch — restart the dev server after adding files |

## Project-specific → `AGENTS.md`

Framework-package choice, the `apps/storybook` path, the exact addon list, deploy target, and design-token / theme wiring belong in the project's `AGENTS.md`.

> **Audit:** review this domain on demand with the manually-invoked `storybook-audit` command (see `audit-all` for the whole suite).
