# The six layer files — what belongs in each

Skeletons for the split `SKILL.md` mandates, in the order `globals.css` imports them. Each shows the shape and the one rule that file exists to enforce; fill with the project's own values.

**The order is load-bearing.** `theme.css` can only map variables `tokens.css` has already declared, and `components.css` can only `@apply` utilities that exist by then. Reordering produces silently missing styles, not an error.

## 1. `tokens.css` — the raw variables

Plain custom properties on `:root`, plus a `.dark` block overriding **the same names**. No `@theme` here, no Tailwind syntax — this is the palette in one place, and the only file a rebrand touches.

```css
:root {
  /* Surfaces */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);

  /* Brand */
  --primary: oklch(0.58 0.18 265);
  --primary-foreground: oklch(0.985 0 0);

  /* Support */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --destructive: oklch(0.577 0.245 27.325);

  --radius: 0.625rem;
}

/* Same names, different values — nothing downstream knows the theme changed. */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
}
```

**Use OKLCH.** Lightness is perceptual, so `oklch(0.6 …)` and `oklch(0.6 …)` at different hues read as the same weight — which hex cannot promise. It also makes a dark variant a lightness edit rather than a re-pick.

**Name by role, not by value.** `--primary`, not `--blue-600`: the second name is a lie the moment the brand changes.

## 2. `theme.css` — map the variables to Tailwind keys

The **only** file with `@theme`. Every entry points at a `var()` from step 1, never a literal.

```css
/*
 * `inline` is load-bearing: it keeps utilities pointing at the live variable, so a
 * `.dark` block or a runtime override flows through `bg-primary` without a rebuild.
 * Drop `inline` and the value is frozen at build time.
 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-destructive: var(--destructive);

  --radius-lg: var(--radius);

  /* Fonts: point at what next/font generated, so the class and the loader agree. */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

Keep the framework's own `--font-*` mappings when adapting a starter — they reference variables `next/font` created, and rewriting them by hand silently drops the font.

## 3. `base.css` — element defaults

`@layer base` only. Bare-element rules, no classes.

```css
@layer base {
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans, system-ui, sans-serif);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3 {
    line-height: 1.2;
    text-wrap: balance; /* no orphaned last word in a heading */
  }

  /* Anchor jumps clear a fixed header. Scoped to :target so ordinary
     navigation isn't offset too. */
  [id]:target {
    scroll-margin-top: 5rem;
  }

  /* Honour the OS setting rather than overriding it. */
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

## 4. `utilities.css` — custom utilities

`@utility`, so the result composes with variants (`sm:`, `hover:`, `dark:`) exactly like a built-in. A plain class does not.

```css
/* Scrollable, but no visible scrollbar. */
@utility no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* Clamp to n lines — the arbitrary value comes from the caller: line-clamp-3 */
@utility line-clamp-* {
  display: -webkit-box;
  -webkit-line-clamp: --value(integer);
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

Motion tokens can also live here in their own `@theme` block, so easings are named rather than pasted:

```css
@theme {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## 5. `animations.css` — keyframes and the classes that use them

Before `components.css`, so a component class can override an animation class. (`@keyframes` itself is order-independent — it resolves by name — but the _classes_ in this file are not.)

```css
@keyframes hero-gradient-shift {
  to {
    background-position: 200% 50%;
  }
}

.hero-gradient-text {
  background-image: linear-gradient(90deg, var(--primary), oklch(0.75 0.18 330), var(--primary));
  background-size: 200% auto;
  background-clip: text;
  color: transparent;
  animation: hero-gradient-shift 8s linear infinite;
}

/* Any decorative animation stops when the OS asks it to. */
@media (prefers-reduced-motion: reduce) {
  .hero-gradient-text {
    animation: none;
  }
}
```

## 6. `components.css` — authored class patterns

`@layer components`, for a repeated **arrangement** that isn't a component. If it has state, props, or variants, it is a component in `ui/` instead — this file is for layout rhythm a class can express.

```css
/* Section rhythm — the vertical spacing every marketing section shares. */
@layer components {
  .section {
    @apply mx-auto mt-20 flex max-w-6xl flex-col gap-8 sm:mt-24;
  }

  /* Small uppercase label above a section heading. */
  .section-eyebrow {
    @apply text-muted-foreground text-xs font-semibold tracking-wide uppercase;
  }
}
```

**The test before adding one:** would this be better as a component with props? Usually yes. A class earns its place when it is pure arrangement reused across unrelated components — and when the alternative is repeating eight utilities in twelve files.

## Splitting a layer file when it grows

A layer file is a **concern, not a hard count of six**. When one gets long enough to be hard to scan, split it by sub-concern — and the split files keep the parent's `@layer`, so nothing about precedence changes. They are imported in the parent's position in the entry.

```css
/* globals.css — base and components each split in two */
@import "./tokens.css";
@import "./theme.css";
@import "./base.css"; /* 3a. element defaults */
@import "./typography.css"; /* 3b. also @layer base — prose elements */
@import "./utilities.css";
@import "./animations.css";
@import "./components.css"; /* 6a. shared patterns */
@import "./sections.css"; /* 6b. also @layer components — section families */
@import "./heroes.css"; /* 6c. also @layer components — hero families */
```

**When to split:** one file, one family of related classes, and the parent was getting long. A `heroes.css` holding `.page-hero`, `.page-hero-title`, `.image-hero`, `.image-hero-overlay` is easier to maintain than the same twelve classes buried in a 300-line `components.css`. **When not to:** three classes do not earn a file.

## `typography.css` — prose defaults (`@layer base`)

The one split worth doing by default, and only when the app renders **authored content it does not control the markup of**: a blog, a docs page, an MDX file, or a rich-text editor's output. That HTML arrives as bare `<h2>`, `<p>`, `<ul>`, `<blockquote>`, `<code>` with no classes to hang utilities on, so the elements themselves have to carry the styling.

```css
/* typography.css — @layer base, so a utility on a specific element still wins */
@layer base {
  h1,
  h2,
  h3,
  h4 {
    color: var(--foreground);
    line-height: 1.2;
    text-wrap: balance;
  }

  p {
    line-height: 1.6;
  }
}

/* Scoped to rendered content, so app UI is unaffected. Tailwind's typography
   plugin is the alternative — this is the hand-rolled equivalent. */
.prose {
  max-width: 68ch; /* measure: ~66-75 characters is the readable band */

  :where(h2, h3) {
    margin-block-start: 2em;
    margin-block-end: 0.6em;
  }

  :where(p, ul, ol, blockquote) {
    margin-block-end: 1.25em;
  }

  :where(a) {
    color: var(--primary);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  :where(blockquote) {
    border-inline-start: 3px solid var(--border);
    padding-inline-start: 1em;
    color: var(--muted-foreground);
  }

  :where(code):not(pre code) {
    background: var(--muted);
    border-radius: 0.25rem;
    padding: 0.15em 0.35em;
    font-size: 0.9em;
  }

  :where(pre) {
    overflow-x: auto; /* long lines scroll, never widen the page */
    background: var(--card);
    border-radius: var(--radius);
    padding: 1em;
  }

  :where(img) {
    border-radius: var(--radius);
  }
}
```

Three things that matter more than the values:

- **Use `:where()` for every descendant.** It has zero specificity, so a caller can still put a utility on one heading and win. Without it, `.prose h2` beats `text-3xl` and the escape hatch is gone.
- **Set a measure.** `max-width: 68ch` is the single biggest readability win in a blog, and utilities on wrapper divs routinely forget it.
- **Scope it.** Class-scoped (`.prose`), not global, so a marketing page's own `<h2>` is untouched.

An editor's output needs the same treatment plus whatever its serializer emits — check the real HTML rather than assuming, since editors differ on lists, embeds, and code blocks.

## Which file does this go in?

| You are adding                      | File             | Why                                                     |
| ----------------------------------- | ---------------- | ------------------------------------------------------- |
| A colour, radius, or spacing value  | `tokens.css`     | One place a rebrand touches                             |
| A Tailwind key for an existing var  | `theme.css`      | The only `@theme` file                                  |
| A bare-element default              | `base.css`       | No classes belong here                                  |
| Something that needs `sm:`/`hover:` | `utilities.css`  | `@utility` composes with variants; a class doesn't      |
| A repeated multi-utility layout     | `components.css` | Only if it isn't better as a component                  |
| A keyframe                          | `animations.css` | Last, so it can use everything above                    |
| Styling for blog/MDX/editor output  | `typography.css` | `@layer base` + a `.prose` scope; markup has no classes |
| A class family in a long file       | a split of it    | Keeps the parent's `@layer`; imported in its place      |

**Skeleton, not a rule:** a file with nothing in it yet still gets created with a one-line comment saying what it is for, so the first addition has an obvious home instead of landing in `globals.css`.
