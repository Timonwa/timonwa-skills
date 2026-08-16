# timonwa-skills

The house standards for our Next.js App Router work, as Claude Code skills, commands, and agents.

Opinionated by design — where a choice was ours rather than the framework's, the item says so.

## Not all of it is ours

Where a vendor publishes a good official skill we use theirs rather than writing a worse one. It's vendored here so the whole toolkit installs from one place, and every vendored item credits its author in the item table with a link upstream — anything with no credit is ours.

| Source                                                              | What we take                                                   | Skills | Licence                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------- | -----: | ----------------------------- |
| [firebase/agent-skills](https://github.com/firebase/agent-skills)   | The official Firebase skills (auth, Firestore, rules, hosting) |     10 | Apache-2.0, per Google's repo |
| [cloudinary-devs/skills](https://github.com/cloudinary-devs/skills) | The official Cloudinary SDK and transformation skills          |      4 | MIT, per Cloudinary's repo    |
| [upstash/skills](https://github.com/upstash/skills)                 | Redis and Ratelimit for JS                                     |      2 | MIT, per Upstash's repo       |

**Unedited means unedited.** The only change is a `metadata.author` + `metadata.source` line, so `git diff` against a fresh upstream clone shows exactly what drifted, and re-vendoring is a copy rather than a merge.

To refresh a vendored set, re-clone upstream over `.claude/skills/<name>/`, re-apply the `author`/`source` lines, and rebuild — the diff tells you what changed.

## Install

```bash
/plugin marketplace add Timonwa/timonwa-skills
```

Install a bundle, or a single item:

```bash
/plugin install frontend-suite@timonwa-skills
/plugin install accessibility@timonwa-skills
```

Browse everything with `/plugin` → **Discover**.

## Start with `AGENTS.md`

Everything here holds a **portable standard**. Anything specific to one codebase — the palette values, the project ids, which Next flags are on, the component inventory, the deploy target — belongs in that repo's own `AGENTS.md`.

The split exists because no two projects are the same. Even ours disagree with each other — a different data store, a different auth setup, a different host, different Next config, and so on — so a standard that hardcoded any of that would already be wrong in the next repo of ours, let alone in yours.

So the first thing to run in a new repo is:

```bash
/scaffold-agents-md
```

It inspects the repo to fill in what it can detect, asks about the rest, and wires `CLAUDE.md` to import the result. Every standard and every audit reads that file for project facts — an audit with no `AGENTS.md` falls back to generic checks and will flag things that are deliberate in your codebase. It ships in every bundle for that reason.

## Bundles

Grouped by the job, not by the kind — a bundle carries whichever skills, commands, and agents that job needs. Exact membership lives in [groups.json](groups.json), which is the source of truth as the library grows.

Every bundle ships `scaffold-agents-md`, because everything else reads the file it writes:

```text
                     ┌───────────────────────────────────────┐
                     │              AGENTS.md                │
                     │  the project's facts — read first by  │
                     │  every standard and every audit       │
                     └───────────────────┬───────────────────┘
                                         │
   ┌───────────────┬──────────────┬──────┴───────┬───────────────┐
   ▼               ▼              ▼              ▼               ▼
┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐
│ BUILD IT │  │ REVIEW IT│  │  PLATFORM  │  │   WRITE IT   │  │ SHIP IT  │
├──────────┤  ├──────────┤  ├────────────┤  ├──────────────┤  ├──────────┤
│ frontend │  │ frontend │  │ firebase   │  │ content      │  │ workflow │
│  -suite  │  │ -audits  │  │  -suite    │  │  -suite      │  │  -suite  │
│          │  │          │  │            │  │              │  │          │
│ backend  │  │ backend  │  │ cloudinary │  │ docs, help   │  │ commit   │
│  -suite  │  │ -audits  │  │  -suite    │  │ centre,      │  │ PR review│
│          │  │          │  │            │  │ READMEs,     │  │ scaffold │
│ markup,  │  │ one audit│  │ the vendor │  │ copy editing,│  │ migrate  │
│ a11y, TS │  │ per      │  │ skills +   │  │ diagrams     │  │ changelog│
│ Tailwind │  │ domain,  │  │ our layer  │  │              │  │ standups │
│ SEO, API │  │ scored   │  │ on top     │  │              │  │          │
└────┬─────┘  └────┬─────┘  └─────┬──────┘  └──────┬───────┘  └────┬─────┘
     │             │              │                │               │
     └─────────────┴──────┬───────┴────────────────┴───────────────┘
                          │
      Build, then review the same domain — the audits are the mirror:
        frontend-suite  ↔  frontend-audits-suite
        backend-suite   ↔  backend-audits-suite
             any repo   →  workflow-suite (always useful)
```

| Bundle                  | For                                                                    |
| ----------------------- | ---------------------------------------------------------------------- |
| `frontend-suite`        | Building UI                                                            |
| `frontend-audits-suite` | Reviewing UI                                                           |
| `backend-suite`         | Building the API and server layer                                      |
| `backend-audits-suite`  | Reviewing it, plus security, environment, and docs                     |
| `firebase-suite`        | Firebase work — the official Google skills                             |
| `cloudinary-suite`      | Cloudinary work — the official Cloudinary skills                       |
| `workflow-suite`        | Committing, reviewing, scaffolding, migrating — the actions you invoke |
| `content-suite`         | Writing docs, help-centre guides, READMEs, and editing the prose       |
| `everything`            | The whole library in one install — instead of the above, not alongside |

**Install one shape or the other, never both.** A skill can belong to several bundles, which is what makes each bundle a complete kit — but an item reached two ways is _listed_ two ways. Install `everything` next to `workflow-suite` and `/stage-commit` shows up twice: once bare from the standalone plugin, once as `/workflow-suite:stage-commit`. Pick a level and stay there.

Claude Code has no native bundle concept — a plugin must physically contain its own files, and there is no wildcard or "install all" in the spec. So every bundle here is a real generated plugin with its members copied in, and `everything` is a group in [groups.json](groups.json) like any other. Its members are the one exception to hand-listing: `"skills": "*"` expands at build time to every publishable skill and command, so adding a skill never means remembering to add it here too. A curated suite keeps its explicit list, because there the list is the curation.

Frontend and backend each come as a pair: the standards to build against, and the audits that review the result. Install both halves of a domain, or both domains — a skill can belong to several bundles, so each one is a complete kit.

**Which do I install?** Working in a repo: the domain you're touching, plus `workflow-suite`. Reviewing someone's work: the audits half. Writing anything but code: `content-suite`.

## Everything in here

**Skills** load on their own when the work matches, so you rarely type them. **Commands** you invoke deliberately, and they stay unprefixed (`/frontend-audit`). **Agents** run as a delegated subagent with their own context.

This table is generated by `npm run build` — the one-line summaries live in [items.json](items.json).

<!-- BEGIN GENERATED ITEMS -->

| Item                                                                              | Kind    | Owns                                                                                      | By                                                      |
| --------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [accessibility](.claude/skills/accessibility)                                     | skill   | WCAG 2.2 AA via POUR, plus how to verify rather than assert it                            |                                                         |
| [accessibility-audit](.claude/commands/accessibility-audit.md)                    | command | WCAG 2.2 AA, keyboard, focus, contrast, ARIA                                              |                                                         |
| [api-audit](.claude/commands/api-audit.md)                                        | command | Thin handlers, validation at every boundary, pagination, rate-limit coverage              |                                                         |
| [api-docs](.claude/skills/api-docs)                                               | skill   | The OpenAPI registry — the handler is the source of truth, the spec its projection        |                                                         |
| [audit-all](.claude/commands/audit-all.md)                                        | command | Detects what applies, runs each audit, aggregates one report                              |                                                         |
| [backend](.claude/skills/backend)                                                 | skill   | Route→service→data layering, `.pick()` write schemas, RBAC guards, rate-limit tiers       |                                                         |
| [backend-security](.claude/skills/backend-security)                               | skill   | Server-side OWASP 2025 — BOLA/BFLA, injection, SSRF, sessions, resource limits            |                                                         |
| [branding](.claude/skills/branding)                                               | skill   | Brand voice and the product's own UI copy                                                 |                                                         |
| [changelog](.claude/skills/changelog)                                             | skill   | A CHANGELOG entry and release notes, drafted from changesets or commit history            |                                                         |
| [cloudinary-docs](.claude/skills/cloudinary-docs)                                 | skill   | Looks implementation detail up in the current Cloudinary docs                             | [cloudinary](https://github.com/cloudinary-devs/skills) |
| [cloudinary-next](.claude/skills/cloudinary-next)                                 | skill   | The `next-cloudinary` SDK — CldImage, upload widget, server actions                       | [cloudinary](https://github.com/cloudinary-devs/skills) |
| [cloudinary-react](.claude/skills/cloudinary-react)                               | skill   | The React SDK for Vite/CRA apps                                                           | [cloudinary](https://github.com/cloudinary-devs/skills) |
| [cloudinary-transformations](.claude/skills/cloudinary-transformations)           | skill   | Turning a described effect into a transformation URL                                      | [cloudinary](https://github.com/cloudinary-devs/skills) |
| [code-structure](.claude/skills/code-structure)                                   | skill   | Thin route and layout entries, the four `ui/` tiers, a flat kind-first `lib/`             |                                                         |
| [codebase-audit](.claude/commands/codebase-audit.md)                              | command | Repo-health triage — debt, dead code, strictness, coverage                                |                                                         |
| [community-triage](.claude/commands/community-triage.md)                          | command | Triages inbound issues and discussions into a prioritised, labelled queue                 |                                                         |
| [content-performance](.claude/commands/content-performance.md)                    | command | Turns an analytics export into a ranked list of content fixes                             |                                                         |
| [conventions-audit](.claude/commands/conventions-audit.md)                        | command | The repo against the `naming` and `code-structure` standards                              |                                                         |
| [daily-standup](.claude/commands/daily-standup.md)                                | command | Turns your GitHub activity into a standup update you can paste                            |                                                         |
| [dependency-audit](.claude/commands/dependency-audit.md)                          | command | Version drift, unused deps, the catalog, lockfile, advisories                             |                                                         |
| [design-system](.claude/skills/design-system)                                     | skill   | Governance — when a one-off earns a token                                                 |                                                         |
| [devops](.claude/skills/devops)                                                   | skill   | CI/CD, supply-chain hardening, env strategy, pre-commit gates                             |                                                         |
| [docs-audit](.claude/commands/docs-audit.md)                                      | command | Stale claims against the code, broken links, navigation integrity, README accuracy        |                                                         |
| [docs-standards](.claude/skills/docs-standards)                                   | skill   | Docs-site pages that stay true to source, one job each, and never break a link            |                                                         |
| [environment-audit](.claude/commands/environment-audit.md)                        | command | Zod-at-boot env, `.env.example` completeness, no secrets reaching the client              |                                                         |
| [extension-to-functions-codebase](.claude/skills/extension-to-functions-codebase) | skill   | Convert a Firebase Extension into a standalone Functions codebase                         | [Firebase](https://github.com/firebase/agent-skills)    |
| [field-encryption](.claude/skills/field-encryption)                               | skill   | AES-256-GCM field encryption, and the service-boundary decrypt pattern                    |                                                         |
| [firebase-ai-logic-basics](.claude/skills/firebase-ai-logic-basics)               | skill   | The Gemini API via Firebase AI Logic                                                      | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-app-hosting-basics](.claude/skills/firebase-app-hosting-basics)         | skill   | Deploying SSR apps on App Hosting                                                         | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-auth-basics](.claude/skills/firebase-auth-basics)                       | skill   | Firebase Authentication setup and usage                                                   | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-basics](.claude/skills/firebase-basics)                                 | skill   | The Firebase CLI — login, projects, config files                                          | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-data-connect-basics](.claude/skills/firebase-data-connect-basics)       | skill   | Firebase Data Connect with PostgreSQL                                                     | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-firestore](.claude/skills/firebase-firestore)                           | skill   | Firestore databases, modelling, indexes, and the SDKs                                     | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-hosting-basics](.claude/skills/firebase-hosting-basics)                 | skill   | Classic Firebase Hosting for static sites and SPAs                                        | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-remote-config-basics](.claude/skills/firebase-remote-config-basics)     | skill   | Remote Config templates and rollouts                                                      | [Firebase](https://github.com/firebase/agent-skills)    |
| [firebase-security-rules-auditor](.claude/skills/firebase-security-rules-auditor) | skill   | Red-teams Firestore and Storage rules                                                     | [Firebase](https://github.com/firebase/agent-skills)    |
| [frontend-audit](.claude/commands/frontend-audit.md)                              | command | App Router structure, boundaries, caching, React idioms                                   |                                                         |
| [frontend-design](.claude/skills/frontend-design)                                 | skill   | Design quality and distinctiveness, not the default component-library look                |                                                         |
| [frontend-security](.claude/skills/frontend-security)                             | skill   | Client-side OWASP 2025 — XSS, CSP, clickjacking, token storage                            |                                                         |
| [help-center-standards](.claude/skills/help-center-standards)                     | skill   | Help-centre guides for non-technical readers — answer first, jargon earned                |                                                         |
| [html-best-practices](.claude/skills/html-best-practices)                         | skill   | Element choice, headings, `<dl>`, tables, forms, media                                    |                                                         |
| [migrate-framework](.claude/skills/migrate-framework)                             | skill   | A gated framework or major-dependency migration, one verified step at a time              |                                                         |
| [naming](.claude/skills/naming)                                                   | skill   | The `<domain>.<kind>.ts` grammar, casing, assets, tokens                                  |                                                         |
| [nextjs-best-practices](.claude/skills/nextjs-best-practices)                     | skill   | Next 16 — Cache Components, `use cache`, Proxy, async `params`                            |                                                         |
| [performance-audit](.claude/commands/performance-audit.md)                        | command | Images, bundle weight, fonts, streaming, Core Web Vitals                                  |                                                         |
| [pr-review](.claude/skills/pr-review)                                             | skill   | Hunts bugs across many angles, verifies each before reporting, checks project conventions |                                                         |
| [prose-editing](.claude/skills/prose-editing)                                     | skill   | Focused editing passes over copy that already exists, plus an AI-tell sweep               |                                                         |
| [rbac-audit](.claude/commands/rbac-audit.md)                                      | command | Unprotected routes and actions, object- and function-level authorization gaps             |                                                         |
| [react-best-practices](.claude/skills/react-best-practices)                       | skill   | React 19 — `use()`, Actions, derive-don't-sync, no hand-memoization                       |                                                         |
| [readme-standards](.claude/skills/readme-standards)                               | skill   | One fixed README skeleton per repo type, applied the same way every time                  |                                                         |
| [reusables](.claude/skills/reusables)                                             | skill   | Components controllable entirely from the outside                                         |                                                         |
| [scaffold-agents-md](.claude/skills/scaffold-agents-md)                           | skill   | Writes the project's `AGENTS.md` — the facts everything else here reads                   |                                                         |
| [scaffold-feature](.claude/skills/scaffold-feature)                               | skill   | A new feature’s files in the right places, with the right imports, day one                |                                                         |
| [scaffold-monorepo](.claude/skills/scaffold-monorepo)                             | skill   | Adapts a starter into the pnpm + Turborepo workspace shell                                |                                                         |
| [scaffold-next-app](.claude/skills/scaffold-next-app)                             | skill   | Adapts a create-next-app starter into the house structure                                 |                                                         |
| [security-audit](.claude/commands/security-audit.md)                              | command | A red-team pass over whatever the app has — frontend, backend, or both                    |                                                         |
| [seo](.claude/skills/seo)                                                         | skill   | Metadata, structured data, robots, sitemaps, AEO/GEO                                      |                                                         |
| [seo-code-audit](.claude/commands/seo-code-audit.md)                              | command | Metadata, robots, sitemap, structured data, crawlability                                  |                                                         |
| [stage-commit](.claude/skills/stage-commit)                                       | skill   | Small Conventional Commits, one review-gated commit at a time                             |                                                         |
| [storybook-audit](.claude/commands/storybook-audit.md)                            | command | Story coverage against shared UI, and story quality                                       |                                                         |
| [storybook-setup](.claude/skills/storybook-setup)                                 | skill   | Init, the Storybook 9/10 addon landscape, colocated stories                               |                                                         |
| [storybook-story-writing](.claude/skills/storybook-story-writing)                 | skill   | CSF3 + `satisfies Meta`, tier titles, `fn()` spies                                        |                                                         |
| [svg-generation](.claude/skills/svg-generation)                                   | skill   | Clean, accessible, themeable SVG                                                          |                                                         |
| [sync-apps](.claude/skills/sync-apps)                                             | skill   | Finds drift in files that should match across sibling apps, and propagates the fix        |                                                         |
| [tailwind-css](.claude/skills/tailwind-css)                                       | skill   | Tailwind v4 CSS-first — the two-layer token system and the six CSS layers                 |                                                         |
| [turborepo-monorepo](.claude/skills/turborepo-monorepo)                           | skill   | pnpm workspaces + Turborepo v2 — task graph, caching, `--affected`                        |                                                         |
| [typescript-best-practices](.claude/skills/typescript-best-practices)             | skill   | Strict inference-first TS, Zod 4 as the source of truth                                   |                                                         |
| [upstash-ratelimit-js](.claude/skills/upstash-ratelimit-js)                       | skill   | The `@upstash/ratelimit` SDK                                                              | [Upstash](https://github.com/upstash/skills)            |
| [upstash-redis-js](.claude/skills/upstash-redis-js)                               | skill   | The `@upstash/redis` SDK                                                                  | [Upstash](https://github.com/upstash/skills)            |
| [vanilla-cookieconsent](.claude/skills/vanilla-cookieconsent)                     | skill   | GDPR consent as a state machine, separable from the library                               |                                                         |
| [writing-standards](.claude/skills/writing-standards)                             | skill   | The docs discipline — Diátaxis quadrants, audience, and the shared house voice            |                                                         |

<!-- END GENERATED ITEMS -->

Being added as they're moved over from our internal library: backend, Firebase, Cloudinary, and the audits for each.

## Reporting a problem

Open an issue for anything factually wrong. Most useful:

- **Stale or wrong** — an API that changed, a flag that was renamed, a version claim that no longer holds.
- **A security problem** — an unsafe snippet, a wrong header or policy, advice that would leave an app exposed.
- **Broken** — a dead link, a reference to something that isn't here, frontmatter that fails to load.
- **Contradictory** — two items that disagree, so an agent reading both can't act.

Include the item name and what you expected. A doc link or a reproduction makes it quick to confirm.

**Found something exploitable?** Report it privately — see [SECURITY.md](SECURITY.md). Don't open a public issue for it.

## Working on this repo

`plugins/` and `.claude-plugin/marketplace.json` are generated. Edit `.claude/skills/`, `.claude/commands/`, or `groups.json`, then:

```bash
npm run build
```

CI runs `npm run build:ci` (warnings are errors) and fails if the generated output isn't committed and current.

## License

[MIT](LICENSE)
