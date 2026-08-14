---
name: scaffold-next-app
description: >-
  Adapt an already-created `create-next-app` starter into the house structure for ONE Next.js app — the route groups and their shells, `components/` mirroring them, the four `ui/` tiers folder-per-component, six kind-first `lib/` folders plus six more behind the `lib/server` boundary, the CSS token layers, boot-time env validation, and Storybook. Use when the user asks to scaffold a Next.js app, set up this project, apply house structure, restructure this starter, bootstrap the app, or start a new next app — and with `--add`, to wire a new integration (Cloudinary, Redis, feature flags, a kill switch, consent, MDX, mail) into an app this skill already shaped. Next.js only — Astro sites, React/Vite apps, and shared library packages get their own skills. Interviews first in grouped batches, then presents one CREATE / EDIT / MOVE / DELETE manifest for approval — it edits the files the starter owns instead of overwriting them, never pins framework or dependency versions the starter already chose, and never installs, runs git, or commits on its own.
argument-hint: "[app path] [--add] — e.g. `apps/web`; omit for the current directory"
allowed-tools: Read, Grep, Glob, Write, Edit, AskUserQuestion, Bash(ls:*), Bash(mkdir:*), Bash(mv:*), Bash(rm:*), Bash(cat:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git mv:*), Bash(npm view:*), Bash(pnpm:*), Bash(yarn:*), Bash(npx:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Scaffold app

Takes an app the framework's own scaffolder just created and turns it into a house-standard app — the route groups and their shells, `components/` mirroring them, the four `ui/` tiers folder-per-component, six kind-first `lib/` folders plus six more behind the `lib/server` boundary, the seven CSS layers, Zod-at-boot env validation, Storybook, and one real component per tier to prove the wiring end to end.

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

What the app looks like when this command is done — listed the way a repo renders, folders first then files, each alphabetical. Conditional entries are annotated; the rules behind the shape live in `code-structure`. Every line is annotated, and anything conditional says what turns it on. Asset names follow `naming` — `logo` is the symbol plus the name, `icon` is the symbol on its own, and the suffix is the colour of the artwork itself.

```txt
.
|___ _docs/                              # project docs - guides, specs, runbooks
|    |___ README.md                      # the folder map, and which doc a newcomer reads first
|___ _reports/                           # audit output, committed - the diff shows what got fixed
|    |___ README.md                      # each report, how to refresh it, how to read severity
|___ .claude/                            # Claude Code config for this project
|    |___ agents/                        # project-only subagents, if any
|    |___ skills/                        # project-only skills, if any
|    |___ README.md                      # what is invocable, what the settings do, how to add
|    |___ settings.json                  # shared: permissions, hooks
|    |___ settings.local.json            # personal overrides, gitignored
|___ .github/                            # everything GitHub itself reads
|    |___ actions/                       # reusable composite actions
|    |    |___ setup/                    # the one setup step every job calls
|    |         |___ action.yml           # checkout + pnpm + node + install
|    |___ ISSUE_TEMPLATE/                # the forms new issues start from
|    |    |___ bug_report.md             # repro steps, expected vs actual
|    |    |___ config.yml                # template chooser + external links
|    |    |___ documentation.md          # docs-only issues
|    |    |___ feature_request.md        # problem first, proposal second
|    |    |___ general.md                # anything the other templates miss
|    |___ workflows/                     # CI and repo automation
|    |    |___ auto-assign.yml           # assigns an owner when a PR opens
|    |    |___ ci.yml                    # lint -> typecheck -> format -> build -> test
|    |    |___ codeql.yml                # SAST scanning on push and PR
|    |    |___ issue-label.yml           # labels issues from their template
|    |    |___ label.yml                 # path-based PR labels, driven by labeler.yml
|    |    |___ pr-title.yml              # PR titles must be Conventional Commits
|    |    |___ release-notes.yml         # drafts notes from merged PRs
|    |    |___ stale.yml                 # closes abandoned issues and PRs
|    |___ CODEOWNERS                     # required reviewers per path
|    |___ labeler.yml                    # the path -> label map label.yml reads
|    |___ pull_request_template.md       # the checklist every PR opens with
|    |___ release-notes.yml              # release-note categories and their labels
|___ .husky/                             # git hooks, installed by `prepare`
|    |___ commit-msg                     # runs commitlint
|    |___ pre-commit                     # runs lint-staged + affected typecheck
|___ .storybook/                         # only if Storybook = yes
|    |___ main.ts                        # stories glob, addons, framework
|    |___ preview.tsx                    # global decorators, the style import, a11y config
|___ .vscode/                            # editor settings every contributor shares
|    |___ extensions.json                # the extensions this repo expects you to have
|    |___ settings.json                  # format-on-save and the formatter to use
|___ public/                             # Next serves this at the root; the subfolders are ours
|    |___ docs/                          # downloadables - press kit, whitepapers
|    |___ video/                         # streamed by URL; long-form belongs on a CDN
|    |___ android-chrome-192x192.png     # manifest icon, 192px
|    |___ android-chrome-512x512.png     # manifest icon, 512px
|    |___ icon-dark.svg                  # symbol only, dark
|    |___ icon-light.svg                 # symbol only, light
|    |___ icon.svg                       # symbol only, brand colour - the default
|    |___ llms.txt                       # what AI crawlers may use
|    |___ logo-dark.svg                  # symbol + name, dark
|    |___ logo-light.svg                 # symbol + name, light
|    |___ logo.svg                       # symbol + name, brand colour - the default
|___ scripts/                            # one-off maintenance scripts, if any
|___ src/                                # everything importable, behind the `@/*` alias
|    |___ app/                           # ROUTES ONLY - thin files, no components, no logic
|    |    |___ (admin)/                  # the operator routes, behind a staff-role guard
|    |    |    |___ admin/               # real segment, so every URL here starts /admin
|    |    |    |    |___ feature-flags/  # route segment; only if feature flags = yes
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |    |___ users/          # route segment
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |___ error.tsx            # covers every page in the group, not just one
|    |    |    |___ layout.tsx           # renders AdminLayout; the role guard stays here
|    |    |    |___ loading.tsx          # the group's Suspense fallback
|    |    |___ (auth)/                   # the sign-in, sign-up, and reset routes
|    |    |    |___ auth/                # real segment, so every URL here starts /auth
|    |    |    |    |___ forgot-password/  # route segment
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |    |___ login/          # route segment
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |    |___ signup/         # route segment
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |    |___ page.tsx        # thin entry, imports the composed auth landing page
|    |    |    |___ layout.tsx           # thin entry, renders ui/layouts/AuthLayout
|    |    |___ (dashboard)/              # the signed-in routes, behind one guard
|    |    |    |___ dashboard/           # real segment, so every URL here starts /dashboard
|    |    |    |    |___ overview/       # route segment
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |    |___ settings/       # route segment
|    |    |    |    |    |___ page.tsx   # thin entry, imports the composed page
|    |    |    |___ error.tsx            # thin client entry; covers the whole group, not one page
|    |    |    |___ layout.tsx           # renders DashboardLayout; the session guard stays here
|    |    |    |___ loading.tsx          # the group's Suspense fallback
|    |    |___ (legal)/                  # the policy and terms routes, sharing a layout
|    |    |    |___ cookies/             # route segment
|    |    |    |    |___ page.tsx        # thin entry, imports the composed page
|    |    |    |___ privacy/             # route segment
|    |    |    |    |___ page.tsx        # thin entry, imports the composed page
|    |    |    |___ terms/               # route segment
|    |    |    |    |___ page.tsx        # thin entry, imports the composed page
|    |    |    |___ layout.tsx           # thin entry, renders ui/layouts/LegalLayout
|    |    |___ (marketing)/              # the public sales routes, sharing a layout
|    |    |    |___ about/               # route segment
|    |    |    |    |___ page.tsx        # thin entry, imports the composed page
|    |    |    |___ pricing/             # route segment
|    |    |    |    |___ page.tsx        # thin entry, imports the composed page
|    |    |    |___ layout.tsx           # renders MarketingLayout + constants/nav.constant.ts
|    |    |    |___ page.tsx             # thin entry, imports the composed home page
|    |    |___ api/                      # only if something outside these pages calls in
|    |    |    |___ docs/                # the OpenAPI spec and the page that renders it
|    |    |    |    |___ openapi/        # the generated spec, built from the route registry
|    |    |    |    |    |___ route.ts   # serves the JSON
|    |    |    |    |___ route.ts        # serves the browsable reference
|    |    |    |___ v1/                  # versioned, so a breaking change adds v2
|    |    |         |___ admin/          # the operator-only surface, behind a role check
|    |    |         |    |___ feature-flags/  # only if feature flags = yes
|    |    |         |         |___ [flagId]/  # publish, archive, or reschedule one flag
|    |    |         |         |    |___ route.ts  # the single-flag operations
|    |    |         |         |___ route.ts  # list the catalogue, create a draft
|    |    |         |___ cron/           # scheduled work, one dispatcher the scheduler calls
|    |    |         |    |___ route.ts   # verifies the scheduler, then runs the due tasks
|    |    |         |___ health/         # liveness, not behind auth
|    |    |         |    |___ route.ts   # what the deploy health-check hits
|    |    |         |___ public/         # unauthenticated reads the maintenance page needs
|    |    |         |    |___ maintenance-window/  # only if a kill switch = yes
|    |    |         |         |___ route.ts  # readable while everything else returns 503
|    |    |         |___ webhooks/       # provider callbacks, one folder per provider
|    |    |              |___ <provider>/  # verifies the signature, dedups, then queues
|    |    |                   |___ route.ts  # the endpoint the provider posts to
|    |    |___ unauthorized/             # where a failed guard sends a signed-out visitor
|    |    |    |___ page.tsx             # thin entry, imports the composed page
|    |    |___ apple-icon.png            # iOS home-screen icon; tag injected too
|    |    |___ error.tsx                 # thin client entry, fallback for the groups with none
|    |    |___ favicon.ico               # legacy fallback; only works at the app root
|    |    |___ global-error.tsx          # catches the root layout; self-contained, no app styles
|    |    |___ icon.svg                  # .svg or .png; wins over the .ico where supported
|    |    |___ layout.tsx                # imports globals.css, sets the metadata base
|    |    |___ manifest.ts               # generated; a public/site.webmanifest would win instead
|    |    |___ not-found.tsx             # thin entry, imports the composed 404
|    |    |___ opengraph-image.tsx       # ImageResponse OG card
|    |    |___ robots.ts                 # generated; a public/robots.txt would silently win
|    |    |___ sitemap.ts                # generated from routes.ts, never a static file
|    |___ assets/                        # the only assets folder - things code imports
|    |    |___ fonts/                    # only self-hosted faces; a Google font needs no files
|    |    |___ images/                   # every UI image - imported, so dimensions are inferred
|    |___ components/                    # .tsx only (+ colocated stories and tests)
|    |    |___ _shared/                  # widgets several features use, specific to this app
|    |    |    |___ FlagProvider.tsx     # takes the server-resolved flags; only if flags = yes
|    |    |    |___ ThemeProvider.tsx    # a provider returns JSX, so it is a component, not a hook
|    |    |___ admin/                    # the operator screens
|    |    |    |___ feature-flags/       # pairs with app/(admin)/admin/feature-flags/
|    |    |    |    |___ FlagTableSection.tsx  # one file per section
|    |    |    |    |___ index.tsx       # the only thing page.tsx imports
|    |    |    |___ users/               # pairs with app/(admin)/admin/users/
|    |    |         |___ index.tsx       # composes this page's sections
|    |    |         |___ UserTableSection.tsx  # one file per section
|    |    |___ auth/                     # the sign-in, sign-up, and reset screens
|    |    |    |___ forgot-password/     # pairs with app/(auth)/auth/forgot-password/
|    |    |    |    |___ ForgotPasswordForm.tsx  # this page's only section
|    |    |    |    |___ index.tsx       # the only thing page.tsx imports
|    |    |    |___ login/               # pairs with app/(auth)/auth/login/
|    |    |    |    |___ index.tsx       # composes this page's sections
|    |    |    |    |___ LoginForm.tsx   # this page's only section
|    |    |    |___ signup/              # pairs with app/(auth)/auth/signup/
|    |    |    |    |___ index.tsx       # composes this page's sections
|    |    |    |    |___ SignupForm.tsx  # this page's only section
|    |    |    |___ index.tsx            # pairs with app/(auth)/auth/ - the method chooser
|    |    |___ dashboard/                # the signed-in screens
|    |    |    |___ _shared/             # shared within this feature only
|    |    |    |___ overview/            # pairs with app/(dashboard)/dashboard/overview/
|    |    |    |    |___ index.tsx       # the only thing page.tsx imports
|    |    |    |    |___ StatsSection.tsx  # one file per section
|    |    |    |    |___ WelcomeSection.tsx  # a second section
|    |    |    |___ settings/            # pairs with app/(dashboard)/dashboard/settings/
|    |    |    |    |___ index.tsx       # composes this page's sections
|    |    |    |    |___ ProfileSection.tsx  # one file per section
|    |    |___ errors/                   # what the error and not-found route files render
|    |    |    |___ error/               # pairs with every error.tsx - a client component
|    |    |    |    |___ index.tsx       # takes the error + reset, renders ErrorLayout
|    |    |    |___ global-error/        # pairs with app/global-error.tsx
|    |    |    |    |___ index.tsx       # inlines its styles - globals.css never loads here
|    |    |    |___ not-found/           # pairs with app/not-found.tsx
|    |    |    |    |___ index.tsx       # composes this page's content
|    |    |    |___ maintenance/         # what the 503 renders; only if a kill switch = yes
|    |    |    |    |___ index.tsx       # reads the window from the public endpoint
|    |    |    |___ unauthorized/        # pairs with app/unauthorized/
|    |    |         |___ index.tsx       # a real route, unlike the three above
|    |    |___ legal/                    # the policy and terms screens
|    |    |    |___ cookies/             # pairs with app/(legal)/cookies/
|    |    |    |    |___ index.tsx       # the only thing page.tsx imports
|    |    |    |___ privacy/             # pairs with app/(legal)/privacy/
|    |    |    |    |___ index.tsx       # composes this page's content
|    |    |    |___ terms/               # pairs with app/(legal)/terms/
|    |    |         |___ index.tsx       # composes this page's content
|    |    |___ marketing/                # the public sales screens
|    |    |    |___ about/               # pairs with app/(marketing)/about/
|    |    |    |    |___ index.tsx       # composes this page's sections
|    |    |    |    |___ StorySection.tsx  # one file per section
|    |    |    |___ home/                # pairs with app/(marketing)/ - the root route
|    |    |    |    |___ CtaSection.tsx  # one file per section
|    |    |    |    |___ FeaturesSection.tsx  # a second section, same rule
|    |    |    |    |___ HeroSection.tsx # a third
|    |    |    |    |___ index.tsx       # the only thing page.tsx imports
|    |    |    |___ pricing/             # pairs with app/(marketing)/pricing/
|    |    |         |___ data.ts         # stub records; delete it when the real source lands
|    |    |         |___ index.tsx       # composes this page's sections
|    |    |         |___ PlansSection.tsx  # one file per section
|    |    |___ ui/                       # reusable components any app could use, in 4 tiers
|    |    |    |___ base/                # atoms: render one thing, no sub-components
|    |    |    |    |___ Badge/           # one folder per component
|    |    |    |    |    |___ Badge.stories.tsx  # one per tone
|    |    |    |    |    |___ Badge.tsx   # renders a label, so no test to write
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ Button/
|    |    |    |    |    |___ Button.stories.tsx  # the variants, states, and sizes
|    |    |    |    |    |___ Button.test.tsx  # the disabled and loading states have logic
|    |    |    |    |    |___ Button.tsx  # the component
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |___ blocks/              # composed of base, owns its own state
|    |    |    |    |___ Accordion/       # one folder per component
|    |    |    |    |    |___ Accordion.stories.tsx  # single-open and multi-open
|    |    |    |    |    |___ Accordion.test.tsx  # it owns open/closed state, so assert it
|    |    |    |    |    |___ Accordion.tsx  # ships with AccordionItem as a named export
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ Card/
|    |    |    |    |    |___ Card.stories.tsx  # surface, padding, and the content slots
|    |    |    |    |    |___ Card.tsx    # renders children, so no test to write
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ PageHeading/     # the title + description pair every page repeats
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |    |___ PageHeading.stories.tsx  # with and without the description
|    |    |    |    |    |___ PageHeading.tsx  # the component
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |___ layouts/             # the page shells, taking regions as slot props
|    |    |    |    |___ AdminLayout/     # denser than the dashboard, tables over cards
|    |    |    |    |___ AuthLayout/      # centred card, no nav - nothing to click away to
|    |    |    |    |    |___ AuthLayout.stories.tsx  # a form slotted in, at both breakpoints
|    |    |    |    |    |___ AuthLayout.tsx  # pure composition, so no test to write
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ DashboardLayout/  # takes the sidebar as a slot, never imports it
|    |    |    |    |    |___ DashboardLayout.stories.tsx  # sidebar open and collapsed
|    |    |    |    |    |___ DashboardLayout.test.tsx  # it remembers the collapsed state
|    |    |    |    |    |___ DashboardLayout.tsx  # the component
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ ErrorLayout/     # the shared shell for error, 404, and unauthorized
|    |    |    |    |___ LegalLayout/     # minimal chrome and a reading measure, not marketing
|    |    |    |    |___ MarketingLayout/  # full navbar + footer; home, about, pricing
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |___ patterns/            # whole page regions the layouts slot in
|    |    |    |    |___ Footer/          # the app passes its links from constants/
|    |    |    |    |    |___ Footer.stories.tsx  # every column group, and the narrow layout
|    |    |    |    |    |___ Footer.tsx  # renders the links it is given, so no test
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |___ MinimalFooter/   # the legal and auth variant - legal links only
|    |    |    |    |___ Navbar/          # the app passes its nav items from constants/
|    |    |    |    |    |___ index.ts   # the component barrel
|    |    |    |    |    |___ Navbar.stories.tsx  # signed in, signed out, and the mobile menu
|    |    |    |    |    |___ Navbar.test.tsx  # the mobile menu traps focus, so assert it
|    |    |    |    |    |___ Navbar.tsx  # the component
|    |    |    |    |___ Sidebar/         # the app passes the signed-in nav items
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |___ index.ts             # re-exports every tier
|    |___ content/                       # the MDX itself; only if the app ships prose
|    |    |___ blog/                     # one folder per content type, one file per entry
|    |    |___ drafts/                   # not published; the loader skips this folder
|    |    |___ newsletter/               # one file per issue, same frontmatter contract
|    |___ lib/                           # kind-first, flat inside each kind - no feature folder
|    |    |___ config/                   # the app's own settings, read all over
|    |    |    |___ endpoints.ts         # every API path - never a literal URL in a caller
|    |    |    |___ env.ts               # Zod-validated at boot; fails the deploy, not a request
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ routes.ts            # every page path - no literal paths in components
|    |    |    |___ site.ts              # canonical name, URL, OG defaults, social handles
|    |    |___ constants/                # frozen domain values, no logic
|    |    |    |___ auth.constant.ts     # sign-in methods, referral sources
|    |    |    |___ index.ts             # the kind barrel, one explicit export line per file
|    |    |    |___ feature-flag.constant.ts  # the typed flag-name union; only if flags = yes
|    |    |    |___ nav.constant.ts      # the links the navbar and footer both render
|    |    |    |___ <domain>.constant.ts # one domain's frozen values plus its inferred type
|    |    |___ data/                     # static content records, no fetching
|    |    |    |___ faq.data.ts          # the questions the marketing pages render
|    |    |    |___ index.ts             # the kind barrel, one explicit export line per file
|    |    |    |___ plan.data.ts         # the pricing tiers and what each includes
|    |    |    |___ <domain>.data.ts     # one domain's records, typed by types/
|    |    |___ hooks/                    # client-side React hooks
|    |    |    |___ index.ts             # the kind barrel, one explicit export line per file
|    |    |    |___ use-click-outside.ts # closes menus, popovers, and overlays
|    |    |    |___ use-theme.ts         # reads and sets the theme the provider owns
|    |    |    |___ use-<subject>.ts     # one hook, named for what it gives you
|    |    |___ server/                   # the one non-kind folder - a hard runtime boundary
|    |    |    |___ actions/             # the mutations a form or client handler invokes
|    |    |    |    |___ auth.action.ts  # sign in, sign out, request a reset
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ user.action.ts  # update the profile, delete the account
|    |    |    |    |___ <domain>.action.ts   # one domain's Server Actions
|    |    |    |___ cache/               # the cached readers, one per domain
|    |    |    |    |___ auth.cache.ts   # the caller, cached for the request
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ user.cache.ts   # `use cache` + cacheLife + cacheTag around the reader
|    |    |    |    |___ <domain>.cache.ts    # one domain's cached reads
|    |    |    |___ clients/             # one configured SDK singleton per external service
|    |    |    |    |___ cloudinary/      # only if image delivery = Cloudinary
|    |    |    |    |    |___ cloudinary.client.ts  # the configured SDK every caller reuses
|    |    |    |    |    |___ cloudinary.transform.ts  # thumbnail and preview URL builders
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |___ email/           # only if the app sends mail
|    |    |    |    |    |___ email.client.ts  # one agent per mail type, each with its token
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |___ firebase/        # only if store = Firebase
|    |    |    |    |    |___ firebase.client.ts  # lazy Firestore, Auth, and Storage singletons
|    |    |    |    |    |___ firebase.rest.ts  # the auth flows the Admin SDK cannot do
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |___ redis/           # only if the app needs a shared cache
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |    |___ redis.client.ts  # the one connection; never a second `new Redis()`
|    |    |    |    |    |___ redis.dedup.ts   # SET NX EX so a retry cannot double-charge
|    |    |    |    |    |___ redis.keys.ts    # every key built here; inline strings are banned
|    |    |    |    |    |___ redis.locks.ts   # SET NX EX to take, Lua compare-and-delete to free
|    |    |    |    |    |___ redis.maintenance.ts  # the mirror the proxy reads; fails open
|    |    |    |    |    |___ redis.rate-limit.ts  # the sliding window every instance shares
|    |    |    |    |    |___ redis.store.ts   # the read-through wrapper; every write invalidates
|    |    |    |    |    |___ redis.ttl.ts     # the TTL presets, so none are defined inline
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ <service>.client.ts  # a one-file client needs no folder
|    |    |    |___ data/                # store access, the only place queries live
|    |    |    |    |___ auth.data.ts    # the session record, read and written
|    |    |    |    |___ batch.data.ts   # spans the write cap by committing each batch as it fills
|    |    |    |    |___ collections.data.ts  # every collection path; no string literal elsewhere
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ user.data.ts    # the user collection, reads and writes only
|    |    |    |    |___ <domain>.data.ts     # one collection's reads and writes
|    |    |    |___ services/            # business logic the routes and actions call
|    |    |    |    |___ auth.service.ts # verifies the session, returns the caller or throws
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ feature-flag.service.ts  # the evaluation ladder; only if flags = yes
|    |    |    |    |___ feature-flag-cron.service.ts  # reconciles scheduled flags each tick
|    |    |    |    |___ user.service.ts # the only caller of user.data.ts
|    |    |    |    |___ <domain>.service.ts  # one domain's business logic
|    |    |    |___ utils/               # helpers that must never reach the browser
|    |    |    |    |___ action-result.utils.ts  # the success and error shapes actions return
|    |    |    |    |___ api.utils.ts    # the typed fetch wrapper, with the session attached
|    |    |    |    |___ auth-guard.utils.ts  # the session + permission check every route runs
|    |    |    |    |___ encryption.utils.ts  # AES-256-GCM field encryption; only if needed
|    |    |    |    |___ errors.utils.ts # the typed error classes routes throw
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ list-params.utils.ts  # cursor, limit, and filter parsing for lists
|    |    |    |    |___ logger.utils.ts # structured server logs, never console.log
|    |    |    |    |___ rate-limit.utils.ts  # the wrapper that caps a route by tier
|    |    |    |    |___ response.utils.ts  # the shared success and error builders
|    |    |    |    |___ sanitize.utils.ts  # strips fields no caller should ever receive
|    |    |    |___ index.ts             # `server-only` barrel, never mixed with client code
|    |    |___ types/                    # shared TS types not derived from a schema
|    |    |    |___ auth.type.ts         # the session and caller shapes
|    |    |    |___ index.ts             # the kind barrel, one explicit export line per file
|    |    |    |___ nav.type.ts          # the shape nav.constant.ts satisfies
|    |    |    |___ <domain>.type.ts     # one domain's shared shapes
|    |    |___ utils/                    # pure helpers; the unmarked ones carry to any project
|    |         |___ array.utils.ts       # group, chunk, dedupe, sort by key
|    |         |___ browser.utils.ts     # isBrowser, feature and platform detection
|    |         |___ clipboard.utils.ts   # copy, with the execCommand fallback
|    |         |___ cloudinary.utils.ts  # transform URLs; only if delivery = Cloudinary
|    |         |___ cn.ts               # the class-merge helper every component uses
|    |         |___ color.utils.ts       # contrast ratios and hex <-> oklch
|    |         |___ cookie.utils.ts      # read, write, and delete browser cookies
|    |         |___ cookieconsent.utils.ts  # the consent config; only if consent = yes
|    |         |___ country.utils.ts     # country names, codes, and dial codes
|    |         |___ currency.utils.ts    # minor units in, formatted string out
|    |         |___ data-storage.utils.ts  # typed localStorage and sessionStorage access
|    |         |___ date.utils.ts        # native Date; the display formatters
|    |         |___ error.utils.ts       # narrows unknown to a message worth showing
|    |         |___ file.utils.ts        # size formatting, extension and MIME checks
|    |         |___ firebase-date.utils.ts  # Firestore Timestamp; only if store = Firebase
|    |         |___ form.utils.ts        # FormData to object, and dirty-field diffing
|    |         |___ image.utils.ts       # dimensions, aspect ratios, blur placeholders
|    |         |___ index.ts            # the kind barrel, one explicit export line per file
|    |         |___ iso-date.utils.ts    # ISO strings, parsed and compared without Date
|    |         |___ maintenance.utils.ts  # window maths; only if a kill switch = yes
|    |         |___ mdx-loader.utils.ts  # reads src/content; only if the app ships prose
|    |         |___ millis-date.utils.ts  # Unix millis, and the MILLIS_PER_* constants
|    |         |___ number.utils.ts      # clamp, round, percentages, compact notation
|    |         |___ random.utils.ts      # ids and picks, seeded so tests stay stable
|    |         |___ seo.utils.ts         # buildMetadata and the JSON-LD builders
|    |         |___ storage.utils.ts     # bucket paths and public URLs
|    |         |___ string.utils.ts      # slugify, truncate, initials, case changes
|    |         |___ time.utils.ts        # durations and relative time, not calendar dates
|    |         |___ upload.utils.ts      # client-side compression and caps; only if uploads
|    |         |___ url.utils.ts         # query building and safe absolute URLs
|    |         |___ validate-input.utils.ts  # the shared field checks forms and routes reuse
|    |         |___ <domain>.utils.ts    # anything this app alone needs
|    |___ styles/                        # the only CSS in the project
|    |    |___ animations.css            # 6th import - @keyframes and the classes using them
|    |    |___ base.css                  # 3rd import - element defaults, in @layer base
|    |    |___ components.css            # 5th import - authored classes, in @layer components
|    |    |___ globals.css               # the only entry a layout imports; owns the order below
|    |    |___ theme.css                 # 2nd import - @theme inline maps the vars to utilities
|    |    |___ tokens.css                # 1st import - the raw vars + the .dark overrides
|    |    |___ utilities.css             # 4th import - @utility definitions and motion tokens
|    |___ proxy.ts                       # the kill-switch gate and header rewrites; beside app/
|___ .editorconfig                       # whitespace rules every editor honours
|___ .env.example                        # every required var, zero real values
|___ .gitignore                          # includes .env*, next-env.d.ts, build output
|___ .nvmrc                              # one Node version for devs, CI, and the host
|___ .prettierignore                     # md/mdx only - Biome owns JS/TS/JSON
|___ .prettierrc.json                    # prose formatting, proseWrap preserve
|___ AGENTS.md                           # conventions for agents
|___ biome.json                          # the single lint + format owner for JS/TS/JSON
|___ CLAUDE.md                           # one line: `@AGENTS.md`
|___ commitlint.config.ts                # Conventional Commits, enforced by commit-msg
|___ CONTRIBUTING.md                     # only if the repo takes outside contributions
|___ instrumentation.ts                  # OpenTelemetry hooks; only if you wire tracing
|___ LICENSE                             # required the moment the repo goes public
|___ lint-staged.config.mjs              # what pre-commit runs, staged files only
|___ next-env.d.ts                       # generated on dev/build; gitignored, never committed
|___ next.config.ts                      # cacheComponents, typedRoutes, security headers
|___ package.json                        # scripts + deps
|___ playwright.config.ts                # only if E2E = yes
|___ pnpm-lock.yaml                      # always committed; CI installs --frozen-lockfile
|___ pnpm-workspace.yaml                 # even standalone: the allowBuilds allowlist + overrides
|___ postcss.config.mjs                  # loads the Tailwind v4 plugin
|___ README.md                           # what this is and how to run it
|___ renovate.json                       # automated dependency updates
|___ SECURITY.md                         # public repos - how to report a hole privately
|___ tsconfig.json                       # strict, `@/*` -> src/*
|___ vitest.config.ts                    # only if unit tests = yes
```

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

- **CREATE** — a path that does not exist; written from templates.md Part 1.
- **EDIT** — a starter-owned file, with the precise change named (which scripts, which key, which `paths` entry). templates.md Part 2.
- **MOVE** — a restructure, source → destination, with the imports that must follow it.
- **DELETE** — demo cruft, one line per path, with why.

Also list: the **commands** that would need to run (listed, not run), any **conflict** between the starter's layout and the house standard with the skill it contradicts, and — in a monorepo — the root-owned files this run is deliberately **not** touching.

Typical manifest against a fresh `create-next-app` (TypeScript + Tailwind + App Router), Server-Actions-only, Storybook yes, tests yes, private repo, no integrations:

- **MOVE** — `app/` → `src/app/` and `app/globals.css` → `src/styles/globals.css` when the starter was created without `--src-dir` (`code-structure` requires `src/`); `app/favicon.ico` stays where it is, because the `favicon` convention only works at the `app/` root.
- **EDIT** — `package.json` (add `check-types`, `format`, `format:check`, Storybook and test scripts, the `lint-staged` block when standalone), `tsconfig.json` (the strict flags and the `@/*` path), `next.config.ts` (`cacheComponents`, the `cacheLife` tiers, `typedRoutes`, security headers), `src/app/layout.tsx` (import `@/styles/globals.css`, real `metadata`, `lang`), `src/app/page.tsx` (thin entry rendering the composed page), `.gitignore` (env, caches, `storybook-static`), `globals.css` (split into the seven layers).
- **CREATE** — the seven `src/styles/*.css` layers; the six `src/lib/` kinds with a barrel each; `src/lib/server/` and its six kinds behind the `server-only` barrel when the answers earned a backend; the five route groups with their thin `layout.tsx`/`page.tsx` and the group-level `error.tsx`/`loading.tsx` the tree shows; `src/components/` mirroring those groups plus `errors/`, `_shared/`, and the four `ui/` tiers with one real component per tier; `.env.example`; and `.github/`, `.husky/`, `commitlint.config.ts` **only when standalone**.
- **DELETE** — the starter's demo page body (replaced, not deleted, since `page.tsx` is EDIT), `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`, the boilerplate `README.md` (→ `readme-writer`), and the starter's generated `AGENTS.md` + `CLAUDE.md` (→ `scaffold-agents-md`, which writes the real pair). Confirm each path exists before listing it.

**Scale the manifest to the answers.** Every conditional line in the tree names what turns it on; a row appears only when its answer did. Nothing conditional is created "just in case" — an unused folder is a wrong guess the next reader has to undo.

## Step 3 — Restructure (MOVE first, so later edits land once)

Per `code-structure`: everything the app owns lives under `src/`. Move the starter's app directory in, move its CSS entry to `src/styles/`, then fix every import that pointed at the old paths (`grep` for the old specifier — do not guess the count).

- **Create all four `ui/` tiers on day one** even if only one is used, so the first component cannot land in the wrong place for lack of a folder.
- **Route groups follow the answers.** `(marketing)` is the minimum. `(auth)` and `(dashboard)` appear when there is a signed-in surface, `(admin)` when there is an operator surface, `(legal)` when the app ships policies. A group with one page still earns its parens if it has its own shell.
- **The two prefixed groups keep their real segment.** `(auth)/auth/` and `(dashboard)/dashboard/` — the parens give the shared layout, the inner folder gives the URL prefix. `(legal)` and `(marketing)` have no prefix, so no inner segment.

## Step 4 — Edit the files the starter owns

Per templates.md Part 2, in this order: `package.json` scripts → `tsconfig.json` → the framework config → `.gitignore` → the CSS entry split → `layout.tsx` / `page.tsx`. Rules that matter more than the diffs:

- **Add scripts, don't replace them.** `dev`, `build`, and `start` are the starter's; add `check-types`, `format`, `format:check`, and whatever the answers earned.
- **Add tsconfig flags, keep the starter's.** `plugins: [{ "name": "next" }]`, `include`, and `moduleResolution` came from the starter and stay. Add the strictness the house requires and the `@/*` path if it is missing.
- **The CSS split is a split, not a rewrite.** The starter's `globals.css` already holds `@import "tailwindcss"`, an `@theme inline` block, and its `--font-*` mappings from `next/font`. Keep the entry's `@import "tailwindcss"`, move the raw vars into `tokens.css` as OKLCH semantic roles, move the `@theme inline` block into `theme.css` **including the font mappings the starter created**, move the body/element rules into `base.css`, and replace the starter's `@media (prefers-color-scheme: dark)` block with a `.dark` override of the same token names plus `@custom-variant dark (…)` — the house dark mode is a manual class toggle, and the selector is a project fact for `AGENTS.md`. The entry then imports the six layers in the fixed order the tree records.
- **Never touch the linter the starter chose.** ESLint or Biome, whichever it wrote, is kept as-is.

## Step 5 — Create the client-side `lib/` kinds

Six kinds, each flat, each with a barrel that has **one explicit export line per file** — never `export *` from a directory:

| Kind         | Grammar                | Day-zero contents                                                           |
| ------------ | ---------------------- | --------------------------------------------------------------------------- |
| `config/`    | bare names             | `env.ts` (Zod at boot), `routes.ts`, `endpoints.ts`, `site.ts`              |
| `constants/` | `<domain>.constant.ts` | `nav.constant.ts`; the const and its inferred type live together            |
| `data/`      | `<domain>.data.ts`     | static content records, typed by `types/`; only what the app actually has   |
| `hooks/`     | `use-<subject>.ts`     | `use-theme.ts`, and `use-media-query.ts` / `use-click-outside.ts` when used |
| `types/`     | `<domain>.type.ts`     | only shapes with no const behind them — never re-declare an inferred type   |
| `utils/`     | `<domain>.utils.ts`    | the portable core the tree lists; `cn.ts` keeps its bare name               |

- **`env.ts` is a leaf module importing only zod** (`devops`) — a boot-time failure must not depend on the rest of the app loading.
- **`.env.example` names every required var with no values.**
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
- **`README.md`** → **`readme-writer`**.
- **The first real feature** → **`scaffold-feature`**.
- **Committing the change** → **`stage-commit`**.

Scaffold **no** documentation tree — a README and `AGENTS.md` are the whole doc surface a new project gets.

## Output

In chat only: whether this was a first run or an add-run and which house markers decided that, the detected starter and workspace mode, the recorded interview answers, the approved manifest with each row's outcome, the MOVEs performed and imports updated, the commands run with their real output, every conflict where the starter's layout lost to the house standard, any drift the answers did not cover, and the four hand-offs. The adapted app is the artifact — no report file, nothing staged, nothing committed.

## Boundaries

- **Never generates from an empty directory**, **never overwrites a starter file**, **never pins the starter's versions**, **never installs or runs git without approval, never commits** → `stage-commit`.
- **One app or package only.** The workspace shell — `pnpm-workspace.yaml`, `turbo.json`, the catalog, shared `packages/*`, root CI and hooks → **`scaffold-monorepo`**, which calls this skill per app in `apps/*`; the workspace mechanics themselves are `turborepo-monorepo`.
- **Skeleton and integration wiring only.** The first feature slice → `scaffold-feature`. `AGENTS.md` → `scaffold-agents-md`. README → `readme-writer`. Moving an existing app to a new framework or major → `migrate-framework`. Realigning already-diverged sibling apps → `sync-apps`.
- **An add-run wires an integration in; it does not restructure.** Renaming a kind, re-splitting `styles/`, or moving `app/` into `src/` is first-run-scale work — say so and stop rather than half-applying it.
- **Executes, never invents the standard** — layout `code-structure`, names `naming`, types/schemas `typescript-best-practices`, styles/tokens `tailwind-css`, tiers `design-system`, primitives `reusables`, stories `storybook-setup` + `storybook-story-writing`, env/CI/hooks `devops`, API layering `backend`, framework flags `nextjs-best-practices`, Firebase `firebase`, markup and a11y `html-best-practices` + `accessibility`.
- Called **into** by `scaffold-monorepo` (per app) and called back into by `scaffold-agents-md` / `readme-writer` when a repo needs its structure before its docs.
