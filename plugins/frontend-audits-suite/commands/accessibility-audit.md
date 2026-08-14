---
name: accessibility-audit
description: >-
  Manually invoked. Red-team accessibility audit of an app (or a diff/PR) against WCAG 2.2 AA organized
  around POUR — semantic landmarks/headings, keyboard nav and focus management, ARIA correctness, forms
  and errors, images/alt, color contrast, reduced motion, and zoom/reflow. Verifies each finding and
  writes a prioritized report. Not on by default. Self-contained; the house standards `accessibility` and
  `html-best-practices` are an optional enhancement. Part of the house audits family (see `audit-all`).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
argument-hint: "[phase] [path]"
model: opus
effort: high
---

# Accessibility audit

A **manually-invoked, red-team accessibility audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/accessibility-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`accessibility`** and **`html-best-practices`** ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/accessibility-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/accessibility-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/accessibility-audit.md`:

```
# Accessibility audit — <app/scope>

**Date:** <YYYY-MM-DD> · **Phase:** <phase> · **Mode:** Report-only · **Branch:** `<branch>` · **Scope:** <what was audited> · **Overall:** <X>/10

## Score change (previous → current)
| Metric | Previous | Current | Δ | Trend |
| --- | --- | --- | --- | --- |
| Overall | <prev/10 or N/A> | <cur/10> | <+N / -N / 0> | <▲ / ▼ / ■ / N/A> |

## Findings
| ID | Severity | Category | Status | Issue | Location |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | <category> | NEW | <one-line issue> | `file/path:line` |

### F1 — <title>
- **What:** <the defect, and the concrete evidence that proves it real>
- **Why it matters:** <impact / who it affects> <· optional standard or criterion ref, e.g. WCAG 2.1.2 / OWASP A01>
- **Fix:** <the specific remediation>

## Scorecard
| Category | Score | Notes |
| --- | --- | --- |
| Perceivable | <X>/10 | <one-line justification> |
| Operable | <X>/10 | <one-line justification> |
| Understandable | <X>/10 | <one-line justification> |
| Robust | <X>/10 | <one-line justification> |

## Action items
Tiers by phase — `development` → **Fix Now / Before Launch / Post-Launch**; `production` → **Fix Now / Next Release / Backlog**. Each task references a finding ID.

### <Tier>
| # | Priority | Task (finding ID) | Effort |
| --- | --- | --- | --- |

## Resolved since last audit
| ID | Issue | How it was resolved |
| --- | --- | --- |
```

### Output

Every run produces two things:

- **Full report** → `_reports/accessibility-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Audit the **rendered** page where possible (accessibility tree via a snapshot, keyboard, contrast, zoom) and the source. Automated tools catch only ~30–40% of issues, so use all three layers: **static** (`eslint-plugin-jsx-a11y` in CI, `eslint .`), **runtime** (axe-core via `@axe-core/playwright` or `npx lighthouse <url> --only-categories=accessibility`; DevTools accessibility tree + contrast picker), and **manual** (keyboard-only pass, a screen reader — VoiceOver ⌘F5 / NVDA / Orca, 200% zoom + 320px reflow, `prefers-reduced-motion`/`-color-scheme`/`-contrast`). House specifics and runnable browser snippets, if installed → `accessibility`.

### Perceivable

- **Landmarks & structure** — exactly one `<main>` per page; `<nav>`/`<header>`/`<footer>`/`<aside>` used correctly; `<section>`/`<article>` have accessible names; data `<table>` has `<caption>` + `<th scope>`.
- **Images/media** — every informative `<img>` has descriptive `alt`; decorative uses `alt=""` (never a missing attribute); icon-only `<svg>` is `aria-hidden` beside text or has an accessible name; no placeholder alt (`"image"`, `"photo"`); video captioned, audio transcribed, no autoplay with sound.
- **Contrast** — body text ≥ **4.5:1**, large text (≥24px or ≥18.66px bold) ≥ **3:1**, UI components + meaningful graphics ≥ **3:1**; check dark mode and disabled states; info never by **color alone** (pair with text/icon/pattern).
- **Reading order** — DOM order matches visual order (no CSS `order`/float/absolute that breaks screen-reader flow).

### Operable

- **Keyboard** — every interactive element reachable and operable by keyboard alone (Enter/Space, Esc, arrows for menus/tabs/listboxes); no `onClick` on a bare `<div>`/`<span>` without role + `tabIndex` + key handler; no positive `tabindex`.
- **Focus** — a visible indicator on every control (no `outline:none` without a `:focus-visible` replacement); logical tab order; overlays move focus in on open, **trap** it, Esc closes, and restore focus to the trigger on close.
- **Focus not obscured** (2.4.11) — a focused element is never fully hidden behind a sticky header/footer, cookie banner, or open overlay.
- **Dragging & path gestures** (2.5.7) — any drag/slider/reorder interaction has a single-pointer alternative (tap/click, buttons); nothing requires a drag or a specific path.
- **Skip link** — a "skip to main content" link, first focusable, visible on focus.
- **Target size** — interactive targets ≥ **24×24 CSS px** (aim 44×44 on touch) with adequate spacing.
- **Motion** — `prefers-reduced-motion` honored in global CSS; nothing flashes >3×/sec; auto-playing carousels/marquees/scroll animations are pausable.
- **Zoom & reflow** — viewport allows zoom (no `maximum-scale`/`user-scalable=no`); 200% zoom and 320px-wide reflow lose no content and cause no horizontal scroll.

### Understandable

- **Labels** — every input has a programmatic label (`<label htmlFor>` or wrapping `<label>` or `aria-label`); placeholder is a hint, not a label; related controls grouped with `<fieldset>`+`<legend>`.
- **Required & errors** — required fields marked visually and programmatically; errors identified in text (not color alone), tied to the field via `aria-describedby`, announced (`role="alert"`), with focus moved to the first error or an error summary; `autocomplete` on common fields; correct `inputmode`/`type`.
- **Predictable** — consistent nav; no surprise context change on focus/input; `<html lang>` set; unique descriptive page `<title>`; help mechanisms (contact, chat) appear in a consistent order across pages (3.2.6).
- **Redundant entry & auth** (3.3.7 / 3.3.8) — don't re-ask for info already provided in the same flow (auto-populate or let the user select it); auth doesn't rely on a cognitive test (remembering/transcribing) — allow paste, password managers, and copy into fields.

### Robust

- **Name/role/value** — correct for every control; prefer native; custom widgets supply all three.
- **ARIA correctness** — `aria-expanded`/`aria-controls` on disclosures, `aria-current="page"` on active nav, `aria-hidden` on decorative, `aria-pressed`/`aria-selected` on toggles/tabs; **no redundant ARIA** (`role="button"` on `<button>`, `role="navigation"` on `<nav>`); bad ARIA is worse than none.
- **Live regions** — async changes announced: `aria-live="polite"` for status, `role="alert"`/`assertive` for errors, `<output>` for computed results.
- **Component-library primitives** — audit each shared interactive component once (Button, Modal/Dialog, Dropdown/Select, Tabs, Accordion, Tooltip, DataTable, Toast/Alert) for its keyboard contract, roles/states, focus behavior, and accessible name; a fix there covers every consumer.
- **Static gate** — `eslint-plugin-jsx-a11y` present and wired into CI as the baseline.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
