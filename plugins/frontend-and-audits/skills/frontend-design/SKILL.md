---
name: frontend-design
description: Use when designing or improving how a web UI looks and feels — building components, pages, sections, or layouts and wanting them polished and production-grade, or making UI "less generic" and more professional. Covers the design-quality layer — visual hierarchy, typography, color, spacing & rhythm, layout, depth, imagery, UI states, motion, and distinctiveness. The technical layers live elsewhere — design tokens/theming via `tailwind-css`; contrast/focus/reduced-motion via `accessibility`; semantic markup via `html-best-practices`; component/file structure via `code-structure` + `reusables`; names via `naming`. Read the project's palette, fonts, and scales from its `AGENTS.md`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Frontend design

Design quality is the judgment layer _on top of_ the technical skills: given tokens (`tailwind-css`), accessible primitives (`accessibility`, `reusables`), and semantic markup (`html-best-practices`), this is how you make a UI look **intentional, hierarchical, and genuinely designed** — original work, not a template and not a copy of what everyone else ships.

> **The bar: design like a designer.** Produce distinctive, original UI. Never settle for the default component-library look, and never clone the first common pattern you think of — see **Distinctiveness** below; it's the point of this skill, not a footnote.

> **Project facts → `AGENTS.md`:** the brand palette, fonts, type/spacing scales, breakpoints, radius/shadow tokens, motion timings, and the site's aesthetic/voice. This skill is the _how-to-design-well_; those are the _materials_. Use the project's existing tokens and scales — never invent one-off values.

## Process

- **Start with hierarchy, not decoration.** Decide what's primary/secondary/tertiary on the screen before choosing colors or borders.
- **Design in grayscale first.** Removing color forces hierarchy to come from _size, weight, spacing, and contrast_ — add color last, as an accent, once the structure reads.
- **Work in cycles, low- to high-fidelity.** Rough layout → spacing/hierarchy → color/polish → states. Don't perfect one corner before the whole reads.
- **Lean on convention.** Use familiar patterns (where nav/search/actions live); spend your novelty budget on the one thing that should feel distinctive, not on reinventing controls.

## Visual hierarchy — the master principle

- **Not everything can stand out.** If everything is bold/large/colored, nothing reads. Deliberately **de-emphasize** secondary content (labels, metadata, helper text) so the primary content dominates.
- Establish hierarchy with **weight and color before size** — a heavier weight or a softer gray separates levels without ballooning font sizes.
- **Secondary text = softer, not smaller-only.** Drop supporting text to a muted foreground token rather than shrinking it to unreadability.
- **Labels are usually noise.** "Name: Jane" — often the value alone (or label-as-placeholder) is enough; combine label+value when scannability matters.
- **De-emphasize by reducing contrast**, not by adding gray borders everywhere.

## Typography

- **Use the project's type scale** — a fixed set of sizes; never eyeball a new one. Hierarchy comes from _steps on the scale_, not arbitrary px.
- **Line length** ~45–75 characters for body copy (`max-w-prose`/a `ch`-based width). Long full-width paragraphs are a readability tell.
- **Line height scales inversely with size**: tight for large headings, looser (~1.5–1.7) for body; and looser for longer line lengths.
- **Weight for emphasis**, not italics/underline for UI. Avoid weights under 400 for small text; reserve 600–700 for headings/emphasis.
- **Tighten headings** (slightly negative letter-spacing on large sizes); don't letter-space lowercase body. Don't center more than a couple of lines.
- Align numbers in tables with tabular figures; don't mix too many families (a heading + a body family is plenty).

## Color

- **Work in HSL/OKLCH** and use a **full shade ramp per hue** (not five hand-picked hex values) — you need many steps for text, surfaces, borders, and states. This is the `tailwind-css` token job; design _with_ those ramps.
- **Grays should be tinted**, not pure neutral — a subtle hue toward the brand warms the whole UI.
- **Never rely on hue alone** to convey meaning — pair with text/icon/weight (also `accessibility`). Ensure contrast meets AA (`accessibility` owns the ratios).
- **Restraint**: one dominant brand color + neutrals + reserved semantic colors (success/warning/danger/info) _only_ for their meaning. More colors ≠ more design.
- Prefer **semantic tokens** (`foreground`, `muted`, `border`, `accent`) over literal shades at the call site.

## Spacing, rhythm & layout

- **Start with more whitespace than feels necessary, then remove.** Cramped UIs read cheap; generous spacing reads considered.
- **Use the spacing scale** (consistent steps, typically multiples of a base) — no arbitrary margins. Consistent rhythm between sections and within components.
- **Proximity groups.** Related elements sit close; unrelated ones get clear separation. Ambiguous equal spacing (is this label for the field above or below?) is a common bug — bind a label tighter to its field.
- **Don't fill the width.** Cap content width for readability; center or offset within a wider canvas. Not every element should be full-bleed.
- **Align to a grid**; align edges; avoid off-by-a-few-pixels drift. Establish columns and stick to them.
- **Responsive by intent**, not just reflow — decide what each breakpoint should emphasize; every layout works from small to large.

## Depth & elevation

- **Light comes from above:** shadows fall below, raised elements get a subtle top light / darker bottom edge. Keep it consistent.
- Use a **shadow/elevation scale** (sm→lg) to signal layering (cards < popovers < modals); bigger, softer shadows = higher elevation. Don't scatter random shadows.
- **Reduce borders.** Separate with spacing, a background shift, or a shadow before reaching for a 1px line — too many borders read busy. When you use borders, keep them low-contrast.

## Imagery & icons

- Don't scale icons up as illustrations — use real illustrations/imagery at large sizes; keep icons at their intended size and optical weight.
- **Text over images** needs a scrim/overlay or gradient for reliable contrast — never raw text on a photo.
- Keep **consistent aspect ratios** and treatment (rounding, overlay) across a set. Constrain user-supplied images with `object-cover` + fixed ratio.
- Use one icon set at a consistent stroke/weight (→ `svg-generation` for producing them).

## UI states & polish

- **Design every state**, not just the happy path: default, hover, focus (visible — `accessibility`), active, disabled, loading (skeleton/spinner), **empty**, and **error**. Empty states are a design opportunity, not a blank div.
- **Supercharge the defaults** — custom list markers, better link underlines (offset/thickness), accent-bordered callouts, considered form controls. Small upgrades over browser defaults signal craft.
- **Reduce visual noise** — fewer dividers, fewer competing accents, fewer font sizes. Remove until it breaks, then add back one step.
- Keep **radius, shadow, and spacing consistent** across components (from tokens) so the set feels like one system.

## Motion

- **Subtle and purposeful** — motion should clarify (what changed, where it came from), never decorate for its own sake.
- **Fast**: ~150–300ms with an ease curve; entrances/exits shorter, not springy-bouncy unless the brand calls for it.
- Animate transform/opacity (cheap), not layout properties. Respect **`prefers-reduced-motion`** (→ `accessibility`).

## Distinctiveness — design like a designer

The whole point. The bar is **original, designed-from-intent work — not assembled from defaults, and not a copy of what everyone ships.** Approach each UI as a designer would: form a point of view, then make deliberate choices that express it.

- **Never look like a stock component library.** Flat gray cards, a default system font, and one stock-blue button read as unfinished/templated. Off-the-shelf defaults (any component-library look) are a skeleton at most — restyle until the result is unmistakably _this_ product, not the library.
- **Don't clone the common pattern** just because it's everywhere. Understand _why_ a pattern works, then ship a considered, distinctive version — not a copy of the first landing-page/dribbble result.
- **Commit to a point of view** (calm / dense / editorial / playful / brutalist / …) and make _every_ choice serve it — type pairing, a signature accent, spacing generosity, motion, and one or two crafted signature details. Consistency of voice is what makes UI feel _authored_.
- **Add the details a designer would** — considered empty states, a distinctive focus/hover treatment, intentional iconography weight and imagery. That last 10% of polish is what separates "designed" from "assembled".

## Do / Don't

- **Do** establish hierarchy first (in grayscale); use the project's scales/tokens; give generous whitespace; design all states + empty/error; keep motion subtle; add one distinctive detail.
- **Don't** make everything bold; invent off-scale sizes/spacing/colors; rely on hue alone; box everything in borders; ship only the happy path; leave a UI at generic-default or looking like a stock component library; clone the first common pattern; hardcode values that belong in tokens (→ `tailwind-css`).

> **Audit:** review this domain on demand with the manually-invoked `frontend-audit` command (see `audit-all` for the whole suite).
