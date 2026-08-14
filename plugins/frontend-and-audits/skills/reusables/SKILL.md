---
name: reusables
description: Use when creating, editing, or refactoring any reusable UI component (e.g. components/ui/*, shared widgets in components/_shared/*), a custom hook, or a utility function. Enforces the user's required design for reusables — self-contained and context-agnostic, owning their own animation/state/behaviour, fully controllable via props with sensible defaults, no hardcoded magic values, accessible, and de-duplicated (shared behaviour extracted into hooks/utils). Apply whenever you build or restructure a primitive, a shared widget, an overlay/dialog/dropdown, a hook, or a generic helper — NOT for one-off feature/page sections.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Self-contained, fully-controllable reusables

The user builds every reusable component, hook, and helper to be **dropped in anywhere and controlled entirely from the outside**. A reusable must never depend on a specific parent, data source, route, or hidden global, and never hardcode a value a caller might reasonably want to change.

## Component rules

1. **Self-contained & agnostic.** No coupling to specific data, routes, parent state, or global singletons. It must work identically wherever it's dropped. Take everything it needs through props.

2. **It owns its own behaviour.** A component encapsulates its **own** animation, transitions, open/close lifecycle, focus management, scroll-lock, click-outside, portalling, etc. The consumer just flips a prop (e.g. `open`) — it never has to wire up the animation or lifecycle itself. Example: a `Drawer`/`Dialog` animates itself in **and out** (stay mounted through the exit transition, unmount on `transitionend`); the caller only passes `open` + `onOpenChange`. If two components share such behaviour, **extract a hook** rather than duplicating (e.g. `useMountTransition`, `useOverlayDismiss`, `useClickOutside`).

3. **Fully controllable via props, with sensible defaults.** Expose real control: `variant`, `size`, `className` (merged via `cn`, never overwritten), controlled `value` + `onChange`, `disabled`, `placeholder`, `aria-*`, and callbacks. Default the common case so simple usage stays short, but let a caller override anything reasonable. Prefer a **controlled** API (`value`/`onChange`) for inputs. Implement `variant`/`size` as plain class maps applied through `cn()` (no CVA); `cn()` also resolves Tailwind conflicts so a caller's `className` wins. **Prop-surface mechanics:** extend the native element's props (`ComponentPropsWithoutRef<'button'>` + a `...rest` spread) so every native attribute passes through; merge `className` **last** via `cn()`; `ref` is a normal prop (React 19), exposed only on form-control bases where forms/focus/a11y need the element — not by default everywhere. In a `ui:`-prefixed package, `cn()` must use `extendTailwindMerge({ prefix: 'ui' })` or conflict resolution silently fails (mechanics in `tailwind-css`).

4. **Purity contract (Global tier).** A reusable takes **formatted display values + `onX` callbacks** — never whole domain objects or raw enums. No data fetching, no Server Actions, no `lib/server` imports, no `next/headers`, no router hooks; a type a reusable needs may be mirrored locally instead of imported from app code. Cross-component variant class maps (e.g. a status palette consumed by both Badge and Tag) live in **one shared record**, not duplicated per component.

5. **No baked-in magic values.** Durations, IDs (`useId`), option lists, endpoints, list/group IDs, etc. come from props / `@/lib/constants` / `@/lib/config` — not literals buried in the component.

6. **Accessibility is part of "done".** Real roles/semantics, `aria-*`, labels, keyboard paths (Escape, arrows where relevant), and focus handling (move focus in, restore on close). A reusable ships these itself — the full contract is the `accessibility` skill.

7. **Composition where it fits.** Offer compound parts (`Card` + `CardHeader`/`CardContent`/`CardFooter`) so callers assemble what they need, instead of a mega-prop config object. Ship the parts as **separate named exports** (`Accordion`, `AccordionItem`) — never static properties (`Accordion.Item`), which break tree-shaking through barrels. A block with internal structure ships the pair: a data-driven wrapper (`<Accordion items={…} />`) **and** the composable parts.

8. **File conventions.** Each component file opens with a 1–3-line `@description` JSDoc that disambiguates siblings ("Badge is non-interactive; Tag can be clicked/closed"); `"use client"` goes after the JSDoc, before imports. Multi-version components (e.g. a marketing and an app variant of the same pattern) split the shared shape into `<name>-types.ts` + `<name>-defaults.ts` + `<name>-shared.tsx`, with one file per version — so versions can't drift.

## Hook & function rules

- **Hooks** encapsulate one reusable behaviour, are parameterized, and return a small typed surface. Extract a hook the moment a behaviour is shared by two components (don't wait). No hidden module state that leaks between callers. Return a **named object** when a hook exposes more than two values or the ordering isn't obvious; a 2-tuple matching the React idiom (`[value, setValue]`) is fine. Expose `loading`/`error` (plus `success`/`reset` where there's a confirmation state) for async hooks.
- **Functions** are pure and parameterized — inputs in, value out, no hidden globals, no side effects unless that IS the function. Generic helpers live in `@/lib/utils/<concern>/` and are reused, never re-implemented inline.
- Prop, hook, and helper names follow the `naming` skill (`use*` hooks, `on*` callback props, boolean assertions).

## Scope — build it at the narrowest scope that covers its reuse

Decide up front; don't wait for "used twice". Before building, **check if it already exists** (search the shared UI folder + other features/apps) — the same card/modal/empty-state is often already built but trapped in one place. If it's generic, **promote it** (strip local hooks/data, props-ify, move it up) rather than copy-pasting a second variant.

| Scope    | Reused by                                       | Home                                                                                                |
| -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Global   | more than one app, or a design-system primitive | `components/ui/` — tiered base/blocks/patterns/layouts (monorepo: `packages/ui`) — **must be pure** |
| App      | multiple features in one app                    | `components/_shared/`                                                                               |
| Feature  | multiple parts of one feature                   | `components/<feature>/_shared/`                                                                     |
| One-time | a single page/section                           | alongside its section                                                                               |

Promote as it grows: Feature → App `_shared/` → Global. Only the **Global** tier must be pure (props-only, no app hooks/data); lower tiers may use local hooks and data. The base/blocks/patterns/layouts tiers and where files live are `code-structure`'s domain; token usage and `cn()` mechanics are `tailwind-css`'s. A Global reusable ships its Storybook story in the same change (`storybook-story-writing`).

## The test before you finish

- Could I drop this component/hook into a different feature/app unchanged? If not, it's leaking a dependency — take it as a prop.
- Is there any value hardcoded that a caller might want different? Lift it to a prop or a constant/config.
- Does the consumer have to manage animation, focus, open/close, or lifecycle that the component could own itself? Move it inside.
- Is this behaviour/helper duplicated anywhere? Extract a shared hook/util.

> **Audit:** review this domain on demand with the manually-invoked `frontend-audit` (and `storybook-audit` for story coverage) skill (see `audit-all` for the whole suite).
