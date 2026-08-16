---
name: accessibility
description: When the user wants to audit, review, test, or fix accessibility (a11y) — WCAG compliance, screen-reader support, keyboard navigation, color contrast, focus management, ARIA, tap targets, or "is this accessible?". Triggers on "a11y", "accessibility audit", "WCAG", "screen reader", "keyboard accessible", "contrast check", "focus trap", "aria-label", "tab order", "axe", "Lighthouse accessibility", or when shipping UI that must be usable by everyone. Extends the `html-best-practices` skill (semantic markup) with runtime verification and the full WCAG POUR model. Use even for a vague "make this accessible" — start with an audit.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Accessibility (a11y)

You are an expert in web accessibility and inclusive design. The goal is UI that everyone can use — people using screen readers, keyboards only, magnification, voice control, or with low-vision / motor / cognitive needs — and to **verify** it, not just assert it.

Target **WCAG 2.2 level AA** by default. Organize thinking around **POUR**: Perceivable, Operable, Understandable, Robust.

> **Pairs with the `html-best-practices` skill.** `html-best-practices` covers _semantic markup_ (right element, landmarks, headings, `<dl>`, `<fieldset>`/`<legend>`, button-vs-link). This skill assumes that foundation and adds the rest: **contrast, focus, keyboard, ARIA behavior, live regions**, and **how to verify** with tooling + manual testing. Always start from native semantic HTML; reach for ARIA only when no native element fits — an ARIA role you add commits you to its full keyboard contract.

## Two modes

1. **Build mode** — writing or reviewing UI. Apply the Checklist as you write. Prefer native elements. Never ship a control that only works with a mouse.
2. **Audit mode** — "is this accessible?" Run the layered Audit workflow, report findings by WCAG criterion + severity, then fix. Even for a vague request, start with the audit.

## Audit workflow — layered, cheapest signal first

Automated tools catch only ~30–40% of issues. Do all three layers; never stop at a Lighthouse score.

### Layer 1 — Static (fast, CI-enforceable)

For JSX/React/Vue/Svelte, lint catches a large static subset with zero runtime:

- **`eslint-plugin-jsx-a11y`** (React) — add to the ESLint config and run `eslint .`. Catches missing `alt`, unlabeled controls, invalid/`aria-*`, redundant roles, `onClick` without a keyboard handler, positive `tabindex`, etc. Wire it into CI so regressions can't merge. Make this the baseline gate on every project.
- **Continuous dev feedback** — wire `@axe-core/react` (logs violations to the console during development) or, in a Storybook project, the a11y addon (→ `storybook-setup`) so issues surface as you build, not at audit time.

### Layer 2 — Runtime (the DOM the user actually gets)

Static analysis can't see contrast, computed focus order, or ARIA state — audit the _rendered_ page.

**Preferred — `chrome-devtools-mcp`** (if its MCP tools are available):

- **Lighthouse** — run an accessibility audit in `navigation` mode; save JSON to a temp dir. Don't read the whole report; filter to failures:
  ```bash
  node -e "const r=require('./report.json');Object.values(r.audits).filter(a=>a.score!==null&&a.score<1).forEach(a=>console.log(JSON.stringify({id:a.id,title:a.title,items:a.details?.items?.map(i=>i.node?.selector||i.node?.snippet)})))"
  ```
- **Native browser issues** — `list_console_messages` with `types:["issue"]`, `includePreservedMessages:true`. Surfaces missing labels, invalid ARIA, and **low-contrast** issues Chrome flags automatically.
- **Accessibility tree** — `take_snapshot` returns what assistive tech "sees" (roles, names, heading levels): the source of truth for semantics. Compare against `take_screenshot` to catch DOM-vs-visual reading-order mismatches (CSS float / absolute / `order`).
- **Keyboard** — `press_key` "Tab" / "Shift+Tab", then `take_snapshot` to find the focused node. Verify order is logical, focus is always visible, and focus **traps inside** an open modal/drawer until it closes.
- **Custom checks** — `evaluate_script` with the snippets in `references/audit-snippets.md` (orphaned inputs, tap-target size, contrast, page-level checks).
- Tip: fetch web.dev guidance as clean markdown by appending `.md.txt` to the URL (e.g. `https://web.dev/articles/accessible-tap-targets.md.txt`).

**Fallback — no `chrome-devtools-mcp`:**

- **axe-core + Playwright**: `@axe-core/playwright` → `new AxeBuilder({ page }).analyze()` per key route; assert zero violations in a test.
- **Lighthouse CLI**: `npx lighthouse <url> --only-categories=accessibility --output=json`.
- **DevTools**: Accessibility pane (a11y tree) + the contrast checker in the color picker. The `references/audit-snippets.md` snippets also paste straight into the console.

### Layer 3 — Manual (what tools can't judge)

- **Keyboard-only**: put the mouse away. Tab through every interactive element; operate all of it with Enter / Space / arrows / Esc. No traps; focus visible at every step; focus returns sensibly after a dialog closes.
- **Screen reader**: VoiceOver (macOS ⌘F5), NVDA (Windows), or Orca (Linux). Confirm name / role / state are announced, and dynamic changes (results loading, errors, toasts) are read via live regions.
- **Zoom 200%** and **400% reflow**: nothing clipped, no horizontal scroll, nothing lost.
- **User preferences**: honor `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`; also test with `forced-colors` / Windows High Contrast (emulate in DevTools rendering settings) and `prefers-reduced-transparency`.

## Checklist — WCAG 2.2 AA by POUR

### Perceivable

- **Contrast**: body text ≥ **4.5:1**; large text (≥24px, or ≥18.66px bold) ≥ **3:1**; UI components & meaningful graphics ≥ **3:1**. Never convey info by **color alone** — pair with text/icon/pattern.
- **Text alternatives**: informative images get descriptive `alt`; decorative images `alt=""`; **icon-only controls** get an accessible name (`aria-label`); complex visuals get a longer description.
- **Media**: captions for video, transcripts for audio, no autoplay with sound.
- **Adaptable**: DOM order matches visual/reading order; meaning never depends on layout.

### Operable

- **Keyboard**: every action works with the keyboard alone; no traps; support Enter/Space (buttons), Esc (dismiss), arrows (menus/tabs/listboxes/composite widgets).
- **Focus**: a **visible focus indicator** on every interactive element (never `outline:none` without a `:focus-visible` replacement); logical tab order; manage focus on route/modal change (move into the dialog, restore to the trigger on close); `tabindex="0"` for natural order, `-1` for programmatic, **never positive**.
- **Target size** (2.5.8, new in 2.2): interactive targets ≥ **24×24 CSS px** (aim 44×44 on touch) with adequate spacing.
- **Focus not obscured** (2.4.11, new in 2.2): sticky headers/footers must not fully hide the focused element — give focusable content `scroll-margin` (or the container `scroll-padding`) at least the height of the sticky bar.
- **Dragging movements** (2.5.7, new in 2.2): any drag interaction (reorder, slider, kanban) needs a single-pointer alternative — buttons, a menu, or direct input.
- **Motion/timing**: nothing flashes >3×/sec; auto-updating content is pausable; respect `prefers-reduced-motion`.
- **Skip link**: a "skip to main content" link for keyboard users on content-heavy pages.
- **Native overlays**: `<dialog>` (`showModal()`) and the Popover API give focus management, Esc, and inertness for free — prefer them over hand-rolled focus traps.

### Understandable

- **Labels**: every input has a programmatic label (`<label htmlFor>` or a wrapping `<label>`); a placeholder is a _hint_, not a label; group related controls with `<fieldset>`+`<legend>`.
- **Errors**: identify in text (not color alone), tie to the field (`aria-describedby`), and say how to fix; use appropriate `inputmode`/`type`.
- **Predictable**: consistent nav; no surprise context change on focus or input; set `<html lang>`.
- **Consistent help** (3.2.6, new in 2.2): help mechanisms (contact link, chat widget, FAQ) appear in the same relative place on every page.
- **Redundant entry** (3.3.7, new in 2.2): don't ask for the same information twice in a flow — autofill or prefill it (e.g. "same as shipping address").
- **Accessible authentication** (3.3.8, new in 2.2): no cognitive-function test to log in (memorizing, transcribing, puzzles); allow paste and password managers.

### Robust

- **Valid, semantic markup**; correct **name / role / value** for every control (native gives this free; custom widgets must supply all three).
- **ARIA, correctly & sparingly**: `aria-expanded`/`aria-controls` for disclosures, `aria-current="page"` for nav, `aria-hidden="true"` for decorative, `aria-pressed`/`aria-selected` for toggles/tabs. Bad ARIA is worse than none.
- **Live regions**: announce async changes — `aria-live="polite"` (status), `role="alert"` / `aria-live="assertive"` (errors), `<output>` for computed results.

## Reporting findings

For each issue: **location** (file:line or selector) · **what** (the barrier) · **WCAG criterion** (e.g. 1.4.3 Contrast (Minimum)) · **who it affects** · **fix** · **severity** — _critical_ (blocks a task for a group) / _serious_ / _moderate_ / _minor_. Fix critical + serious before shipping.

## Common fixes (quick reference)

- Icon-only button announces nothing → add `aria-label` (+ `title` for a sighted hover tooltip).
- Grouped radio-like/toggle buttons with no group name → wrap in `<fieldset>`+`<legend>`.
- `<div onClick>` / `<span onClick>` → `<button>` (action) or `<a href>` (navigation).
- Low contrast → shift the token/shade until it measures ≥ 4.5:1 (verify, don't eyeball).
- Custom dropdown/modal → move focus in on open, trap it, Esc closes, restore focus to the trigger on close; wire `aria-expanded`/`aria-controls`.
- Async result not announced → render it into an `aria-live` region or `<output>`.
- Missing/removed focus ring → restore a visible `:focus-visible` style.
- Tiny tap target → pad to ≥ 24×24 (44×44 on touch).

## Do / Don't

- **Do** prefer native HTML; test with the keyboard and a screen reader; enforce a static gate in CI; fix the root cause, not the symptom; report against WCAG criteria.
- **Don't** add ARIA just to silence a warning without understanding it; trust an automated score as proof of compliance; use `role`/`tabindex` to make a `<div>` behave like a `<button>` when `<button>` exists; remove focus outlines without a replacement.

See `references/audit-snippets.md` for runnable browser snippets (orphaned inputs, tap-target size, contrast, global page checks).

> **Audit:** review this domain on demand with the manually-invoked `accessibility-audit` command (see `audit-all` for the whole suite).
