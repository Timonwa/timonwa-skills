---
name: storybook-story-writing
description: Use when creating or modifying Storybook stories, in any project that has Storybook (monorepo or single app). Enforces the house story conventions on top of the current CSF3 + TypeScript standard — satisfies Meta, tier-based titles with the closed Blocks/Patterns subcategory set, argTypes for every prop, fn() spies + play functions from storybook/test, a fixed story taxonomy — and the rule that a component's story ships in the same change.
metadata:
  version: 1.1.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Storybook — writing stories

Applies **where Storybook is set up** — a monorepo's `apps/storybook` or a single app's own `.storybook/`, whichever the project uses. **Default to CSF3 + TypeScript.** **CSF Next** (factories, formerly "CSF4") is stable in Storybook 10 and becomes the default in 11 — adopt it per-project when the whole project migrates; don't mix formats in one repo. Until then, CSF3 + `satisfies` is the house default (same rule as `storybook-setup`).

## Definition of done — the story ships with the component

A UI component isn't done until its story is in sync, **in the same change** (mirroring `reusables`):

- **New component** → create its story; cover variants, sizes, and states (default, hover, disabled, loading, error, dark mode).
- **Changed component** → any new/changed/removed prop, variant, or state means updating `argTypes` and the matching stories so the story reflects the real API.

Treat "build/change the component" and "write/update its story" as **one task** — the step most often skipped. A missing or stale story means not done.

## The canonical story

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite"; // the project's framework package
import { fn } from "storybook/test";
import { Button } from "@app/ui/base";

const meta = {
  component: Button,
  title: "Base/Button", // tier-first: Base/ · Blocks/ · Patterns/ · Layouts/
  tags: ["autodocs"],
  parameters: { layout: "centered" }, // centered | padded | fullscreen
  args: { onClick: fn() }, // spies for every callback prop — logs in the Actions panel, assertable in play
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "outline"], description: "Visual style" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: "Button" } };
```

**Use `satisfies Meta<typeof X>`, not `: Meta<typeof X>`** (industry standard). It links `meta` to `StoryObj<typeof meta>`, so args can be set at the meta _or_ story level and stay type-checked; a plain annotation drops that inference. Type each story with `: Story`. **Carve-out:** multi-component or non-component story files (icon galleries, form compositions) may use a plain `Meta` annotation — there's no single component to infer from.

**Callback props are `fn()` spies in `args`**, imported from `storybook/test` (NOT `@storybook/test` — that package was removed in Storybook 9/10). Never use the legacy `argTypes: { onClick: { action: "clicked" } }` pattern.

## argTypes — required for every public prop

Define a control for each data prop so devs/reviewers can exercise every combination in the UI: `select` (union/enum props), `boolean`, `text`, `{ type: "number", min, max, step }`. Callbacks get `fn()` spies in `args` (above), not an argTypes entry.

## Titles — tiers and the closed subcategory set

Titles are tier-first: `Base/…`, `Blocks/…`, `Patterns/…`, `Layouts/…` (plus `Icons/…`, `Assets/…` where the library ships them). **Blocks and Patterns share ONE closed, behaviour-based, single-word subcategory set:**

`Disclosure · Display · Feedback · Forms · Navigation · Overlay`

- **Same set for both tiers** — `Blocks/Overlay/Modal`, `Patterns/Navigation/Footer`.
- **No subcategories under Base, Layouts, Icons, or Assets** — a `Base/<Sub>/` title is a signal the component is really a Block, or Base has grown too big.
- **No product-domain subcategories in a shared package** — domain-named components belong in the app's feature folders, not `packages/ui`.
- **File card-shaped components by what they DISPLAY or do, never by shape** — there is no "Cards" bucket.
- **Adding a seventh subcategory is an explicit governance decision, not drift.**

## Story taxonomy (in this order)

- **Default** — the component in its baseline working state: **required props supplied**, everything else left at its defaults (a component with no required props needs none).
- **Variants** — one per visual variant (`Primary`, `Secondary`).
- **Sizes** — one per size.
- **States** — `Disabled`, `Loading`, `Error` (+ hover / dark where relevant).
- **With\*** — optional features (`WithIcon`).
- **AllVariants / AllSizes** — side-by-side overview via `render` (not `args`).
- **Interactive** — stateful components via `render` + hooks.
- **Interaction testing** — script and assert user flows with a **`play` function**:

  ```tsx
  import { expect, userEvent, within } from "storybook/test";

  export const SubmitsForm: Story = {
    play: async ({ canvasElement, args }) => {
      const canvas = within(canvasElement);
      await userEvent.type(canvas.getByLabelText("Email"), "a@b.co");
      await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
      await expect(args.onSubmit).toHaveBeenCalledOnce();
    },
  };
  ```

**Naming hygiene:** don't abbreviate story names, and no size suffixes — `Small`, not `SmallSize`; `AllVariants`, not `AllVariationTypes`.

## Conventions

- File: `<Component>.stories.tsx` (PascalCase), **in the component's own folder** beside the component it documents (`ui/base/Button/Button.stories.tsx`). The tier lives in the `title`, not the path — the sidebar is built from `title` + `storySort` (see `storybook-setup`). Tiers are defined in `code-structure`.
- Title mirrors the tier (and, for Blocks/Patterns, the subcategory) per the closed set above.
- Stories use **plain (unprefixed) Tailwind classes** in their own wrapper JSX — never the UI package's `ui:` prefix (those classes only compile inside the package and silently drop elsewhere).
- Theme and providers come from the **global decorator** in `preview` — don't wrap stories yourself (→ `storybook-setup`).
- Hoist shared args to the **meta level**; keep each story's `args` to only what differs.
- Duplicate the project's `_Template.stories.tsx` to start a new story, if it has one.

## Avoid

- CSF2 template binding (`Template.bind({})`) — use CSF3 object stories.
- `@storybook/test` imports or `{ action: "…" }` argTypes — use `storybook/test` and `fn()`.
- Untyped stories (`export const X = {}` with no `: Story`).
- Repeating shared args in every story — hoist to `meta.args`.

## Project-specific → `AGENTS.md`

The framework package (`@storybook/nextjs-vite` vs `@storybook/react-vite`), the `apps/storybook` path, the title root, decorators/providers, and design-token / dark-mode wiring belong in the project's `AGENTS.md`. Setting Storybook up is the `storybook-setup` skill.

> **Audit:** review this domain on demand with the manually-invoked `storybook-audit` command (see `audit-all` for the whole suite).
