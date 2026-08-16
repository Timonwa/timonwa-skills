---
name: storybook-audit
description: >-
  Manually invoked. Storybook coverage and story-quality audit — cross-references shared UI components against existing stories to find gaps, and checks stories against the house conventions (CSF3 + TS `satisfies Meta`, tier-based titles, `argTypes` for every prop, the fixed taxonomy). Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `storybook-story-writing` and `storybook-setup` are an optional enhancement. Part of the house audits family (see `audit-all`).
argument-hint: "[phase] [path]"
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Storybook audit

A **manually-invoked, red-team Storybook audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/storybook-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`storybook-story-writing`** and **`storybook-setup`** ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/storybook-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/storybook-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/storybook-audit.md`:

```
# <Domain> audit — <app/scope>

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
| Coverage | <X>/10 | <one-line justification> |
| Story quality | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/storybook-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Everything needed to run the audit is inlined here. For fuller rationale, `storybook-story-writing` / `storybook-setup` are an optional reference if installed; tiers → `code-structure`.

### Coverage

- **Detect the layout first** — locate (a) the **component source of truth**: a shared UI package's tier barrels (`base` / `blocks` / `patterns` / `layouts`, plus `icons` / `assets`) OR a single app's `components/` tree; and (b) the **story location as it is**: colocated `*.stories.tsx` beside each component (the house standard) OR a separate `stories/<tier>/` tree (legacy). Enumerate coverage from what was actually found — a repo with either layout must still get a real coverage number. A separate tree is **drift, reported once as a single finding**, not re-flagged per story; migrating it is a refactor to propose, never a silent rewrite.
- **Enumerate components** — from the detected source of truth: walk tier barrel exports (resolving each `export * from "./x"` to its real component(s)) or, absent barrels, walk the components tree. Skip type-only (`*-types.ts`), defaults/config-only (`*-defaults.ts`), and internal non-user-facing helpers.
- **Enumerate stories** — list **every `*.stories.tsx`** in the detected story location; map each to the component it imports (ignore `_Template.stories.tsx`).
- **Report components with no story** — every enumerated component with **no matching story** is a coverage finding, grouped by tier.
- **Shipped-without-a-story** — flag any new/changed component in the diff whose story wasn't added/updated in the same change (a component isn't done until its story ships).
- **Orphan / mismatched stories** — flag a `*.stories.tsx` whose imported component no longer exists or was moved to another tier (dangling coverage).

### Story quality

- **CSF3 + TS** — object stories using `satisfies Meta<typeof X>` (not `: Meta`) with `type Story = StoryObj<typeof meta>`, and each story typed `: Story`; no CSF2 `Template.bind({})`, no untyped `export const X = {}`. Carve-out: multi-component or non-component story files (icon galleries, form compositions) may use a plain `Meta` annotation.
- **Title tier** — the meta `title` matches the component's tier (`Base/…`, `Blocks/…`, `Patterns/…`, `Layouts/…`). The title is what builds the sidebar, so it is the thing that must be right; the file's own location is checked once as a layout finding, not per story.
- **Subcategory taxonomy** — Blocks and Patterns share one closed, behaviour-based subcategory set: `Disclosure` / `Display` / `Feedback` / `Forms` / `Navigation` / `Overlay`. Flag subcategories outside the set; flag any subcategory under `Base/`, `Layouts/`, `Icons/`, or `Assets/` (a `Base/<Sub>/` title signals the component is really a Block); flag domain-named subcategories in a shared package (domain components belong in app feature folders); flag shape buckets like "Cards" (file by what a component displays or does, never by shape).
- **argTypes for every prop** — a control defined for **every public data prop** (`select` for unions, `boolean`, `text`, `{ type: "number", … }`); callbacks are `fn()` spies in `args` imported from `storybook/test` — flag the legacy `{ action: "…" }` argTypes pattern and any `@storybook/test` import (removed in Storybook 9/10); flag props with no control and controls for props that no longer exist.
- **Taxonomy present** — the fixed order present as applicable: `Default` (required props supplied), `Variants`, `Sizes`, `States` (disabled / loading / error + dark), `With*`, `AllVariants` / `AllSizes` via `render`.
- **Interactive stories use render/play** — stateful components drive state via `render` + hooks (not static `args`); user-flow stories script and assert via a `play` function where relevant.
- **`_Template` exists** — the Storybook app has a `_Template.stories.tsx` to scaffold from.
- **autodocs enabled** — the story (or global `preview`) sets `tags: ["autodocs"]` so the component is documented.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
