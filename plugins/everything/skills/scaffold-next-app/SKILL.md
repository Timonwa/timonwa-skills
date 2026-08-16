---
name: scaffold-next-app
description: >-
  Adapt an already-created `create-next-app` starter into the house structure for ONE Next.js app — the route groups and their shells, `components/` mirroring them, the four `ui/` tiers folder-per-component, seven kind-first `lib/` folders plus six more behind the `lib/server` boundary, the CSS token layers, boot-time env validation, and Storybook. Use when the user asks to scaffold a Next.js app, set up this project, apply house structure, restructure this starter, bootstrap the app, or start a new next app — and with `--add`, to wire a new integration (Cloudinary, Redis, feature flags, a kill switch, consent, MDX, mail) into an app this skill already shaped. Next.js only — Astro sites, React/Vite apps, and shared library packages get their own skills. Interviews first in grouped batches, then presents one CREATE / EDIT / MOVE / DELETE manifest for approval — it edits the files the starter owns instead of overwriting them, never pins framework or dependency versions the starter already chose, and never installs, runs git, or commits on its own.
argument-hint: "[app path] [--add] — e.g. `apps/web`; omit for the current directory"
allowed-tools: Read, Grep, Glob, Write, Edit, AskUserQuestion, Bash(ls:*), Bash(mkdir:*), Bash(mv:*), Bash(rm:*), Bash(cat:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git mv:*), Bash(npm view:*), Bash(pnpm:*), Bash(yarn:*), Bash(npx:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Scaffold app

Takes an app the framework's own scaffolder just created and turns it into a house-standard app — the route groups and their shells, `components/` mirroring them, the four `ui/` tiers folder-per-component, seven kind-first `lib/` folders plus six more behind the `lib/server` boundary, the six CSS layers behind one entry, Zod-at-boot env validation, Storybook, and one real component per tier to prove the wiring end to end.

**This is an adapter, not a generator.** The owner runs the official scaffolder first, so the framework's own template supplies the versions, the framework config, and the current defaults — we inherit those instead of shipping a stale pinned copy of them. This skill supplies only the _structure_, and it does so by **editing** what the starter created, never by overwriting it.

Scope is **one app or one package**. The workspace shell around it — `pnpm-workspace.yaml`, `turbo.json`, the catalog, shared `packages/*`, root CI and hooks — belongs to `scaffold-monorepo`, which delegates to this skill for each app under `apps/*`.

## Arguments

- `[app path]` — the app or package directory to adapt, relative to the repo root. Omitted → the current directory, or the single `apps/*` entry if there is exactly one.
- `--add` — skip detection's first-run/add-run guess and go straight to add-run: the app is already house-shaped, so ask only which integrations to add. Detection still runs, and a missing house marker is reported rather than assumed away.

## Guardrails — read first

- **Never generate a project from an empty directory.** If there is no starter (no `package.json`, or one with no `next` dependency), print `pnpm create next-app@latest` with the flags from Step 0 and **stop**.
- **Never overwrite a file the starter provided — EDIT it.** `package.json`, `tsconfig.json`, `next.config.ts`, `globals.css`, `layout.tsx`, `.gitignore`, `postcss.config.mjs`, `eslint.config.mjs` and friends already exist and already hold decisions worth keeping. Use `Edit` on them; `Write` is only for paths that do not exist yet.
- **Never pin a framework or dependency version.** The starter resolved its own versions; adding a pinned range downgrades or conflicts with them. Resolve a version from the registry (`npm view <pkg> version`) **only** for a genuinely new dependency, and prefer letting the package manager resolve `latest` at install time.
- **One manifest, one approval.** Present the complete CREATE / EDIT / MOVE / DELETE list and wait. That approval covers exactly that manifest — nothing added silently afterwards, and every deletion is an explicit, approved DELETE line.
- **Deletions are the starter's demo cruft only** — the default page body, the logo SVGs in `public/`, the boilerplate `README.md`, the default favicon when the project has its own. Never a config file, never anything the user wrote.
- **The skill is the standard.** Where the starter's layout conflicts with the house layout, **restructure it and say so in the manifest**. Never "match what the starter shipped", never "follow the nearest sibling" — the starter's choices we keep are versions and framework config; the structure comes from the owning skills below.
- **No installs or git without approval.** Never run `pnpm install`, `pnpm add`, `storybook init`, `git init`, `git add`, `git commit`, or `git push` unprompted — propose the exact command and wait. **Never commits.**
- **Skeleton only, no project facts.** Placeholder copy and `// TODO:` markers. Never a real domain, project id, client name, secret, or business rule — those are project facts for `AGENTS.md`.
- **No folder the answers did not earn.** Every conditional line in the tree names its trigger; create it only when that answer came back yes. An empty kind or an unused integration folder is a wrong guess the next reader has to undo.

## Owning skills — the source of every structural decision

| Part of the app                                                              | Owning skill                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Folder tree, thin route entries, kind-first `lib/`, the `lib/server` barrier | `code-structure`                                             |
| Every file and folder name, the casing, the `<domain>.<kind>.ts` suffixes    | `naming`                                                     |
| `tsconfig` flags, schema layout, inferred types                              | `typescript-best-practices`                                  |
| CSS entry order, token layers, `@theme inline`, the `ui:` prefix             | `tailwind-css`                                               |
| The four tiers, folder-per-component, what belongs in each                   | `code-structure` + `design-system`                           |
| Each example component's prop surface and purity                             | `reusables`                                                  |
| `.storybook/`, the addon list, the stories glob                              | `storybook-setup`                                            |
| The story itself                                                             | `storybook-story-writing`                                    |
| Env-at-boot, `.env.example`, CI workflow, hooks (standalone only)            | `devops`                                                     |
| Route handler → service layering, guards, response builders                  | `backend`                                                    |
| Framework flags (`cacheComponents`, `cacheLife`, `typedRoutes`), headers     | `nextjs-best-practices`                                      |
| Firebase wiring — only when the answers say Firebase                         | `firebase-firestore`, `firebase-auth-basics`, `firebase`     |
| Semantic markup and a11y of the skeleton it writes                           | `html-best-practices`, `accessibility`                       |
| Redis primitives — keys, locks, dedup, TTL presets                           | `upstash-redis-js`, `redis-patterns`                         |
| Image delivery and the upload pipeline                                       | `cloudinary-next`, `cloudinary`, `image-handling`            |
| Runtime toggles — flags, kill switch, consent                                | `vanilla-cookieconsent`, `feature-flags`, `maintenance-mode` |

Where a row lists more than one, the earlier entries are the vendor's own official skills and the later ones are the house layer on top. **An integration this skill can wire is not gated on the owning skill being installed** — it writes the folder and a `// TODO:`, and names the skill to consult. If that skill isn't present, the structure is still right and the note tells you what to read.

File contents and the exact edits live in [references/templates.md](references/templates.md).

## The target tree

The full annotated tree — every folder and file, each line saying what it is and, where conditional, what turns it on — is [references/target-tree.md](references/target-tree.md). **Read it before planning the manifest**; it is the specification this command executes, and the rules behind its shape live in `code-structure`.

## Step 0 — Detect the starter, or stop

Read, don't assume:

- `ls -a` the target directory, then read its `package.json` — confirm a `next` dependency and note the version, the lockfile (`pnpm-lock.yaml` / `yarn.lock`), and the scripts the starter defined. A non-Next starter is out of scope: say so and stop.
- Read `next.config.*` and locate the route directory — `app/` at the root **or** `src/app/`. A `pages/` directory means the Pages Router; this skill targets the App Router, so flag it and stop.
- **Monorepo or standalone?** Walk up for `pnpm-workspace.yaml` with a `packages:` list, a `workspaces` field, or `turbo.json`. Found → the ROOT owns CI, hooks, commitlint, and the shared config packages; **do not create them here**, and consume the shared `typescript-config`, `tailwind-config`, `ui`, and `schemas` packages instead of writing local copies (`scaffold-monorepo` owns all of it). A lone settings-only `pnpm-workspace.yaml` with no `packages:` list is **standalone**.
- Note what the starter already gave you, because it changes the manifest: current `create-next-app` ships `AGENTS.md` + `CLAUDE.md` by default (`--agents-md`), a Tailwind v4 `globals.css` with an inline `@theme` block, `eslint.config.mjs` or `biome.json`, and demo SVGs in `public/`.
- **First run or add-run?** Check for three house markers: `src/lib/config/env.ts`, all four `src/components/ui/` tiers, and `src/styles/tokens.css`. **All three present → add-run**: the structure is already applied, so skip Batches 1-2, jump to the add-run interview below, and manifest only what the new answers earn. Say which markers you found, so the owner can correct you before anything is planned. Partial markers mean an interrupted first run — list what is missing and treat it as a first run.

**No starter present** → print the right command, stop, and offer to re-run after:

```bash
pnpm create next-app@latest --ts --tailwind --app --src-dir --import-alias "@/*" --biome
```

`--src-dir` matters: it puts `app/` inside `src/`, which is where the house standard wants it, so the manifest has no MOVE step. Verify every flag against `--help` before promising it — the generator's flags change between majors.

## Step 1 — The interview (before anything is planned)

Ask with `AskUserQuestion` in **grouped batches of at most 4**, every option carrying a default. Pre-fill from Step 0's detection and ask to _confirm_, never blind. Each answer switches specific tree lines on or off — the tree marks which.

**Batch 1 — shape**

1. **Package manager** — `pnpm` (house default) · `yarn`. Default = whatever lockfile the starter produced; if that is npm's, propose switching to pnpm and say so.
2. **Router + layout** — confirm what was detected: App Router, and whether `app/` already sits inside `src/`.
3. **Backend layer** — none, Server Actions only (default) · route handlers in this app · this app talks to a separate API. Decides whether `app/api/` and `lib/server/data/` exist at all.
4. **Data store / auth** — none (default) · Firebase · Postgres or Supabase · other. Turns on `clients/firebase/`, `data/collections.data.ts`, and `firebase-date.utils.ts`; cross-refs `firebase`.

**Batch 2 — tooling and repo**

1. **Storybook** — yes (default) · no.
2. **Testing** — none (default) · Vitest unit · Playwright E2E · both. Decides `vitest.config.ts`, `playwright.config.ts`, and whether any `*.test.tsx` is written.
3. **CI + git hooks** — **ask only when standalone**; in a monorepo the root owns them, so state that instead of asking. Default when standalone = yes to both.
4. **Repo visibility** — private (default) · public. Public adds `LICENSE`, `SECURITY.md`, and `CONTRIBUTING.md`, and makes the README audience external.

**Batch 3 — integrations** (multi-select where noted; every default is off)

1. **Image delivery** — none (default) · Cloudinary · the store's own CDN. Cloudinary turns on `clients/cloudinary/` and `cloudinary.utils.ts` (→ `cloudinary`); either with uploads turns on `upload.utils.ts` and `image.utils.ts` (→ `image-handling`).
2. **Shared cache / rate limiting** — no (default) · yes. Turns on the whole `clients/redis/` folder (→ `redis-patterns`), and is a prerequisite for anything distributed — locks, webhook dedup, rate-limit tiers.
3. **Runtime toggles** (multi-select) — feature flags (→ `feature-flags`) · a maintenance kill switch (→ `maintenance-mode`, adds `maintenance.utils.ts`) · cookie consent (→ `vanilla-cookieconsent`, adds `cookieconsent.utils.ts`).
4. **Content and extras** (multi-select) — the app ships prose/MDX (adds `src/content/` + `mdx-loader.utils.ts`) · transactional mail (adds `clients/email/`) · field encryption (adds `encryption.utils.ts`, → `field-encryption`) · SEO helpers beyond the defaults (→ `seo`).

Every selection adds only its **wiring stub plus a pointer to the owning skill** — never that skill's full implementation. Record every answer verbatim: they are the project facts `scaffold-agents-md` writes into `AGENTS.md` in Step 11.

**Add-run interview** (Step 0 found the house markers)

Skip Batches 1-2 entirely — those decisions are already on disk, and re-asking invites a contradictory answer. Read what is there, then ask **one** question: which of the Batch 3 integrations to add now, as a multi-select listing only the ones **not** already present. Then:

- **Diff, never assume.** For each selection, list the tree lines it owns and check each path — some may already exist from a partial attempt. Existing files are EDIT rows or skipped rows, never silent overwrites.
- **Report what the answers do not cover.** If the app has drifted from the tree in ways no answer addresses (a missing barrel, a kind that grew a subfolder), say so as a separate list and let the owner decide — do not fold structural repairs into an add-run manifest.
- **A structural change is not an add-run.** Renaming a kind, splitting `styles/`, or moving `app/` into `src/` is a first-run-scale restructure; say that plainly and stop rather than half-applying it.

## Step 2 — The manifest (the one gate)

Present a single table and wait for approval. Every row is labelled:

- **CREATE** — a path that does not exist; written from the templates.md section for the step that owns it.
- **EDIT** — a starter-owned file, with the precise change named (which scripts, which key, which `paths` entry). templates.md Step 4.
- **MOVE** — a restructure, source → destination, with the imports that must follow it.
- **DELETE** — demo cruft, one line per path, with why.

Also list: the **commands** that would need to run (listed, not run), any **conflict** between the starter's layout and the house standard with the skill it contradicts, and — in a monorepo — the root-owned files this run is deliberately **not** touching.

Typical manifest against a fresh `create-next-app` (TypeScript + Tailwind + App Router), Server-Actions-only, Storybook yes, tests yes, private repo, no integrations:

- **MOVE** — `app/` → `src/app/` and `app/globals.css` → `src/styles/globals.css` when the starter was created without `--src-dir` (`code-structure` requires `src/`); `app/favicon.ico` stays where it is, because the `favicon` convention only works at the `app/` root.
- **EDIT** — `package.json` (add `check-types`, `format`, `format:check`, Storybook and test scripts, the `lint-staged` block when standalone), `tsconfig.json` (the strict flags and the `@/*` path), `next.config.ts` (`cacheComponents`, the `cacheLife` tiers, `typedRoutes`, security headers), `src/app/layout.tsx` (import `@/styles/globals.css`, real `metadata`, `lang`), `src/app/page.tsx` (thin entry rendering the composed page), `.gitignore` (env, caches, `storybook-static`), `globals.css` (split into the seven layers).
- **CREATE** — the six `src/styles/*.css` layers plus the entry that imports them in order; the seven `src/lib/` kinds with a barrel each; `src/lib/server/` and its six kinds behind the `server-only` barrel when the answers earned a backend; the five route groups with their thin `layout.tsx`/`page.tsx` and the group-level `error.tsx`/`loading.tsx` the tree shows; `src/components/` mirroring those groups plus `errors/`, `_shared/`, and the four `ui/` tiers with one real component per tier; `.env.example`; and `.github/`, `.husky/`, `commitlint.config.ts` **only when standalone**.
- **DELETE** — the starter's demo page body (replaced, not deleted, since `page.tsx` is EDIT), `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`, the boilerplate `README.md` (→ `readme-standards`), and the starter's generated `AGENTS.md` + `CLAUDE.md` (→ `scaffold-agents-md`, which writes the real pair). Confirm each path exists before listing it.

**Scale the manifest to the answers.** Every conditional line in the tree names what turns it on; a row appears only when its answer did. Nothing conditional is created "just in case" — an unused folder is a wrong guess the next reader has to undo.

## Step 3 — Restructure (MOVE first, so later edits land once)

Per `code-structure`: everything the app owns lives under `src/`. Move the starter's app directory in, move its CSS entry to `src/styles/`, then fix every import that pointed at the old paths (`grep` for the old specifier — do not guess the count).

- **Create all four `ui/` tiers on day one** even if only one is used, so the first component cannot land in the wrong place for lack of a folder.
- **Route groups follow the answers.** `(marketing)` is the minimum. `(auth)` and `(dashboard)` appear when there is a signed-in surface, `(admin)` when there is an operator surface, `(legal)` when the app ships policies. A group with one page still earns its parens if it has its own shell.
- **The two prefixed groups keep their real segment.** `(auth)/auth/` and `(dashboard)/dashboard/` — the parens give the shared layout, the inner folder gives the URL prefix. `(legal)` and `(marketing)` have no prefix, so no inner segment.

## Step 4 — Edit the files the starter owns

Per templates.md Step 4, in this order: `package.json` scripts → `tsconfig.json` → the framework config → `.gitignore` → the CSS entry split → `layout.tsx` / `page.tsx`. Rules that matter more than the diffs:

- **Add scripts, don't replace them.** `dev`, `build`, and `start` are the starter's; add `check-types`, `format`, `format:check`, and whatever the answers earned.
- **Add tsconfig flags, keep the starter's.** `plugins: [{ "name": "next" }]`, `include`, and `moduleResolution` came from the starter and stay. Add the strictness the house requires and the `@/*` path if it is missing.
- **The CSS split is a split, not a rewrite.** The starter's `globals.css` already holds `@import "tailwindcss"`, an `@theme inline` block, and its `--font-*` mappings from `next/font`. Keep the entry's `@import "tailwindcss"`, move the raw vars into `tokens.css` as OKLCH semantic roles, move the `@theme inline` block into `theme.css` **including the font mappings the starter created**, move the body/element rules into `base.css`, and replace the starter's `@media (prefers-color-scheme: dark)` block with a `.dark` override of the same token names plus `@custom-variant dark (…)` — the house dark mode is a manual class toggle, and the selector is a project fact for `AGENTS.md`. The entry then imports the six layers in the fixed order the tree records.
- **Never touch the linter the starter chose.** ESLint or Biome, whichever it wrote, is kept as-is.

## Step 5 — Create the client-side `lib/` kinds

Seven kinds, each flat, each with a barrel that has **one explicit export line per file** — never `export *` from a directory:

| Kind         | Grammar                | Day-zero contents                                                             |
| ------------ | ---------------------- | ----------------------------------------------------------------------------- |
| `config/`    | bare names             | `env.ts` (Zod at boot), `routes.ts`, `endpoints.ts`, `site.ts`                |
| `constants/` | `<domain>.constant.ts` | `nav.constant.ts`; the const and its inferred type live together              |
| `data/`      | `<domain>.data.ts`     | static content records, typed by `types/`; only what the app actually has     |
| `hooks/`     | `use-<subject>.ts`     | `use-theme.ts`, and `use-media-query.ts` / `use-click-outside.ts` when used   |
| `schemas/`   | `<domain>.schema.ts`   | Zod schemas with `z.infer` beside each; `shared.schema.ts` for primitives     |
| `types/`     | `<domain>.type.ts`     | shapes with no const or schema behind them — never re-declare an inferred one |
| `utils/`     | `<domain>.utils.ts`    | the portable core the tree lists; `cn.ts` keeps its bare name                 |

- **`env.ts` is a leaf module importing only zod** (`devops`) — a boot-time failure must not depend on the rest of the app loading.
- **`.env.example` names the secrets only** — plus `APP_ENV`, the key `config/site.ts` reads. Everything else that varies per tier is a committed constant, not an env var (`devops`).
- **Never create an empty kind.** A folder with only a barrel is noise; create the kind when its first file exists.
- **In a monorepo, import from the shared packages instead** when they already exist there — and `cn` in a `ui:`-prefixed package must be `extendTailwindMerge({ prefix: "ui" })` or conflict resolution fails silently.

## Step 6 — The backend boundary (only if the answers asked for one)

`src/lib/server/` behind its **own** `server-only` barrel, never shared with client-safe code. Six kinds, same flat grammar:

| Kind        | Grammar               | What belongs in it                                                         |
| ----------- | --------------------- | -------------------------------------------------------------------------- |
| `actions/`  | `<domain>.action.ts`  | Server Actions, grouped by domain — never one giant `actions.ts`           |
| `cache/`    | `<domain>.cache.ts`   | `use cache` readers with `cacheLife` + `cacheTag`                          |
| `clients/`  | `<service>.client.ts` | one configured SDK singleton per external service; a folder once it splits |
| `data/`     | `<domain>.data.ts`    | store access only, plus `collections.data.ts` and `batch.data.ts`          |
| `services/` | `<domain>.service.ts` | the business logic actions and routes call; the only caller of `data/`     |
| `utils/`    | `<domain>.utils.ts`   | server-only helpers — the guard, response builders, logger, errors         |

- **Scaffold one vertical stub in the build order schema → service → route or action**, bodies as `// TODO:`, so the layering is demonstrated rather than described.
- **"None" means no `lib/server/` at all.** "Separate API" means `server/utils/api.utils.ts` plus the clients it needs, and **no `data/`** — the queries live in the API app.
- **`cache/` presumes Cache Components.** On the legacy model these are `fetch`-cached readers deduped with React `cache()`, not `use cache` files; which model is on is a project fact (`nextjs-best-practices`).
- **Firebase answers** add `clients/firebase/` and `data/collections.data.ts` per `firebase` — the Admin-SDK boundary, never client Firestore writes.
- **The guard lives in `utils/`, not its own kind**, and the route file calls it first (`backend`). A layout that guards keeps the check in the route file, because a throwing layout escapes its own `error.tsx`.

## Step 7 — Design-system proof

Per `reusables` + `naming` + `storybook-setup`: **one folder per component**, holding the component, its story, its barrel, and a test only when there is logic to assert.

- **One real component per tier** — a `base/` primitive (props-only, variant/size class maps, `cn()`-merged `className` last, `focus-visible` styles), and the shells the chosen route groups need in `layouts/`. A group's `layout.tsx` imports a shell, so the shell cannot be a stub.
- **Every component ships a story; a test only where there is behaviour.** State, keyboard handling, or conditional rendering earns a `*.test.tsx`; a component that renders its children does not.
- **Stories colocate with the component** they document, not in a separate `stories/` tree — the story is part of the component's folder.
- **If Storybook was chosen**, propose `npx storybook@latest init` with the matching framework package (`@storybook/nextjs-vite`), then reshape what it scaffolds: delete its sample stories, point the `stories` glob at `src/components/**/*.stories.tsx`, keep the addon list to `addon-a11y` + `addon-vitest` + `addon-docs`, and add tier `storySort` in `preview`.

This is the smallest end-to-end proof that tokens, tiers, aliases, barrels, and stories are all wired.

## Step 8 — Delete the demo cruft

Only the approved DELETE lines, one command per group, after confirming each path still exists. Nothing here is inferred at run time.

## Step 9 — Standalone-only extras

**Skip this entire step in a monorepo** — the root owns it. Standalone and approved: the composite `.github/actions/setup` action, `ci.yml` with a deny-all `permissions` default, `concurrency`, `timeout-minutes`, and SHA-pinned third-party actions (re-resolve the SHAs, never copy stale ones), plus husky + lint-staged + commitlint. Test runners chosen in Batch 2 get their config and one example test, and their job in CI. A **public** repo also gets `LICENSE`, `SECURITY.md`, and `CONTRIBUTING.md`.

## Step 10 — Install and verify (second gate)

Propose the exact commands, wait, then run only the approved ones. After install, run the project's own `check-types`, `lint`, and `build` and report the real output. An adapted app that does not type-check and build is not finished — fix it before handing off.

## Step 11 — Hand off, don't duplicate

- **`AGENTS.md` + `CLAUDE.md`** → **`scaffold-agents-md`**, handed the Step 1 answers as project facts (framework, package manager, backend shape, data store, dark-mode selector, env var meanings, test runners). It replaces the starter's generated pair.
- **`README.md`** → **`readme-standards`**.
- **The first real feature** → **`scaffold-feature`**.
- **Committing the change** → **`stage-commit`**.

Scaffold **no** documentation tree — a README and `AGENTS.md` are the whole doc surface a new project gets.

## Output

In chat only: whether this was a first run or an add-run and which house markers decided that, the detected starter and workspace mode, the recorded interview answers, the approved manifest with each row's outcome, the MOVEs performed and imports updated, the commands run with their real output, every conflict where the starter's layout lost to the house standard, any drift the answers did not cover, and the four hand-offs. The adapted app is the artifact — no report file, nothing staged, nothing committed.

## Boundaries

- **Never generates from an empty directory**, **never overwrites a starter file**, **never pins the starter's versions**, **never installs or runs git without approval, never commits** → `stage-commit`.
- **One app or package only.** The workspace shell — `pnpm-workspace.yaml`, `turbo.json`, the catalog, shared `packages/*`, root CI and hooks → **`scaffold-monorepo`**, which calls this skill per app in `apps/*`; the workspace mechanics themselves are `turborepo-monorepo`.
- **Skeleton and integration wiring only.** The first feature slice → `scaffold-feature`. `AGENTS.md` → `scaffold-agents-md`. README → `readme-standards`. Moving an existing app to a new framework or major → `migrate-framework`. Realigning already-diverged sibling apps → `sync-apps`.
- **An add-run wires an integration in; it does not restructure.** Renaming a kind, re-splitting `styles/`, or moving `app/` into `src/` is first-run-scale work — say so and stop rather than half-applying it.
- **Executes, never invents the standard** — layout `code-structure`, names `naming`, types/schemas `typescript-best-practices`, styles/tokens `tailwind-css`, tiers `design-system`, primitives `reusables`, stories `storybook-setup` + `storybook-story-writing`, env/CI/hooks `devops`, API layering `backend`, framework flags `nextjs-best-practices`, Firebase `firebase`, markup and a11y `html-best-practices` + `accessibility`.
- Called **into** by `scaffold-monorepo` (per app) and called back into by `scaffold-agents-md` / `readme-standards` when a repo needs its structure before its docs.

## References

- [references/target-tree.md](references/target-tree.md) — the full annotated tree: every folder and file, what each is, and what turns the conditional ones on. The specification this command executes.
- [references/templates.md](references/templates.md) — file contents and the exact edits, per step.
