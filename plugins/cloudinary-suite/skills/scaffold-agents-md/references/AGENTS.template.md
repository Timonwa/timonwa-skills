<!--
AGENTS.md TEMPLATE — the single file that documents a project for AI agents. Fill every <placeholder>. Delete sections that genuinely don't apply (say "None" rather than leaving blank where a reviewer might expect a rule). House-style defaults (naming, commit rules, boundaries) are pre-filled — adjust only if this project differs. Wire it up: keep a root CLAUDE.md whose only content is `@AGENTS.md` so both Claude Code and other agents read the same source. Generic skills (e.g. pr-review) read these section headings — keep the headings intact. -->

# AGENTS.md — <Project Name>

<One sentence: what the product is and who it's for.>

## Tech Stack

- **Project type / tooling**: <single app, OR monorepo — e.g. pnpm 10.x workspaces + Turborepo>
- **Framework**: <e.g. Next.js 16 (App Router)>
- **Language**: <e.g. TypeScript 5.x strict, React 19>
- **Rendering**: <e.g. Server Components by default; `"use client"` only for hooks/browser APIs>
- **Styling**: <e.g. Tailwind CSS v4 — `ui:` prefix in `packages/ui` only, plain classes in apps>
- **Validation**: <e.g. Zod schemas in `@app/schemas`>
- **Auth**: <e.g. Firebase Auth / REST token-based / NextAuth>
- **Data store**: <e.g. Firestore / Postgres / Supabase>
- **Code quality**: <e.g. Biome (format), ESLint (lint), commitlint>

Language / framework standards (bucket A — enforced everywhere, detail in the named skills):

- **TypeScript** — strict, inference-first; no `any` / unsafe casts; Zod as the source of truth (`typescript-best-practices`).
- **React** (where used) — derive-don't-sync (you-might-not-need-an-effect), React 19 idioms, let the React Compiler memoize (`react-best-practices`).
- **Next.js** (where used) — App Router mechanics: Server Components + `use client` boundary, data fetching, caching, Server Actions, Metadata, Route Handlers, Proxy (`nextjs-best-practices`).
- **UI & design** — every screen built from one design system, no one-offs; tokens/theming via `tailwind-css`, cohesion/governance via `design-system`, design quality/distinctiveness (original, not library-default) via `frontend-design`, semantic markup via `html-best-practices`, a11y via `accessibility`; hand-authored vectors via `svg-generation`.
- **Brand & copy** — the app's brand identity, voice & tone, and product/UI copy (buttons, empty/error/success/loading, microcopy, logo usage) via `branding`; the project's palette, voice traits, and logo location live in this file (see Brand & Voice below).
- **Monorepo** (where applicable) — pnpm workspaces + Turborepo (tasks/caching, shared config packages, catalog) via `turborepo-monorepo`.
- **Firebase** (where used) — house access boundary (only auth/data modules touch Firebase), sign-in→session-cookie auth, Firestore in the service layer, least-privilege rules via `firebase`; product mechanics via the official `firebase-*` skills. Project ids/collections/host → this file.
- **Backend / API** (where there's an API or route-handler layer) — thin route handlers over a service layer, build order schema→service→route, RBAC guards, rate limiting, typed errors + shared response builders, cursor pagination via `backend`. Single apps mutate via Server Actions (`nextjs-best-practices`) instead.
- **Redis** (where used) — key builders + `domain:action` grammar, per-namespace TTLs, fail-open caches vs fail-closed rate limits/locks/dedup, lock TTL sizing, Upstash REST batching via `redis-patterns`; review via `redis-audit`. Instance names/creds per env → this file.
- **DevOps** — CI/CD (GitHub Actions job graph + composite setup action + affected checks + SHA-pinned/least-privilege hardening), testing + perf gates (Playwright E2E + size-limit/Lighthouse budgets against the preview), pre-commit hooks (husky/lint-staged/commitlint), security headers, env strategy (Zod-at-boot, runtime config, secrets), quality gates (CODEOWNERS, deployment environments), deploy per env via `devops`.
- **Security** — split by side, mapped to OWASP Top 10 2025 + API Security Top 10 2023. Client-side (XSS/DOMPurify, strict nonce Content Security Policy (CSP), clickjacking/`postMessage`/iframe isolation, no secrets in the bundle, httpOnly-cookie tokens, open redirects) via `frontend-security`; server-side (authz Broken Object-Level Authorization (BOLA)/Broken Function-Level Authorization (BFLA)/Broken Object-Property-Level Authorization (BOPLA), auth/sessions, injection, Server-Side Request Forgery (SSRF), resource limits, secrets, fail-closed errors) via `backend-security`. A full review is the manual `security-audit` skill; Firestore/Storage rules → `firebase-security-rules-auditor`.
- **Docs & writing** (where the project has docs) — developer docs discipline via `technical-writing`; docs-site pages via `docs-site-authoring`; READMEs via `readme-writer` (tutorial repos → `tutorial-readme-writer`); the OpenAPI registry via `api-docs`; article/blog writing via `technical-article`.
- **Audits** (manually invoked, on request) — the `audits-suite` has one red-team audit per domain (`accessibility-audit`, `seo-audit`, `storybook-audit`, `conventions-audit`, `dependency-audit`, `docs-audit`, `environment-audit`, `frontend-audit`, `performance-audit`, `api-audit`, `rbac-audit`, `firestore-audit`, `redis-audit`, `codebase-audit`, `security-audit`), each writing a phase-aware scored report to `_reports/`; run them all via `audit-all`. Record this project's audit phase (`development` / `production`) below if used.

## Repository Structure

<!-- Fill the tree for THIS project. Single app: the src/ layout. Monorepo: apps/ + packages/. -->

```txt
one line per meaningful dir — e.g. app/ (thin routes), src/components, src/lib (single app); or apps/*, packages/* (monorepo)
```

Conventions (full detail in the `code-structure` skill):

- **Pages** are feature-grouped, section-based: the route/entry file is thin (imports a composed `…PageContent`); sections are one-per-file with named exports; `index.tsx` composes them. **`layout.tsx` is thin too** — it renders a shell from `ui/layouts/`; only a guard stays in the route file.
- **`components/`** holds only `.tsx` and **mirrors the route groups**, one folder per group and one per page. `ui/` = generic primitives **tiered** `base/ blocks/ patterns/ layouts/`, **one folder per component** (component + story + barrel, and a test only where there is behaviour); `_shared/` = cross-feature but app-specific; `errors/` = the framework boundaries. Shared UI/hooks/utils are self-contained and prop-driven (see the `reusables` skill).
- **`lib/`** is **kind-first and flat inside each kind** — `config/ constants/ data/ hooks/ types/ utils/`; the domain is a filename prefix (`auth.constant.ts`, `nav.type.ts`, `string.utils.ts`), never a subfolder. `config/` keeps bare names. Each kind has a barrel listing **one explicit export per file** (`@/lib/<kind>`); no loose files at the root, and no empty kind.
- **Server-only code** lives behind a single **`lib/server/`** boundary (own barrel, `server-only`) with the same flat kinds — `actions/ cache/ clients/ data/ services/ utils/`. That barrel exports `actions`, `cache`, and `services` only; `clients/`, `data/`, and `utils/` are called by the layers above them. Never shares a barrel with client code.
- Path alias `@/*`. Monorepo: shared kinds are `packages/*` (`@app/<kind>`); each app/package may have its own AGENTS.md (closest file wins).
- This structure is applied day-zero on top of the official framework starter by `scaffold-next-app` (one app or package; the workspace shell around it by `scaffold-monorepo`) and extended per feature by `scaffold-feature` — use them rather than hand-placing new folders.

## Setup & Commands

Package manager: **<pnpm | npm | yarn | bun>** (lockfile: `<pnpm-lock.yaml>`).

```bash
<install>          # install deps
<dev>              # run locally
<build>            # build
<typecheck>        # type check   — used by pr-review to verify fixes
<lint>             # lint
<format>           # format
<test>             # test (or "no tests")
```

Before committing: `<lint && typecheck && format:check>`.

## Git

- **Default / base branch**: `<main | dev>` (what PRs target and diffs compare against).
- **Branch naming**: <e.g. `type/short-description`>.
- **Protected branches** (never push directly): <main, dev, staging, prod>.

## Naming Conventions

| What                                   | Convention                    | Example                                      |
| -------------------------------------- | ----------------------------- | -------------------------------------------- |
| Component props                        | `Props` suffix                | `ButtonProps`                                |
| Zod schema (the value)                 | `Schema` suffix               | `UserSchema`                                 |
| Inferred / domain / union type         | clean PascalCase, no suffix   | `User`, `EventStatus`                        |
| Constants (incl. `as const`)           | `UPPER_SNAKE_CASE`            | `EVENT_STATUSES`                             |
| Components                             | PascalCase                    | `SearchInput`, `DataTable`                   |
| Component / story files                | PascalCase (match the export) | `SearchInput.tsx`, `SearchInput.stories.tsx` |
| All other files (hooks, utils, config) | kebab-case                    | `use-debounce.ts`, `format-date.ts`          |
| Page components                        | `PageContent` suffix          | `HomePageContent`                            |

**Identifiers** — names say what they do and what they own: functions are verb-first (`get` sync/local, `fetch` async/remote, `create`/`update`/`delete`, `build`, `format`/`<x>To<y>`, `parse`, `handle*` for handlers, `on*` for callback props); hooks are `use*`; booleans read as assertions (`is`/`has`/`can`/`should`); a feature-local symbol carries that feature's prefix, shared ones stay bare. No vague (`data`/`temp`) or cryptic (`btn`) names; file name = export name = usage (never rename on import). Full standard (env vars, route segments, cache tags, branches, assets): the `naming` skill.

Import order: React first, then external packages, then internal (path-aliased, e.g. `@/*` or `@app/*`), then relative.

## Styling

<Tailwind version and rules; `ui:` prefix scope; design tokens; dark-mode approach; where global styles live.>

## Routing

<App Router vs Pages Router. The route groups and which carry a URL prefix. Where route paths and API endpoints are defined (`config/routes.ts`, `config/endpoints.ts`) — paths must come from there, never hardcoded. URL/env usage (`env.NEXT_PUBLIC_*`).>

## Data Fetching

<Client-side vs server-side. The exact helpers/hooks to use (e.g. `serverFetch`/`publicFetch`, or `useFetch`/`useAuthedFetch`). What is banned (e.g. raw `fetch`/`axios` in components, re-implemented fetch hooks).>

## Mutations

<Server Actions (where they live) vs a mutation hook (e.g. `useMutate` + `invalidateKeys`). Input validation via `@app/schemas`.>

## Caching

<Next.js only. Is **Cache Components** on (`cacheComponents: true` in `next.config`)? If so: `use cache` readers in `lib/server/services/` with a `cacheLife` tier + `cacheTag(CACHE_TAGS.x)`, and on-demand `updateTag`/`revalidateTag` after mutations. The standard `cacheLife` tiers are `realtime`/`frequent`/`daily`/`static` — record any per-project value overrides here. If the flag is off, the previous model applies (`fetch` cache options + React `cache()` dedup; no `unstable_cache`). Full standard: `nextjs-best-practices` + its `references/caching.md`. Or "None".>

## Brand & Voice

<The project's brand specifics (the `branding` skill holds the how-to). Voice traits (e.g. clear-over-clever, helpful, confident-not-arrogant), tone, capitalization policy (sentence vs title case), key vocabulary (one term per concept), and the logo asset location. Palette/fonts come from the design tokens (see Styling). Or "None" for an internal tool with no brand.>

## SEO

<Public-facing sites. House SEO implementation — a `siteConfig`, a `buildMetadata` helper, `PUBLIC_SEO`/`NOINDEX_SEO` catalogs, a `<JsonLd>` component + schema builders, and env-gated `robots`/`sitemap`; full standard in the `seo` skill. Record here the project's site name/url, the default OG-image approach, and which routes are noindex. Or "None" for a private/internal app.>

## DevRel

<Only for repos where DevRel work happens (community triage, standups, blog/social writing) — the `community-triage`, `daily-standup`, `technical-article`, and `developer-social` skills read these instead of asking each run. Record: the GitHub handle, the GitHub org(s) to monitor, the standup destination (e.g. a Discord channel), the blog/publication name + base URL, and any community link (+ author name/pronouns for third-person posts). Or "None".>

## Auth & RBAC

<Auth flow and the hooks/helpers for it (never raw endpoint calls). How privileged actions are gated (e.g. `can()` / `usePermission`). Requirement: new API routes have auth guards + permission checks.>

## Security

<The project's security specifics (`frontend-security` + `backend-security` hold the how-to). Frontend — where the CSP is defined + its rollout state (report-only vs enforced), the CORS + `postMessage` origin allowlists, third-party scripts/embeds and how they're isolated, where the session token lives (httpOnly cookie) and confirmation nothing sensitive is in `NEXT_PUBLIC_*` / `localStorage`, framing policy. Backend — the authz model (object/function/field level) and where guards live, rate-limit tiers, SSRF outbound allowlists, secrets store. Rules review → `firebase-security-rules-auditor`. If the app has a cookie banner (`vanilla-cookieconsent`): the current consent revision, categories + vendors, and the consent cookie domain. Or "None" for a trivial internal tool.>

## Backend / API

<Only if there's an API / route-handler layer (the `backend` skill holds the how-to). Record: dedicated API app vs Server Actions in one app; the response envelope shape; the rate-limit tiers in use (AUTH / SENSITIVE / WRITE / READ / PUBLIC) and any project overrides; where the OpenAPI registry lives; the cron dispatcher route + schedule; where audit-log action types are registered. If Redis is used (`redis-patterns` holds the how-to): the key-builder + TTL-constants module paths, namespaces in use, and any per-namespace TTL or budget overrides. If feature flags are used (`feature-flags`): the flag store/collection, the flag-name union module, cache TTL overrides, and the reconciler cadence. If fields are encrypted (`field-encryption`): which fields, and the key env var name per environment. If a maintenance mode exists (`maintenance-mode`): the flag name, exempt-path list, bypass cookie name, and the bypass-token env var. Or "None" (frontend-only project).>

## Data Store (Firebase / other)

<Only for full-stack apps (the `firebase` skill holds the how-to). Record: project ids per env, collection names (or the collections module path), bucket names + access level, the session-cookie name + root cookie domain, chosen host (App Hosting / Vercel / other), emulator ports, and which TTL/retention constants module applies. If images are handled (`image-handling`): the caps constants module, slot paths, and the worker function name. If Cloudinary is used (`cloudinary`): the cloud name per env, folder scheme, and which shape (delivery-only vs full pipeline). Or "None".>

## Monorepo / Workspace

<Only for monorepos (the `turborepo-monorepo` skill holds the how-to). Record: the `@org/*` scope, which apps exist and their ports, which shared packages exist, whether the pnpm catalog is used, whether there's a `functions/*` tier, and any turbo task-name deviations. Or "None" (single app).>

## CI/CD & Deploy

<The `devops` skill holds the how-to. Record: the workflow files and what each gates, deploy targets/hosts per app + per env, whether auto-rollout is disabled (monorepo default: yes — deploy specific commits), secret names per environment, and the health-check endpoint used post-deploy. Or "None".>

## Env Vars

<Naming (e.g. `NEXT_PUBLIC_*` for client). Must be added to `.env.example` for the relevant app(s). Where they're validated (e.g. `src/config/env.ts`). The tier switch (`APP_ENV`) values and the port-per-app table if a monorepo.>

## i18n

<Where translation keys live (e.g. `src/i18n/` + `public/locales/`); user-facing copy uses keys, not hardcoded strings. Or "None".>

## Testing & Stories

- **Tests** — <what's required: tests for new shared functions / API routes — or "None">.
- **Storybook** (where the project uses it) — stories are CSF3 + TS (`satisfies Meta`), **tiered** to match `components/ui` (`Base/…`, `Blocks/…`), with `argTypes` for every prop, and **a component's story ships in the same change**. See the `storybook-setup` / `storybook-story-writing` skills. Or "None" if the project has no Storybook.

## Commit Messages

Conventional Commits — the library standard, used in every project (enforce with commitlint):

```txt
type(scope): subject
```

- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Scopes**: <app/package names>
- Subject: lowercase, imperative, no trailing period, ≤ 100 chars
- Staged, per-group review-gated commits via the `stage-commit` skill.

## PR Guidelines

- Title follows conventional-commit format
- PR template: `<.github/pull_request_template.md>`
- Run `<lint && typecheck && format:check>` before submitting

## Boundaries

### Never

- Commit or push without explicit permission
- Commit secrets, `.env*`, or service-account keys
- Delete or disable failing tests — fix them
- Push directly to protected branches
- Hand-edit the lockfile; use `<pnpm> install` (not a different package manager)
- Disable TypeScript strict mode or linter rules
- Remove existing comments unless factually wrong

### Always

- Run quality checks before committing
- Validate inputs with Zod schemas from `<@app/schemas>`
- <project-specific "always" rules>

## Documentation

<Where deeper guides live (e.g. `_docs/` / `docs/`), with a pointer to the index. The folder standard (numbered folders, filename grammar, doc templates) is the `project-docs` skill. Rule: project docs hold **project facts and provisioning recipes only** — a generic standard is linked to its skill, never restated (restating = future drift).>

## Troubleshooting

- <common issue → fix>
