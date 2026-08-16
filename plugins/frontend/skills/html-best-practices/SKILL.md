---
name: html-best-practices
description: Use when writing or reviewing any HTML/JSX markup — building a component, page, form, table, or list, or fixing "div soup". Triggers on "semantic HTML", "markup", "right element", "div soup", "heading structure", "description list", "table markup", "form markup", or whenever UI is being written. Owns element choice, document structure, headings, lists/dl, tables, forms, dialogs/disclosure, media, and where markup meets JSX and Tailwind. Pairs with `accessibility` (which owns WCAG, ARIA behavior, contrast, and focus).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# HTML — semantic markup

Write semantic HTML: pick the element that describes the content, not `<div>`/`<span>`. Semantic markup is the foundation accessibility and SEO build on.

> **Pairs with the `accessibility` skill.** This skill owns the _markup_ (right element, structure, headings, `<dl>`, forms, media). `accessibility` owns the rest — WCAG, ARIA behavior, contrast, focus, keyboard, live regions, and verification. Start here; go there for a11y depth.

## Choosing the right element — decide while writing

Before reaching for `<div>`/`<span>`, ask **"what is this content?"** and pick the element that describes it. `<div>`/`<span>` are last resorts — style hooks with no meaning. If content has structure or meaning, a better element almost always exists. Decide **while writing** the markup, not after review.

| The content is…                                                       | Use                                                | Not                           |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------- |
| A label paired with a value (stat, metric, spec, key→value, glossary) | `<dl>` + `<dt>` (label) + `<dd>` (value)           | nested `<span>`/`<div>`       |
| A list of similar items                                               | `<ul>`/`<ol>` + `<li>`                             | a stack of `<div>`s           |
| A titled, thematic group of content                                   | `<section>` with a heading (`<h2>`–`<h6>`)         | a bare `<div>`                |
| Self-contained, standalone content                                    | `<article>`                                        | `<div>`                       |
| The page's primary content                                            | `<main>` (one per page)                            | `<div>`                       |
| Site/section navigation                                               | `<nav>`                                            | a `<div>` of links            |
| Intro / masthead of a page or section                                 | `<header>`                                         | `<div>`                       |
| End matter (author, links, copyright)                                 | `<footer>`                                         | `<div>`                       |
| Tangential / complementary content (sidebar, callout)                 | `<aside>`                                          | `<div>`                       |
| Text needing emphasis / importance                                    | `<em>` / `<strong>`                                | `<span>` + CSS                |
| A clickable action                                                    | `<button>`                                         | `<div>`/`<span>` + onClick    |
| A link to a URL                                                       | `<a href>`                                         | `<div>` + onClick             |
| A quotation                                                           | `<blockquote>` / `<q>`                             | `<div>`                       |
| A figure + caption                                                    | `<figure>` + `<figcaption>`                        | `<div>`                       |
| A date or time                                                        | `<time dateTime="…">`                              | `<span>`                      |
| Tabular data (rows × columns)                                         | `<table>` + `<caption>` + `<thead>` + `<th scope>` | a grid of `<div>`s            |
| Collapsible/disclosure content                                        | `<details>` + `<summary>`                          | `<div>` + onClick toggle      |
| A modal or popup dialog                                               | `<dialog>` (+ `showModal()`)                       | a hand-rolled `<div>` overlay |

### Label → value pairs are a description list

Any "label + value" grouping — stats, counters, metadata, specs — is a **`<dl>`**, not nested spans/divs:

```jsx
<dl>
  {stats.map((s) => (
    <div key={s.label}>   {/* a single wrapper div per pair is allowed in <dl> */}
      <dt>{s.label}</dt>  {/* term / label */}
      <dd>{s.value}</dd>  {/* value / description */}
    </div>
  ))}
</dl>
```

- `<dt>` comes **before** `<dd>` in the DOM. To show the value visually on top, reorder with CSS (`flex-col-reverse`), never by swapping DOM order.
- A group is a `<dt>`/`<dd>` pair directly under `<dl>`, or wrapped in **one** `<div>` — no deeper nesting.
- Extra detail about the value (a hint, unit) goes **inside** the `<dd>`, never as a third sibling.

### Tabular data is a `<table>`

Dashboards are the most-div-souped surface. Rows-by-columns data — anything a user would sort, scan across, or compare — is a `<table>`: `<caption>` names it, `<thead>` holds the header row, every header cell is `<th scope="col">` (or `scope="row"` for row headers). A CSS-grid of `<div>`s loses header association for screen readers and can't be recovered with ARIA patchwork. Use grid/flex `<div>`s only for card layouts, where each item is a self-contained `<article>`, not a row.

### Dialogs and disclosure are native elements

- **`<dialog>`** with `showModal()` gives you focus trapping, `Escape`, `::backdrop`, and top-layer stacking for free — prefer it to hand-rolled overlays (behavior depth → `accessibility`, component design → `reusables`).
- **`<details>`/`<summary>`** is the native accordion/disclosure — keyboard and screen-reader support included; reach for a custom component only when you need animation or exclusive-open groups it can't express.

### Every content group needs a heading

Each region (`<section>`/`<article>`) starts with a heading (`<h2>`–`<h6>`) so the page has a real outline. Keep levels **sequential** (`<h1>` page title → `<h2>` sections → `<h3>` sub-parts); never skip a level for visual size — size with CSS. One `<h1>` per page.

```jsx
<section aria-labelledby="counts-h">
  <h2 id="counts-h">Counts</h2>
  <dl>…</dl>
</section>
```

- A `<section>` needs an accessible name: a heading via `aria-labelledby`, or `aria-label` when there's no visible heading. An unlabeled `<section>` is just a `<div>`.

### Anti-patterns to avoid

- **`<span>` inside `<span>`**, or stacks of `<div>`, for content that has structure — use `<dl>`, a list, or headings.
- **`<div>` where a list / `<dl>` / heading fits** — "div soup" is meaningless to assistive tech and search engines.
- **`<section>` with no heading or accessible name** — use `<div>` if it's purely layout.
- **Skipped heading levels** — keep them sequential; use CSS for size.
- **Clickable `<div>`/`<span>`** — use `<button>` (action) or `<a href>` (navigation).

### In React / JSX

Components are functions that emit HTML — the same rules apply to their output. A "card" or "list" component renders `<article>`/`<section>`/`<dl>`/`<ul>` as appropriate, not a default `<div>`. **Prefer native elements over ARIA `role=`; reach for ARIA only when no native element fits** (see `accessibility`).

## Forms

- `<form>` with proper `action`/`method`; associate every input with a label (`<label htmlFor>` or a wrapping `<label>`); use the right input `type` (`email`/`tel`/`number`/…); group related controls with `<fieldset>` + `<legend>`; add validation attributes (`required`, `pattern`, `min`, `max`). Error/label a11y depth → `accessibility`.

## Media

- **Images:** always `alt` — descriptive for informative, `alt=""` for decorative; `srcset`/`sizes` for responsive; `width`/`height` to prevent layout shift; `loading="lazy"` below the fold — but **never lazy-load the LCP (hero) image**: it loads eagerly with `fetchpriority="high"` (in Next, `next/image` with `priority` → `nextjs-best-practices`).
- **`autocomplete`** on inputs collecting user data (`name`, `email`, `postal-code`, …) — browsers autofill correctly and WCAG 1.3.5 requires it on common fields.
- **Video/audio:** captions + transcripts; multiple source formats; `poster` for video; avoid autoplay with sound.

## Document meta

`<!DOCTYPE html>`, `<html lang>`, a viewport meta tag, and appropriate SEO meta tags.

## Styling (Tailwind)

Utility classes are **presentational only** — they never change what an element _means_. Keep markup semantic and add classes to it; don't reach for a `<div>` because it's convenient to style.

- Style the semantic element directly (`<section className>`, `<dl className>`, `<button className>`) instead of wrapping it in styled `<div>`s.
- Layout (flex/grid) never justifies div soup — a `<section>`, `<ul>`, `<dl>`, or `<nav>` can be the flex/grid container itself.
- Use `sr-only` for visually-hidden but accessible text (e.g. a `<section>`'s accessible-name heading that would otherwise be visually redundant).
- (Tokens, dark mode, the `ui:` prefix → `tailwind-css`.)

## ARIA — prefer native

Prefer native HTML over ARIA; reach for ARIA only when no native element fits, and make it match the element's real behavior. The markup basics live here (`alt`, `<label htmlFor>`, `aria-label` for icon-only controls). **Everything deeper — roles, states, landmarks, live regions, contrast, focus, keyboard — is the `accessibility` skill.**

> **Audit:** review this domain on demand with the manually-invoked `accessibility-audit` command (see `audit-all` for the whole suite).
