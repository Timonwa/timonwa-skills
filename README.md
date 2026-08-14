# timonwa-skills

Claude Code skills and commands for Next.js App Router projects — the ones I use on my own work, published as-is.

These are not neutral tutorials. They encode decisions: where files go, what a component's folder looks like, which Tailwind layer a rule belongs in. Where a choice was mine rather than the framework's, the skill says so. Read them as "here is one team's answer, and why".

## Install

```bash
/plugin marketplace add Timonwa/timonwa-skills
```

Then install a bundle:

```bash
/plugin install frontend-and-audits@timonwa-skills
```

…or a single skill:

```bash
/plugin install accessibility@timonwa-skills
```

Browse everything with `/plugin` → **Discover**.

## Bundles

Install one of these and get its whole set in one go. A skill can belong to more than one bundle, so every bundle is a complete kit — you never have to add a missing piece by hand.

| Bundle                | What you get                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `frontend-suite`      | The 20 standards below — markup, a11y, React/Next/TS, Tailwind, structure, naming, CI     |
| `audits-suite`        | The 9 audits below — one per domain, plus `/audit-all` to run every applicable one        |
| `frontend-and-audits` | Both, for when you want the standards to build against and the audits to check the result |

## Standards

Skills. Claude loads them on its own when the work matches, so you rarely invoke them by hand.

| Skill                                                                 | Owns                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [accessibility](.claude/skills/accessibility)                         | WCAG 2.2 AA via POUR, plus how to verify rather than assert it                |
| [branding](.claude/skills/branding)                                   | Brand voice and the product's own UI copy                                     |
| [code-structure](.claude/skills/code-structure)                       | Thin route and layout entries, the four `ui/` tiers, a flat kind-first `lib/` |
| [design-system](.claude/skills/design-system)                         | Governance — when a one-off earns a token                                     |
| [devops](.claude/skills/devops)                                       | CI/CD, supply-chain hardening, env strategy, pre-commit gates                 |
| [frontend-design](.claude/skills/frontend-design)                     | Design quality and distinctiveness, not the default component-library look    |
| [frontend-security](.claude/skills/frontend-security)                 | Client-side OWASP 2025 — XSS, CSP, clickjacking, token storage                |
| [html-best-practices](.claude/skills/html-best-practices)             | Element choice, headings, `<dl>`, tables, forms, media                        |
| [naming](.claude/skills/naming)                                       | The `<domain>.<kind>.ts` grammar, casing, assets, tokens                      |
| [nextjs-best-practices](.claude/skills/nextjs-best-practices)         | Next 16 — Cache Components, `use cache`, Proxy, async `params`                |
| [react-best-practices](.claude/skills/react-best-practices)           | React 19 — `use()`, Actions, derive-don't-sync, no hand-memoization           |
| [reusables](.claude/skills/reusables)                                 | Components controllable entirely from the outside                             |
| [seo](.claude/skills/seo)                                             | Metadata, structured data, robots, sitemaps, AEO/GEO                          |
| [storybook-setup](.claude/skills/storybook-setup)                     | Init, the Storybook 9/10 addon landscape, colocated stories                   |
| [storybook-story-writing](.claude/skills/storybook-story-writing)     | CSF3 + `satisfies Meta`, tier titles, `fn()` spies                            |
| [svg-generation](.claude/skills/svg-generation)                       | Clean, accessible, themeable SVG                                              |
| [tailwind-css](.claude/skills/tailwind-css)                           | Tailwind v4 CSS-first — the two-layer token system and the six CSS layers     |
| [turborepo-monorepo](.claude/skills/turborepo-monorepo)               | pnpm workspaces + Turborepo v2 — task graph, caching, `--affected`            |
| [typescript-best-practices](.claude/skills/typescript-best-practices) | Strict inference-first TS, Zod 4 as the source of truth                       |
| [vanilla-cookieconsent](.claude/skills/vanilla-cookieconsent)         | GDPR consent as a state machine, separable from the library                   |

## Audits

Commands you invoke deliberately. Each is self-contained, verifies every finding against the real code, and writes a scored report to `_reports/`.

| Command                | Reviews                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `/accessibility-audit` | WCAG 2.2 AA, keyboard, focus, contrast, ARIA                  |
| `/audit-all`           | Detects what applies, runs each audit, aggregates one report  |
| `/codebase-audit`      | Repo-health triage — debt, dead code, strictness, coverage    |
| `/conventions-audit`   | The repo against the `naming` and `code-structure` standards  |
| `/dependency-audit`    | Version drift, unused deps, the catalog, lockfile, advisories |
| `/frontend-audit`      | App Router structure, boundaries, caching, React idioms       |
| `/performance-audit`   | Images, bundle weight, fonts, streaming, Core Web Vitals      |
| `/seo-audit`           | Metadata, robots, sitemap, structured data, crawlability      |
| `/storybook-audit`     | Story coverage against shared UI, and story quality           |

## Skills and commands

Both forms take the same frontmatter. The difference is how they're invoked and whether they can carry supporting files:

- A **skill** ships in a folder, can hold `references/`, and Claude loads it on its own when the work matches. From a plugin it's namespaced — `/frontend-suite:accessibility`.
- A **command** is one file, always invoked by you, and stays bare — `/frontend-audit`, never `/audits-suite:frontend-audit`.

That's why every standard here is a skill and every audit is a command.

## Project facts stay in your repo

A skill holds the portable standard. Anything specific to one codebase — the palette values, the project ids, which Next flags are on, the actual component inventory — belongs in that repo's own `AGENTS.md`, not in a skill. The skills say so where it matters, so installing them never assumes your project looks like mine.

## Reporting a problem

Open an issue for anything factually wrong. Most useful:

- **Stale or wrong** — an API that changed, a flag that was renamed, a version claim that no longer holds.
- **A security problem** — a snippet that is unsafe, a header or policy that is wrong, advice that would leave an app exposed.
- **Broken** — a dead link, a skill referencing one that isn't here, frontmatter that fails to load.
- **Contradictory** — two skills that disagree, so an agent reading both can't act.

Include the skill name and what you expected. A reproduction or a doc link makes it quick to confirm.

## License

[MIT](LICENSE)
