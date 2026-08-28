# The target trees

Three trees, because a workspace holds three different shapes. Read the one you need:

| Tree                                     | What it covers                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [The workspace](#the-workspace-tree)     | The root — `apps/`, `packages/`, `functions/`, `extensions/`, and the config that governs them        |
| [A frontend app](#the-frontend-app-tree) | Every app under `apps/` that renders pages. Same kinds as standalone, holding only what that app owns |
| [A backend app](#the-backend-app-tree)   | `apps/api` — route handlers over a service layer, Firebase-flavoured                                  |

Folders first then files, each alphabetical. Every line is annotated, and anything conditional says what turns it on.

**Read an unmarked line as required, not as an example.** A file named here without an "only if" is part of the standard: something else in the tree assumes it exists. `REQUIRED if <feature>` marks the ones whose trigger is a feature rather than the framework — a client hook that is the only half of a server feature the browser can run, for instance. The `<domain>`- and `<name>`-style placeholders are the only genuinely illustrative lines, and they say so by being placeholders.

**A monorepo mirrors the single app as closely as possible — same kinds, same `<domain>.<kind>.ts` grammar, same one-explicit-export barrels.** What changes is only _where_ a kind lives, never its shape. The rules behind the shape live in `code-structure`.

Four consequences worth stating, because they are where a monorepo actually differs:

- **Every kind exists in both places, and consumer count decides which — that one rule replaces every "does this folder still exist" question.** `packages/hooks` and an app's `lib/hooks/` are the same kind under the same grammar: **two or more consumers → the package; one → that app.** So `components/ui/`, `lib/hooks/`, `lib/utils/`, `lib/constants/` and the rest **do not disappear from a workspace app** — they keep exactly what only that app uses. A one-app-only date formatter belongs in `apps/web/src/lib/utils/`, and hoisting it to `packages/utils` to look tidy makes every other app rebuild for a change none of them care about. Moving one either way is a file move and an import swap, never a rewrite — so start local and promote when the second consumer appears.
- **What the tree below shows is the thin end of that rule, not a ceiling.** Each app-local folder is drawn with the little that is genuinely app-scoped, because that is the case people get wrong: they scaffold all seven kinds full of code the packages already own. Read a sparse folder as "this holds what is yours alone", never as "this may not grow". An app can legitimately carry a large `lib/utils/` and a full `components/ui/` — a fullstack app inside a workspace often does.
- **`apps/` is for deployables, and the list below is a menu.** `web` is the default; the interview decides the rest. `admin` earns its own app when ops needs a separate domain and auth surface — otherwise it stays the `(admin)` route group inside `web`. `storybook` **is deployable**: on a team with designers or reviewers who need to open a URL and click the real components, it gets a host and an auth gate like any other app. Solo, it stays a local `dev` surface.
- **Every app and every package carries its own `README.md` and `AGENTS.md`.** No exceptions, including config-only packages. The root files cover the workspace; the local ones cover what only that folder knows, and the closest file wins.

## The workspace tree

```txt
.
|___ _docs/                              # workspace docs - guides, specs, runbooks
|    |___ README.md                      # the folder map, and which doc a newcomer reads first
|___ _reports/                           # audit output, committed - the diff shows what got fixed
|    |___ README.md                      # each report, how to refresh it, how to read severity
|___ .claude/                            # Claude Code config for the whole workspace
|    |___ agents/                        # workspace-only subagents, if any
|    |___ skills/                        # workspace-only skills, if any
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
|    |    |___ ci.yml                    # one job graph, `turbo --affected`
|    |    |___ codeql.yml                # SAST scanning on push and PR
|    |    |___ issue-label.yml           # labels issues from their template
|    |    |___ label.yml                 # path-based PR labels, driven by labeler.yml
|    |    |___ pr-title.yml              # PR titles must be Conventional Commits; only if team-maintained
|    |    |___ release-notes.yml         # drafts notes from merged PRs
|    |    |___ stale.yml                 # closes abandoned issues and PRs
|    |___ CODEOWNERS                     # required reviewers per path; only if team-maintained
|    |___ dependabot.yml                 # grouped version updates; only if updates = Dependabot (default)
|    |___ labeler.yml                    # the path -> label map label.yml reads
|    |___ pull_request_template.md       # the checklist every PR opens with
|    |___ release-notes.yml              # release-note categories and their labels
|___ .husky/                             # git hooks, installed by `prepare`
|    |___ commit-msg                     # runs commitlint; only if team-maintained
|    |___ pre-commit                     # runs lint-staged + affected typecheck
|___ .vscode/                            # editor defaults shared with contributors
|    |___ extensions.json                # recommends the Biome extension
|    |___ settings.json                  # format-on-save via Biome
|___ apps/                               # deployable surfaces, one folder each
|    |___ admin/                         # a frontend app - only when ops needs its own
|    |                                   # domain and auth; otherwise it is web's (admin) group
|    |___ api/                           # the backend - see The backend app tree below
|    |___ help-center/                   # a frontend app - only when support content is public
|    |___ storybook/                     # documents packages/ui. A real app, not a dev
|    |    |                              # script: on a team, designers and reviewers open a
|    |    |                              # URL and click the actual components instead of
|    |    |                              # asking for a build. The hosting files below are
|    |    |                              # the optional part - drop them and it stays a
|    |    |                              # local `dev` surface; the rest of the tree is
|    |    |                              # the same either way
|    |    |___ .storybook/               # the only Storybook config in the workspace
|    |    |    |___ main.ts              # the stories glob, addons, framework
|    |    |    |___ preview.tsx          # both stylesheets, the theme decorator, a11y config
|    |    |    |___ vitest.setup.ts      # the browser-mode setup the test addon needs
|    |    |___ public/                   # icons, and any fixture image a story renders
|    |    |___ src/
|    |    |    |___ _Template.stories.tsx  # copy this to start a new story file. The ONLY
|    |    |    |                         # story file in this app: every real one lives beside
|    |    |    |                         # its component in packages/ui, and main.ts reaches
|    |    |    |                         # them with a glob. A mirrored stories/base,
|    |    |    |                         # stories/blocks tree here would be a second copy of
|    |    |    |                         # the tier structure to keep in sync, and it silently
|    |    |    |                         # rots the moment a component is renamed or retiered.
|    |    |    |                         # The tier comes from the story `title`, which is
|    |    |    |                         # what groups the sidebar
|    |    |    |___ styles/
|    |    |         |___ globals.css     # the UNPREFIXED compile of the shared layers, and
|    |    |                              # BOTH stylesheets are load-bearing: preview.tsx
|    |    |                              # imports the built `ui:` CSS so components render
|    |    |                              # as shipped, and this one so a story's own wrapper
|    |    |                              # markup can use plain utilities. Load only the
|    |    |                              # prefixed sheet and every wrapper class is inert;
|    |    |                              # load only this one and the components are unstyled.
|    |    |                              # packages/ui must build before Storybook starts
|    |    |___ .env.local                # only what a story needs; gitignored
|    |    |___ .gitignore                # storybook-static/ and the build cache
|    |    |___ AGENTS.md                 # the tier rules and the two-stylesheet gotcha
|    |    |___ apphosting.yaml           # only if hosted: serves the static build, and puts
|    |    |                              # it behind auth. A public Storybook publishes every
|    |    |                              # unreleased component and its props
|    |    |___ eslint.config.mjs         # extends @app/eslint-config, and adds
|    |    |                              # ignores: ["storybook-static/**"] - the shared
|    |    |                              # config only ignores dist/, so lint otherwise
|    |    |                              # scans this app's own build output
|    |    |___ package.json              # depends on every package it documents, and never
|    |    |                              # the reverse - the harness knows the components,
|    |    |                              # not the other way round
|    |    |___ README.md                 # how to run it, and how to add a story
|    |    |___ tsconfig.json             # extends @app/typescript-config/react-library -
|    |    |                              # a Vite app, so a bundler resolves its imports
|    |    |___ vite.config.ts            # aliases packages/ui to source, not dist
|    |___ web/                           # the default frontend - see The frontend app tree below
|___ extensions/                         # installed Firebase Extensions, committed as config
|    |___ firestore-algolia-search.env   # the instance's settings; no secrets, those are params
|    |___ firestore-send-email.env       # one .env per installed instance, named for it
|    |___ storage-resize-images.env      # one .env per installed instance, named for it
|___ functions/                          # deployed workers, one codebase per folder
|                                        # each is its own package with its own deps, so a
|                                        # cold start loads one worker's tree and nothing else
|    |___ photo-worker/                  # example: resize and re-encode on upload
|    |    |___ src/
|    |    |    |___ handlers/            # one file per trigger; the entry does no work itself
|    |    |    |___ lib/                 # the same kinds an app has, scoped to this worker
|    |    |    |___ index.ts             # exports each trigger; the only file Firebase reads
|    |    |___ .env.example              # the worker's own secrets; no values
|    |    |___ .env.<project-id>         # per-project runtime config, one file per tier
|    |    |___ package.json              # its own deps; never hoists the whole workspace
|    |    |___ tsconfig.json             # extends @app/typescript-config/node-library:
|    |    |                              # a Cloud Function is loaded by Node, so it needs the
|    |    |                              # same NodeNext resolution contracts does. outDir lib/,
|    |    |                              # which is the folder firebase.json deploys
|    |___ search-indexer/                # example: mirror documents into the search index
|    |___ .gitignore                     # lib/ - the compiled output is never committed
|    |___ package.json                   # the codebases map firebase.json points at
|    |___ tsconfig.json                  # the shared base each worker's config extends
|___ packages/                           # shared code, never deployed on its own
|                                        # a package holds the SHARED part of a kind; each
|                                        # app keeps the same kind for its own:
|                                        #   hooks -> packages/hooks   utils -> packages/utils
|                                        #   constants + schemas + types -> packages/contracts
|                                        # config and data have no package at all: env, routes,
|                                        # and site differ per deployment, and data is that
|                                        # app's own content
|    |___ contracts/                     # everything both sides of the wire must agree on
|    |    |                              # named for what it holds, not for one of its four
|    |    |                              # kinds - `schemas/` would undersell the constants,
|    |    |                              # types, and permission verbs sitting beside them
|    |    |___ src/
|    |    |    |___ constants/           # flat, one file per domain
|    |    |    |    |___ auth.constant.ts  # the const and its inferred type together
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ <domain>.constant.ts  # one domain's frozen values
|    |    |    |___ permissions/         # the closed verb list, the role map, and can()
|    |    |    |    |___ can.ts          # the one predicate every guard calls; pure, so
|    |    |    |    |                    # the UI calls it too to hide what it cannot do
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ permission.constant.ts  # every verb, grouped by intent
|    |    |    |    |___ role-hierarchy.ts  # who outranks whom, when roles nest
|    |    |    |    |___ role-permission.constant.ts  # the role -> verbs map
|    |    |    |___ schemas/             # Zod schemas; the parse boundary
|    |    |    |    |___ auth.schema.ts  # the schema and its inferred type together
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ shared.schema.ts  # timestamp, pagination, email - the primitives
|    |    |    |    |___ <domain>.schema.ts  # one domain's schemas
|    |    |    |___ types/               # only shapes no schema or const infers
|    |    |    |    |___ api.type.ts     # the response envelope every caller unwraps
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |___ index.ts             # re-exports every kind. Relative imports carry the
|    |    |                              # `.js` extension here - see node-library.json below
|    |    |___ AGENTS.md                 # the Zod-vs-plain-type rule, and the .js extension
|    |    |___ eslint.config.mjs         # extends @app/eslint-config. Every package with
|    |    |                              # source of its own has one - a package that opts
|    |    |                              # out is a package CI does not lint
|    |    |___ package.json              # zod is a real dependency. `build` is plain `tsc`;
|    |    |                              # nothing post-processes the output; `dev` is
|    |    |                              # `tsc --watch` so consumers see edits during pnpm dev
|    |    |___ README.md                 # what belongs here and what does not
|    |    |___ tsconfig.json             # extends @app/typescript-config/node-library,
|    |                                   # because the API loads this package from Node
|    |___ eslint-config/                 # the shared lint config, one owner. Named for the
|    |                                   # linter it configures, not for linting in general -
|    |                                   # a move to Biome replaces the formatter too, so that
|    |                                   # would be a new package, not a renamed one
|    |    |___ AGENTS.md                 # which config a target extends, and why
|    |    |___ base.js                   # the rules every workspace file obeys
|    |    |___ next.js                   # base + the framework's own plugin rules
|    |    |___ package.json              # exports the configs; eslint is a peer dep
|    |    |___ react-internal.js         # base + the React rules, for the packages
|    |    |___ README.md                 # the rule set, and how to add one
|    |___ hooks/                         # cross-app React hooks, grouped by concern
|    |    |                              # flat only while there are a handful; a workspace
|    |    |                              # reaches dozens, so these are folders from the start
|    |    |                              # Only GENERIC hooks belong here - the ones any
|    |    |                              # project of this shape needs. A hook that names a
|    |    |                              # product noun (an album, a photo queue, an export
|    |    |                              # format) is that product's, and lives in the app
|    |    |                              # that owns it however many apps end up calling it
|    |    |___ src/
|    |    |    |___ auth/                # the whole client-side auth surface. ALL of it is
|    |    |    |    |                    # required once auth = Firebase: each hook is one
|    |    |    |    |                    # flow the SDK exposes only on the client, and a
|    |    |    |    |                    # missing one is a flow the product cannot offer
|    |    |    |    |___ AuthProvider.tsx  # the bridge: the server fetches the user and
|    |    |    |    |                    # passes it in, this tracks the role from custom
|    |    |    |    |                    # claims for UI gating. Returns JSX, so it is a
|    |    |    |    |                    # component; no client-side token plumbing
|    |    |    |    |___ index.ts        # the group barrel
|    |    |    |    |___ types.ts        # the Server Action shapes these hooks are handed
|    |    |    |    |___ use-email-link-sign-in.ts  # completes a passwordless sign-in on
|    |    |    |    |                    # landing. Part of the base surface, not an extra:
|    |    |    |    |                    # an invite and a first-time onboard both land on
|    |    |    |    |                    # that link, and only the client SDK can redeem it
|    |    |    |    |___ use-email-verification.ts  # sends and re-sends the verify mail
|    |    |    |    |___ use-forgot-password.ts  # requests the reset mail
|    |    |    |    |___ use-login.ts    # the same `use-<subject>.ts` grammar as an app
|    |    |    |    |___ use-logout.ts   # revokes, then clears the cookie server-side
|    |    |    |    |___ use-reset-password.ts  # completes the reset from the emailed code
|    |    |    |    |___ use-signup.ts   # creates, then hands off to the session route
|    |    |    |___ data/                # the client half of a server-resolved feature -
|    |    |    |    |                    # each one reads what the server already decided,
|    |    |    |    |                    # and none of them fetches a domain of its own
|    |    |    |    |___ FeatureFlagProvider.tsx  # REQUIRED if flags = yes: takes the
|    |    |    |    |                    # server-resolved flags, so no app re-fetches them
|    |    |    |    |___ index.ts        # the group barrel
|    |    |    |    |___ use-cursor-load-more.ts  # REQUIRED if the API paginates by cursor -
|    |    |    |    |                    # it is what makes an opaque cursor usable in the UI
|    |    |    |    |___ use-feature-flag.ts  # REQUIRED if flags = yes: reads the provider
|    |    |    |    |                    # above, single and plural. Nothing calls the flag
|    |    |    |    |                    # endpoint directly from a component
|    |    |    |    |___ use-list-params.ts  # keeps filters and page in the URL, so a list
|    |    |    |    |                    # view is linkable and survives a refresh
|    |    |    |    |___ use-maintenance-window.ts  # REQUIRED if a kill switch = yes: the
|    |    |    |                         # 503 boundary needs the window when the cached
|    |    |    |                         # layout value was stale, and this endpoint is the
|    |    |    |                         # one the proxy allow-lists during maintenance
|    |    |    |___ profile/             # who the caller is and what they may do. Its own
|    |    |    |    |                    # group, not part of auth/ - auth answers "are you
|    |    |    |    |                    # signed in", this answers "may you do this", and
|    |    |    |    |                    # they change for different reasons
|    |    |    |    |___ index.ts        # the group barrel
|    |    |    |    |___ use-permission.ts  # REQUIRED if RBAC = yes. Wraps the pure `can()`
|    |    |    |                         # from @app/contracts, resolving the actor from the
|    |    |    |                         # auth context so a component asks `can(verb)` and
|    |    |    |                         # never re-derives a role. The UI gate only - the
|    |    |    |                         # route guard runs the same predicate server-side,
|    |    |    |                         # and that is the one that actually protects data
|    |    |    |___ ui/                  # everything that only touches the DOM. The most
|    |    |    |    |                    # portable group: none of these knows a domain
|    |    |    |    |___ ThemeProvider.tsx  # REQUIRED for dark mode: owns the class the
|    |    |    |    |                    # `dark:` variant reads, paired with the inline
|    |    |    |    |                    # <ThemeScript /> in <head> so the first paint
|    |    |    |    |                    # matches SSR instead of flashing
|    |    |    |    |___ index.ts        # the group barrel
|    |    |    |    |___ use-click-outside.ts  # closes menus, popovers, and overlays
|    |    |    |    |___ use-cookie-consent.ts  # REQUIRED if consent = yes: the category
|    |    |    |    |                    # state every gated script reads before loading
|    |    |    |    |___ use-countdown.ts  # REQUIRED wherever a resend is rate-limited: the
|    |    |    |    |                    # UI has to show what the server will enforce, or
|    |    |    |    |                    # the user just gets a silent 429
|    |    |    |    |___ use-form-error-scroll.ts  # moves focus to the first invalid field,
|    |    |    |    |                    # which `accessibility` requires of every form
|    |    |    |    |___ use-media-query.ts  # the only way to branch on a breakpoint in JS,
|    |    |    |    |                    # since a `ui:` class cannot toggle display
|    |    |    |    |___ use-object-url.ts  # File -> preview URL, revoked on cleanup. Takes
|    |    |    |    |                    # one file or a keyed list; the list form exists
|    |    |    |    |                    # because a per-item hook leaks every URL for an
|    |    |    |    |                    # item that unmounts while still in flight
|    |    |    |    |___ use-scroll-to-top.ts  # pairs with use-form-error-scroll: focus moves
|    |    |    |    |                    # to the bad field, this brings the error summary
|    |    |    |    |                    # into view. A form that fails below the fold looks
|    |    |    |    |                    # like a form that did nothing
|    |    |    |    |___ use-visibility-change.ts  # refetch when the tab regains focus,
|    |    |    |                         # which is how a live-ish view avoids a poll timer
|    |    |    |___ index.ts             # re-exports every group
|    |    |___ AGENTS.md                 # when a hook is promoted here, and when it is not
|    |    |___ eslint.config.mjs         # extends @app/eslint-config/react-internal
|    |    |___ package.json              # peer-depends on react, never bundles it
|    |    |___ README.md                 # the groups, and what each is for
|    |    |___ tsconfig.json             # extends @app/typescript-config/react-library
|    |___ tailwind-config/               # the shared token and theme source. The SAME six
|    |    |                              # layers a single app keeps in src/styles/, moved
|    |    |                              # here whole - same names, same order, same jobs.
|    |    |                              # Only the ENTRY differs: standalone, globals.css
|    |    |                              # owns the order; here shared-styles.css does, and
|    |    |                              # each app's globals.css shrinks to importing this
|    |    |                              # plus its own composed classes
|    |    |___ fonts/                    # the self-hosted faces every app loads. Here rather
|    |    |    |                         # than in each app's public/, so two apps cannot
|    |    |    |                         # ship different weights of the same family
|    |    |    |___ <family>-<weight>.woff2  # one file per weight actually used
|    |    |___ AGENTS.md                 # the import order, and the `ui:` prefix rule
|    |    |___ animations.css            # 6th import - @keyframes and the classes using them
|    |    |___ base.css                  # 3rd import - element defaults, in @layer base
|    |    |___ components.css            # 5th import - authored classes, in @layer components
|    |    |___ package.json              # exports the CSS, no JS: the bundled entry AND each
|    |    |                              # layer individually, because packages/ui imports
|    |    |                              # them one by one - an unprefixed @apply preset
|    |    |                              # cannot load inside a prefix(ui) build
|    |    |___ postcss.config.js         # the Tailwind v4 plugin, shared by every consumer
|    |    |___ README.md                 # what each layer owns
|    |    |___ shared-styles.css         # the entry each app imports; the only file that
|    |    |                              # lists the six layers, so the order lives once
|    |    |___ theme.css                 # 2nd import - @theme inline maps the vars to utilities
|    |    |___ tokens.css                # 1st import - the raw vars + the .dark overrides
|    |    |___ utilities.css             # 4th import - @utility definitions and motion tokens
|    |___ typescript-config/             # base configs every app and package extends. The
|    |    |                              # split below is by WHO RESOLVES THE IMPORTS, which
|    |    |                              # is the one thing moduleResolution encodes
|    |    |___ AGENTS.md                 # which config a target extends, and why
|    |    |___ base.json                 # the strict flags every target shares, and nothing
|    |    |                              # that assumes a consumer - no moduleResolution here
|    |    |___ nextjs.json               # base + `Bundler` + jsx; the framework resolves
|    |    |___ node-library.json         # base + `NodeNext`, for a package NODE loads: the
|    |    |                              # API importing @app/contracts, a script importing
|    |    |                              # @app/utils. TypeScript then REQUIRES the `.js`
|    |    |                              # extension on relative imports and errors without
|    |    |                              # it, so plain `tsc` emits something Node can load.
|    |    |                              # Writing `./thing.js` in a .ts file looks wrong and
|    |    |                              # is correct - it is the path the runtime resolves,
|    |    |                              # and it is what the ESM spec requires. Set
|    |    |                              # `Bundler` here instead and the build silently
|    |    |                              # emits extensionless imports that only fail at
|    |    |                              # runtime, as ERR_MODULE_NOT_FOUND naming a file
|    |    |                              # that plainly exists - patching that output with a
|    |    |                              # post-build script treats the symptom
|    |    |___ package.json              # exports the four; nothing to build
|    |    |___ react-library.json        # base + `Bundler` + jsx, for a package that ships
|    |    |                              # components; every consumer is a bundler
|    |    |___ README.md                 # the four, and when each applies
|    |___ ui/                            # the design system - the six tiers, `ui:` prefix.
|    |                                   # Every component folder carries its own story; the
|    |                                   # Storybook app only globs them
|    |    |___ src/
|    |    |    |___ assets/              # the brand marks, as components not files
|    |    |    |    |___ illustrations/  # the empty-state and error art
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |    |___ Logo.tsx        # every variant as a prop, not four files
|    |    |    |___ base/                # atoms: render one thing, no sub-components
|    |    |    |    |___ Button/         # one folder per component, exactly as in an app:
|    |    |    |    |    |                # index.tsx IS the component, its STORY beside it,
|    |    |    |    |    |                # and a test
|    |    |    |    |    |                # only where there is behaviour
|    |    |    |    |    |___ Button.stories.tsx  # beside the component, never in the
|    |    |    |    |    |                # Storybook app. `title: "Base/Button"` is what
|    |    |    |    |    |                # puts it in the sidebar tier
|    |    |    |    |    |___ Button.test.tsx  # disabled and loading have logic
|    |    |    |    |    |___ index.tsx  # the component - utilities are WRITTEN `ui:`-prefixed
|    |    |    |    |    |                # (`ui:flex`), per tailwind-css: the prefix is this
|    |    |    |    |    |                # library's namespace, so its classes cannot clash
|    |    |    |    |    |                # with an app's bare utilities or another library's
|    |    |    |    |    |                # prefix. Only hand-authored class names
|    |    |    |    |    |                # (`btn-primary`) stay bare. `ui:` never appears in
|    |    |    |    |    |                # app code - there it fails silently
|    |    |    |    |___ ThemeScript/     # REQUIRED for dark mode, and it is a component
|    |    |    |    |    |                # rather than a hook because it must run as an
|    |    |    |    |    |                # inline <script> in <head>, before hydration -
|    |    |    |    |    |                # the ThemeProvider in packages/hooks cannot do
|    |    |    |    |    |                # that, so the two ship as a pair
|    |    |    |    |    |___ index.tsx  # the component - sets the class from localStorage + the OS
|    |    |    |    |                    # preference, so the first paint matches SSR. No
|    |    |    |    |                    # story - an inline script renders nothing to show
|    |    |    |    |___ index.ts        # the tier barrel, one line per folder
|    |    |    |___ blocks/              # composed of base, owns its own state
|    |    |    |    |___ <Name>/         # same four-file folder as base/. Filed by the six
|    |    |    |    |                    # behaviour subcategories - Disclosure, Display,
|    |    |    |    |                    # Feedback, Forms, Navigation, Overlay - which live
|    |    |    |    |                    # in the story TITLE ("Blocks/Forms/PasswordInput"),
|    |    |    |    |                    # never in folder names. One place to retier a
|    |    |    |    |                    # component, and it is a one-line edit
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |___ icons/               # one component per icon, plus the named sets
|    |    |    |    |___ index.ts        # the tier barrel
|    |    |    |    |___ <name>.tsx      # a single glyph, sized by prop
|    |    |    |    |___ <domain>-icons.ts  # a named map, so callers never switch on strings
|    |    |    |___ layouts/             # the page shells apps render
|    |    |    |___ patterns/            # whole page regions the layouts slot in
|    |    |    |___ styles/              # this package's own compile, prefixed `ui:`
|    |    |    |    |___ components.css  # the authored classes, consumed UNPREFIXED in JSX
|    |    |    |    |___ index.css       # imports the shared layers, then prefix(ui)
|    |    |    |___ cn.ts                # `extendTailwindMerge({ prefix: "ui" })` here
|    |    |    |___ globals.d.ts         # the CSS-module and asset declarations
|    |    |    |___ index.ts             # re-exports every tier
|    |    |___ AGENTS.md                 # the tier ladder and the four `ui:` gotchas
|    |    |___ eslint.config.mjs         # extends @app/eslint-config/react-internal
|    |    |___ package.json              # exports map: each tier, plus the built CSS.
|    |    |                              # @storybook/react is a devDependency here, because
|    |    |                              # the colocated stories import Meta and StoryObj -
|    |    |                              # without it this package's own check-types fails.
|    |    |                              # It never becomes a real dependency: story files
|    |    |                              # are excluded from the build include, so nothing
|    |    |                              # Storybook-related ships to a consumer
|    |    |___ README.md                 # the tiers, and where a new component goes
|    |    |___ tsconfig.json             # extends @app/typescript-config/react-library
|    |    |___ turbo.json                # `extends: ["//"]` - Turborepo's own Package
|    |    |                              # Configuration, not an escape hatch. This is the
|    |    |                              # only package that builds TWO things, CSS and
|    |    |                              # components, so it splits build into build:styles
|    |    |                              # and build:components here rather than making
|    |    |                              # every other package carry tasks it does not have
|    |___ utils/                         # the portable helpers every app reuses
|    |    |___ src/
|    |    |    |___ server/              # utils that must never reach a browser
|    |    |    |    |___ api.ts          # the typed fetch wrapper, session attached
|    |    |    |    |___ crypto.ts       # hashing and constant-time compare
|    |    |    |    |___ index.ts        # its own barrel, marked `server-only`. That marker
|    |    |    |                         # THROWS under plain Node (it is inert only under the
|    |    |    |                         # react-server condition) - a workspace script needs
|    |    |    |                         # the compiled file directly, never this barrel
|    |    |    |___ date.utils.ts        # the same `<domain>.utils.ts` grammar
|    |    |    |___ index.ts             # one explicit export line per file, each with `.js`
|    |    |    |___ string.utils.ts      # slugify, truncate, initials
|    |    |    |___ string.utils.test.ts # colocated, as in an app
|    |    |___ AGENTS.md                 # the purity rule, and the server/ boundary
|    |    |___ eslint.config.mjs         # extends @app/eslint-config
|    |    |___ package.json              # zero runtime deps, so any app can take it
|    |    |___ README.md                 # what belongs here and what does not
|    |    |___ tsconfig.json             # extends @app/typescript-config/node-library -
|    |                                   # the API and the workspace scripts load this
|    |                                   # package from Node, not through a bundler
|    |    |___ vitest.config.ts          # the package runs its own tests
|___ scripts/                            # workspace maintenance, run by hand or by CI
|    |___ check-catalog.mjs              # fails if an app pins a version the catalog owns
|    |___ env-setup.mjs                  # writes each app's .env from the tier you name
|    |___ run-affected.mjs               # the wrapper every affected-only script calls -
|    |                                   # resolves the real base SHA (first push, shallow
|    |                                   # clone, and forced-push all break `--affected`),
|    |                                   # then hands turbo one filter. Without it CI either
|    |                                   # rebuilds the world or silently tests nothing
|    |___ seed-labels.mjs                # reconciles the GitHub labels labeler.yml and the
|    |                                   # release-note categories reference; a label that
|    |                                   # exists only in YAML silently applies to nothing
|    |___ sync-env-example.mjs           # every app's .env.example matches its schema
|___ .firebaserc                         # project alias per tier; the deploy target map
|___ .editorconfig                       # whitespace rules every editor honours
|___ .gitignore                          # includes .env*, build output, .turbo
|___ .npmrc                              # only host-specific settings, e.g. node-linker
|___ .nvmrc                              # one Node version for devs, CI, and the host
|___ .prettierignore                     # md/mdx only - Biome owns JS/TS/JSON
|___ .prettierrc.json                    # prose formatting, proseWrap preserve
|___ AGENTS.md                           # workspace-wide conventions for agents
|___ biome.json                          # the single lint + format owner for JS/TS/JSON
|___ CLAUDE.md                           # one line: `@AGENTS.md`
|___ commitlint.config.ts                # Conventional Commits via commit-msg; only if team-maintained
|___ firebase.json                       # only when the backend is Firebase: which codebase
|                                        # each functions/ folder is, the rules and index files
|                                        # below, emulator ports, and the hosting targets
|___ firestore.indexes.json              # every composite index, committed - a query that
|                                        # needs one fails in production until it is deployed
|___ firestore.rules                     # deny by default; the client reads nothing the
|                                        # service layer should be reading for it
|___ storage.public.rules                # one rules file per bucket, named for the bucket -
|___ storage.uploads.rules               # public reads and authenticated writes have nothing
|                                        # in common, and one file for both means the looser
|                                        # rule governs the stricter bucket by accident
|___ lint-staged.config.mjs              # what pre-commit runs, staged files only
|___ package.json                        # root scripts only - never app dependencies
|___ pnpm-lock.yaml                      # ONE lockfile for the whole workspace, at the root
|                                        # and nowhere else. A lockfile inside an app means
|                                        # that app resolved its own versions, which is the
|                                        # single-version guarantee gone
|___ pnpm-workspace.yaml                 # workspace globs, the catalog, the allowBuilds map
|___ README.md                           # the map: what each app and package is
|___ renovate.json                       # dependency updates; only if updates = Renovate
|___ turbo.json                          # the task graph, cache inputs, strict env
```

## The frontend app tree

Every app under `apps/` that renders pages — `web`, `admin`, `help-center` — is this tree, rooted at `apps/<name>/`.

> **The kinds are the same; what changes is how much of each stays here.** Only two rows below are structural — everything else is the same folder holding less, because a package now covers the shared part. **A kind is never deleted from an app for being "a package's job".** Sparse in this tree means "this holds what only this app uses"; it does not mean the folder is forbidden or capped, and an app that genuinely owns a lot legitimately has a lot here.
>
> | In a standalone app                    | In a workspace app                                                                                                                                                                                                                                                                                           |
> | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | `src/app/`                             | **structural:** `app/` at the app root — `src/` holds only what the `@/*` alias covers, and routes are not imported                                                                                                                                                                                          |
> | `src/styles/` (six layers + entry)     | **structural:** the same file names, but only the ones this app authors — its `globals.css` entry and its own `components.css`. The six shared layers move whole into `packages/tailwind-config`, keeping their names, order, and jobs; duplicating one per app is how two apps end up with different tokens |
> | `src/components/ui/` (the tiers)       | the same tiers, holding **this app's own** reusables — the ones no sibling app wants yet. Anything a second app needs is promoted to `packages/ui`; until then it belongs right here                                                                                                                         |
> | `lib/hooks/`                           | this app's own hooks. The cross-app ones are `packages/hooks`, grouped by concern                                                                                                                                                                                                                            |
> | `lib/utils/`                           | this app's own helpers. A formatter only `web` calls stays in `web` — hoisting it makes every other app rebuild for a change none of them care about                                                                                                                                                         |
> | `lib/constants/`, `schemas/`, `types/` | whatever one app alone knows: its nav links, its own form shapes, its local view models. The cross-boundary contract is `packages/contracts`                                                                                                                                                                 |
> | `lib/server/` — the full nine kinds    | the readers and actions **this app's own pages** need. An app that gets everything from `apps/api` may have none at all — `help-center`, rendering static prose, has neither that nor `data/` — while a fullstack app in a workspace has all of it                                                           |
>
> Root config also thins out: no `biome.json`, `commitlint.config.ts`, `.husky/`, `.github/`, `.nvmrc`, `renovate.json`, `lint-staged.config.mjs`, or lockfile in an app — those govern the whole workspace and live at its root, where `turbo` and the hooks can see them. What stays per-app is what genuinely differs per deployment: its env, its Next config, its hosting config, and its own docs.

```txt
apps/web/
|___ _docs/                              # only docs specific to THIS app; the shared ones
|    |                                   # are at the workspace root, and are not repeated
|    |___ README.md                      # the folder map, and what is at the root instead
|___ .claude/                            # app-scoped Claude config; the root's still apply
|    |___ settings.json                  # only what differs from the workspace settings
|___ app/                                # ROUTES ONLY, at the app root - not under src/.
|                                        # Nothing imports a route file, so it does not
|                                        # belong behind the `@/*` alias that src/ owns
|    |___ (public)/                      # the routes any visitor can reach, sharing a layout
|    |    |___ about/                    # route segment
|    |    |    |___ page.tsx             # thin entry, imports the composed page
|    |    |___ pricing/                  # route segment
|    |    |    |___ page.tsx             # thin entry, imports the composed page
|    |    |___ layout.tsx                # renders MarketingLayout + this app's nav constant
|    |    |___ page.tsx                  # thin entry, imports the composed home page
|    |___ (dashboard)/                   # the signed-in routes, behind one guard
|    |    |___ dashboard/                # real segment, so every URL here starts /dashboard
|    |    |    |___ overview/            # route segment
|    |    |    |    |___ page.tsx        # thin entry, imports the composed page
|    |    |    |___ settings/            # route segment
|    |    |         |___ page.tsx        # thin entry, imports the composed page
|    |    |___ error.tsx                 # thin client entry; covers the group, not one page
|    |    |___ layout.tsx                # renders DashboardLayout; the session guard stays here
|    |    |___ loading.tsx               # the group's Suspense fallback
|    |___ api/                           # only what THIS app must serve itself - the session
|    |                                   # cookie handoff, a revalidation hook, an OG route.
|    |                                   # Everything else is apps/api; a frontend app that
|    |                                   # grows a real API surface is two apps in one folder
|    |___ maintenance-bypass/            # sets the cookie the proxy checks; only if a
|    |    |                              # kill switch = yes, and only on the app that has one
|    |    |___ route.ts                  # 404s on a bad token, so the path stays unguessable
|    |___ unauthorized/                  # where a failed guard sends a signed-out visitor
|    |    |___ page.tsx                  # thin entry, imports the composed page
|    |___ apple-icon.png                 # iOS home-screen icon; tag injected too
|    |___ error.tsx                      # thin client entry, fallback for groups with none
|    |___ favicon.ico                    # legacy fallback; only works at the app root
|    |___ fonts.ts                       # the loaded faces, so the layout imports one module
|    |___ global-error.tsx               # catches the root layout; self-contained, no app styles
|    |___ icon.svg                       # .svg or .png; wins over the .ico where supported
|    |___ layout.tsx                     # imports globals.css, renders providers.tsx
|    |___ manifest.ts                    # generated; a public/site.webmanifest would win instead
|    |___ not-found.tsx                  # thin entry, imports the composed 404
|    |___ opengraph-image.tsx            # ImageResponse OG card
|    |___ providers.tsx                  # every client provider from @app/hooks, in one
|    |                                   # place, so layout.tsx stays a server component.
|    |                                   # This is where the required ones get wired -
|    |                                   # AuthProvider (auth = Firebase), ThemeProvider
|    |                                   # (dark mode), FeatureFlagProvider (flags = yes) -
|    |                                   # each handed values the SERVER already resolved,
|    |                                   # never left to fetch for itself on the client
|    |___ robots.ts                      # generated; a public/robots.txt would silently win
|    |___ sitemap.ts                     # generated from config/routes.ts, never a static file
|___ public/                             # served at this app's domain root; the subfolders are ours
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
|___ scripts/                            # only this app's own one-offs; the workspace
|                                        # scripts live at the root and are not repeated
|___ src/                                # everything importable, behind the `@/*` alias
|    |___ assets/                        # things this app's code imports. The brand marks
|    |                                   # every app shares are packages/ui/assets; imagery
|    |                                   # only this app renders belongs here
|    |    |___ images/                   # imported, so dimensions are inferred
|    |___ components/                    # .tsx only (+ colocated tests). Same folders as a
|    |                                   # standalone app: _shared/, one per feature, and a
|    |                                   # `ui/` tier for this app's OWN reusables
|    |    |___ _shared/                  # widgets several of THIS app's features use;
|    |    |    |                         # grouped by concern, each group with a barrel of its
|    |    |    |                         # client-safe exports; no root _shared barrel
|    |    |    |___ PageHeader.tsx       # the title + description pair every page repeats,
|    |    |    |                         # if it is app-specific; if two apps want it, it is
|    |    |    |                         # a packages/ui block instead
|    |    |___ dashboard/                # pairs with app/(dashboard)/dashboard/
|    |    |    |___ _shared/             # shared within this feature only
|    |    |    |___ overview/            # pairs with .../overview/
|    |    |    |    |___ index.tsx       # the only thing page.tsx imports
|    |    |    |    |___ StatsSection.tsx  # one file per section
|    |    |    |___ settings/            # pairs with .../settings/
|    |    |         |___ index.tsx       # composes this page's sections
|    |    |         |___ ProfileSection.tsx  # one file per section
|    |    |___ errors/                   # what the error and not-found route files render
|    |    |    |___ error/               # pairs with every error.tsx - a client component
|    |    |    |    |___ index.tsx       # takes the error + reset, renders ui ErrorLayout
|    |    |    |___ global-error/        # pairs with app/global-error.tsx
|    |    |    |    |___ index.tsx       # inlines its styles - globals.css never loads here
|    |    |    |___ not-found/           # pairs with app/not-found.tsx
|    |    |    |    |___ index.tsx       # composes this page's content
|    |    |    |___ unauthorized/        # a real route, unlike the three above
|    |    |         |___ index.tsx       # pairs with app/unauthorized/
|    |    |___ guards/                   # the client-side gates a layout wraps children in
|    |    |    |___ RequireRole.tsx      # hides what can() denies; never the only check
|    |    |___ home/                     # pairs with app/(public)/
|    |    |    |___ HeroSection.tsx      # one file per section
|    |    |    |___ index.tsx            # the only thing page.tsx imports
|    |    |___ pricing/                  # pairs with app/(public)/pricing/
|    |    |    |___ index.tsx            # composes this page's sections
|    |    |    |___ PlansSection.tsx     # one file per section
|    |    |___ ui/                       # this app's OWN reusables, in the same tiers as
|    |         |                         # packages/ui. It is here because a reusable starts
|    |         |                         # app-scoped: you do not know it is shared until a
|    |         |                         # second app asks for it. Promote it then - a file
|    |         |                         # move and an import swap - and not before
|    |         |___ base/                # only the atoms packages/ui does not already have
|    |         |___ blocks/              # this app's own composed pieces
|    |         |___ index.ts             # re-exports this app's tiers, same as the package
|    |___ config/                        # the kind that CANNOT be shared, so it is the one
|    |                                   # that stays. Every value here is per-deployment
|    |    |___ env.ts                    # Zod-validated at boot; fails the deploy, not a request
|    |    |___ firebase.ts               # the client config; public ids, never a secret
|    |    |___ index.ts                  # the kind barrel
|    |    |___ routes.ts                 # every page path in THIS app - no literal paths
|    |    |___ runtime.config.ts         # the per-tier values, keyed off APP_ENV
|    |    |___ seo.ts                    # this app's canonical URL, OG defaults, and handles
|    |___ content/                       # the MDX itself; only if this app ships prose
|    |    |___ guides/                   # one folder per content type, one file per entry
|    |___ lib/                           # the SAME seven kinds a standalone app has, holding
|    |                                   # what only this app uses. Kind-first, flat inside
|    |                                   # each kind. A kind is thin here when a package
|    |                                   # covers most of it, and absent only when this app
|    |                                   # genuinely has none of that kind - never because
|    |                                   # "the package owns it"
|    |    |___ constants/                # this app's own frozen values
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ nav.constant.ts      # the links THIS app's navbar and footer render -
|    |    |                              # every app has different ones, so this rarely moves
|    |    |___ data/                     # static records only this app renders; the kind that
|    |    |    |                         # almost never becomes a package, because content is
|    |    |    |                         # the one thing apps do not share
|    |    |    |___ faq.data.ts          # what this app's own pages read
|    |    |    |___ index.ts             # the kind barrel
|    |    |___ hooks/                    # hooks only THIS app uses. Grouped by concern once
|    |    |    |                         # there are enough to scan past; flat before that
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ use-<subject>.ts     # promoted to packages/hooks when a second app asks
|    |    |___ seo/                      # this app's metadata builders, over @app/utils
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ metadata.ts          # buildMetadata, seeded from config/seo.ts
|    |    |___ server/                   # the readers and actions THIS app's pages need. An
|    |    |    |                         # app that gets everything from apps/api may have
|    |    |    |                         # none of this; a fullstack app in a workspace has
|    |    |    |                         # all nine kinds. What two apps must NOT both hold is
|    |    |    |                         # a `clients/` singleton for the same service - one
|    |    |    |                         # credential in two places is two places it leaks from
|    |    |    |___ actions/             # the mutations this app's own forms invoke
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ <domain>.action.ts  # calls the API, revalidates, returns the result
|    |    |    |___ api.ts               # this app's typed client over @app/utils/server/api,
|    |    |    |                         # with its base URL and session attached
|    |    |    |___ auth.ts              # reads the session cookie, returns the caller
|    |    |    |___ cache.ts             # `use cache` wrappers around the reads this app repeats
|    |    |    |___ index.ts             # the `server-only` barrel
|    |    |___ schemas/                  # forms this app alone has. The cross-boundary
|    |    |    |                         # contract is @app/contracts, and re-declaring one
|    |    |    |                         # of those here is a second source of truth for one
|    |    |    |                         # wire format - that is the only thing banned
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ <domain>.schema.ts   # one app-local form's shape
|    |    |___ types/                    # shapes only this app needs, with no schema or
|    |    |    |                         # const behind them
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ <domain>.type.ts     # one app-local shape
|    |    |___ utils/                    # helpers only this app uses. Thin when
|    |    |    |                         # packages/utils covers the portable ones, and that
|    |    |    |                         # is the normal case - not a rule that it must be
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ <domain>.utils.ts    # promoted to packages/utils on the second consumer
|    |    |___ JsonLd.tsx                # the one component that renders structured data;
|    |                                   # a .tsx in lib/ because nothing else imports it
|    |___ styles/                        # the same file NAMES as a standalone app, but only
|    |    |                              # the ones this app authors. The six shared layers
|    |    |                              # are packages/tailwind-config; a layer duplicated
|    |    |                              # here is how two apps end up with different tokens
|    |    |___ components.css            # this app's own authored classes, in @layer
|    |    |                              # components - same name and same job as standalone,
|    |    |                              # holding only what no sibling app shares
|    |    |___ globals.css               # the only entry a layout imports. Standalone it
|    |    |                              # lists all six layers; here it imports the shared
|    |    |                              # entry, then the built `ui:` CSS, then the file
|    |                                   # above - so the order still lives in exactly one place
|___ .env                                # the tier's real values, written by env-setup.mjs
|                                        # from your local secrets; gitignored, never committed
|___ .env.example                        # this app's secrets only, plus APP_ENV; no values
|___ .gitignore                          # app-local only - .next, next-env.d.ts, .env
|___ AGENTS.md                           # THIS app's facts: its routes, its env, its guards.
|                                        # The workspace conventions are at the root, and the
|                                        # closest file wins
|___ apphosting.yaml                     # the base host config every tier inherits
|___ apphosting.dev.yaml                 # the dev overlay - only what differs from the base
|___ apphosting.prod.yaml                # the prod overlay; secret grants are per-tier, and
|                                        # a missing grant is the top cause of a failed build
|___ apphosting.staging.yaml             # the staging overlay
|___ eslint.config.mjs                   # extends @app/eslint-config/next
|___ next-env.d.ts                       # generated on dev/build; gitignored, never committed
|___ next.config.ts                      # transpiles the workspace packages it consumes,
|                                        # plus cacheComponents, typedRoutes, and the headers
|___ package.json                        # this app's deps, catalog versions
|___ postcss.config.mjs                  # re-exports packages/tailwind-config/postcss.config
|___ proxy.ts                            # the kill-switch gate and header rewrites; at the
|                                        # app root beside app/, never inside src/
|___ README.md                           # what this app is and how to run it
|___ site.metadata.ts                    # the static facts the OG route and manifest read,
|                                        # outside src/ because next.config.ts imports it too
|___ tsconfig.json                       # extends @app/typescript-config/nextjs, `@/*` -> src/*
|___ vitest.config.ts                    # only if this app has its own tests
```

## The backend app tree

`apps/api/` — a Next.js app with **no pages**, only route handlers over a service layer. It is the same `lib/` grammar a frontend app uses, so code moves between the two without restructuring; what differs is that every kind here is server-side, and the route tree is versioned rather than grouped.

This shape corrects four things a hand-grown API drifts into: server code scattered at `src/` root instead of behind one boundary, a `helpers/` folder that means nothing (`naming` rejects it — those are `utils/`), clients filed under whatever imported them first, and a domain folder whose files repeat the domain (`event/event-crud.service.ts` — the folder already said `event`).

```txt
apps/api/
|___ scripts/                            # the operational surface a backend needs and a
|                                        # frontend app does not: seeding, backfills, and
|                                        # provider setup. Committed, because a one-off you
|                                        # ran from your shell is a step nobody can repeat
|    |___ backfills/                     # one file per migration, named for what it fixes
|    |    |___ backfill-<field>.mjs      # idempotent, so a half-finished run can be re-run
|    |___ lib/                           # what the scripts share, so none re-implements it
|    |    |___ env.mjs                   # resolves the tier, so a script cannot hit the
|    |    |                              # wrong project by default
|    |    |___ firebase.mjs              # the Admin SDK, initialised once
|    |    |___ resolve-user.mjs          # takes an email or uid, returns the record
|    |___ seeds/                         # the fixtures a fresh environment needs to work
|    |    |___ seed-<domain>.mjs         # one file per collection it seeds
|    |    |___ seed-firestore-ttls.sh    # the TTL policies; they are per-project, and the
|    |                                   # console is the only other way to set them
|    |___ clear-db.mjs                   # refuses to run against production, by tier check
|    |___ README.md                      # what each script does, and the order to run them
|___ src/
|    |___ app/                           # route handlers only; no page.tsx, no components
|    |    |___ api/
|    |    |    |___ docs/                # the browsable reference and the spec it serves
|    |    |    |    |___ openapi/
|    |    |    |    |    |___ route.ts   # serves the JSON built from the registry
|    |    |    |    |___ route.ts        # serves the human-readable reference
|    |    |    |___ v1/                  # every route is versioned; a breaking change adds v2
|    |    |    |    |___ account/        # what the signed-in caller may change about itself;
|    |    |    |    |                    # separate from admin/users so an escalation bug in
|    |    |    |    |                    # one cannot reach the other
|    |    |    |    |    |___ profile/
|    |    |    |    |    |    |___ route.ts  # GET and PATCH the caller's own record
|    |    |    |    |___ admin/          # operator-only, behind a role check on every route
|    |    |    |    |    |___ audit-logs/
|    |    |    |    |    |    |___ route.ts  # read-only; the trail is append-only
|    |    |    |    |    |___ users/     # the operator surface over other people's records
|    |    |    |    |         |___ [uid]/
|    |    |    |    |         |    |___ route.ts  # GET, PATCH, DELETE one user
|    |    |    |    |         |___ route.ts  # GET list, POST create
|    |    |    |    |___ auth/           # the session lifecycle: the one surface that mints
|    |    |    |    |    |                # cookies, so nothing else needs to know how
|    |    |    |    |    |___ login/
|    |    |    |    |    |    |___ route.ts  # verifies, then sets the session cookie
|    |    |    |    |    |___ logout/
|    |    |    |    |    |    |___ route.ts  # revokes, then clears the cookie
|    |    |    |    |    |___ refresh-session/
|    |    |    |    |    |    |___ route.ts  # re-mints before expiry, so a role change lands
|    |    |    |    |    |___ signup/
|    |    |    |    |         |___ route.ts  # creates, then hands off to the session route
|    |    |    |    |___ cron/           # one dispatcher the scheduler calls; tasks self-gate
|    |    |    |    |    |___ tick/      # a single entry, so the scheduler has one target
|    |    |    |    |         |___ route.ts  # verifies the scheduler, then runs what is due,
|    |    |    |    |                    # each task in its own try/catch so one failure
|    |    |    |    |                    # cannot skip the rest
|    |    |    |    |___ dev/            # only mounted when APP_ENV is local or development -
|    |    |    |    |    |                # email previews and fixture triggers. It must 404
|    |    |    |    |    |                # in production, not merely require a role
|    |    |    |    |    |___ emails/
|    |    |    |    |         |___ [type]/
|    |    |    |    |              |___ route.ts  # renders one template in the browser
|    |    |    |    |___ health/         # liveness; the only route with no auth
|    |    |    |    |    |___ route.ts   # echoes the resolved tier, so a wrong env name
|    |    |    |    |                    # shows up here instead of silently at runtime
|    |    |    |    |___ public/         # unauthenticated reads, rate-limited by IP
|    |    |    |    |    |___ maintenance-window/  # readable while everything else 503s
|    |    |    |    |    |    |___ route.ts  # never behind the kill switch it reports on
|    |    |    |    |    |___ <resource>/  # the read surface a marketing page renders from
|    |    |    |    |         |___ route.ts  # strips every field a list does not show
|    |    |    |    |___ webhooks/       # provider callbacks, one folder per provider
|    |    |    |         |___ <provider>/
|    |    |    |              |___ route.ts  # verifies the signature before anything else,
|    |    |    |                         # then dedups on the event id before doing work
|    |    |___ layout.tsx                # the minimum a Next app needs; renders nothing
|    |    |___ opengraph-image.tsx       # what a shared docs link previews as
|    |    |___ robots.ts                 # disallow everything; an API is never indexed
|    |    |___ route.ts                  # the root: redirects to the docs, so a bare
|    |                                   # domain visit is not a 404
|    |___ config/                        # bare names, as in any app
|    |    |___ email-recipients.constant.ts  # who internal mail goes to, per tier
|    |    |___ env.ts                    # Zod at boot; the leaf module, imports only zod
|    |    |___ index.ts                  # the kind barrel
|    |    |___ runtime.config.ts         # the per-tier values, keyed off APP_ENV
|    |    |___ seo.ts                    # only what the docs page needs
|    |___ constants/                     # only what no package shares
|    |    |___ index.ts                  # the kind barrel
|    |    |___ rate-limit.constant.ts    # the named tiers every route picks from; the
|    |                                   # budgets themselves are a project fact, so they
|    |                                   # live in this app's AGENTS.md, not in a skill
|    |___ docs/                          # the OpenAPI source of truth
|    |    |___ openapi.ts                # the spec config: servers, security schemes, tags
|    |    |___ registry.ts               # every route registered here; the docs route reads
|    |                                   # this, so a route missing from it is undocumented
|    |___ schemas/                       # request and response shapes, app-local ones only
|    |    |___ index.ts                  # the kind barrel
|    |    |___ <domain>.schema.ts        # shared contracts live in @app/contracts instead
|    |___ server/                        # everything below is server-only. In this app that
|    |                                   # is nearly everything, so it sits at src/ root
|    |                                   # rather than nested under a lib/ that holds nothing
|    |                                   # else - the boundary is the app
|    |    |___ clients/                  # one configured SDK per external service
|    |    |    |___ email/               # only if the API sends mail
|    |    |    |    |___ client.ts       # one agent per mail type, each with its own token
|    |    |    |    |___ index.ts        # the client barrel
|    |    |    |___ firebase/            # the Admin SDK boundary; nothing else touches it
|    |    |    |    |___ client.ts       # lazy Firestore, Auth, Storage singletons
|    |    |    |    |___ index.ts        # the client barrel
|    |    |    |    |___ rest.ts         # the auth flows the Admin SDK cannot do
|    |    |    |___ redis/               # only if the API needs a shared store
|    |    |    |    |___ cache.ts        # the read-through wrapper; every write invalidates
|    |    |    |    |___ client.ts       # the one connection; never a second `new Redis()`
|    |    |    |    |___ dedup.ts        # SET NX EX, so a webhook retry cannot double-charge
|    |    |    |    |___ index.ts        # the client barrel
|    |    |    |    |___ keys.ts         # every key built here, under a `<domain>:<action>`
|    |    |    |    |                    # prefix; an inline key string is banned
|    |    |    |    |___ locks.ts        # SET NX EX to take, Lua compare-and-delete to free
|    |    |    |    |___ maintenance.ts  # the mirror the proxy reads; this one fails open
|    |    |    |    |___ rate-limit.ts   # the sliding window every instance shares; fails
|    |    |    |    |                    # CLOSED, unlike the cache beside it
|    |    |    |    |___ ttl.ts          # the TTL presets, so none is defined inline
|    |    |    |___ storage/             # only if the API issues upload or delivery URLs
|    |    |    |    |___ client.ts       # the signing boundary; a signed URL is a credential
|    |    |    |    |___ index.ts        # the client barrel
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ <service>.client.ts  # a one-file client needs no folder
|    |    |___ data/                     # store access only; no business rules, no authz
|    |    |    |___ batch.data.ts        # the chunked writer; Firestore caps a batch at 500
|    |    |    |___ collections.data.ts  # every collection path; no literal elsewhere
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ <domain>.data.ts     # one domain's queries
|    |    |___ guards/                   # the authorization entry points, one per shape of
|    |    |    |                         # caller. Their own kind, not utils/ - a util is a
|    |    |    |                         # helper you may skip, and skipping one of these is
|    |    |    |                         # an open endpoint
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ require-cron.guard.ts  # verifies the scheduler, not a user
|    |    |    |___ require-permission.guard.ts  # resolves the actor, then calls can()
|    |    |    |___ require-resource.guard.ts  # loads the record AND checks the verb against
|    |    |    |                         # it in one call, so no route can do one without
|    |    |    |                         # the other
|    |    |___ services/                 # the business logic; the only caller of data/
|    |    |    |___ event/               # a domain that outgrew one file
|    |    |    |    |___ crud.service.ts      # the folder carries the domain, so the file
|    |    |    |    |___ cron.service.ts      # carries only the concern - never
|    |    |    |    |___ index.ts             # event/event-crud.service.ts
|    |    |    |    |___ member.service.ts
|    |    |    |    |___ publishing.service.ts
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ audit-log.service.ts # the append-only trail; the guard emits denials,
|    |    |    |                         # so no route has to remember to
|    |    |    |___ email.service.ts     # composes and sends; the client only transports
|    |    |    |___ user.service.ts      # one concern, so it stays a file
|    |    |___ utils/                    # server-only helpers - never named `helpers/`
|    |    |    |___ cursor.utils.ts      # opaque cursors; never expose an offset
|    |    |    |___ encryption.utils.ts  # AES-256-GCM field encryption; only if needed
|    |    |    |___ error.utils.ts       # the typed errors routes map to status codes
|    |    |    |___ index.ts             # the kind barrel
|    |    |    |___ logger.utils.ts      # structured, and it never logs a secret
|    |    |    |___ response.utils.ts    # the one envelope every route returns
|    |    |    |___ sanitize.utils.ts    # strips fields no caller should receive
|    |    |    |___ timing-safe.edge.ts  # the Web Crypto version, because the proxy runs on
|    |    |    |                         # the edge and cannot import node:crypto
|    |    |    |___ timing-safe.utils.ts # constant-time compare for tokens and signatures
|    |    |___ index.ts                  # the `server-only` barrel: services and guards only,
|    |                                   # so a route cannot reach data/ or a client directly
|    |___ types/                         # shapes no schema or const infers
|    |    |___ index.ts                  # the kind barrel
|    |___ proxy.ts                       # CORS allowlist, CSRF origin check, maintenance gate.
|                                        # The one file that runs before every route, so it
|                                        # uses the .edge utils and nothing from server/
|___ .env                                # the tier's real values; gitignored
|___ .env.example                        # secrets only, plus APP_ENV; no values
|___ .gitignore                          # app-local only - .next, next-env.d.ts, .env
|___ AGENTS.md                           # this app's facts: tiers, rate-limit budgets,
|                                        # collection names, and which routes are public
|___ apphosting.yaml                     # the base host config every tier inherits
|___ apphosting.dev.yaml                 # the dev overlay - only what differs from the base
|___ apphosting.prod.yaml                # the prod overlay; every secret needs its own grant
|___ apphosting.staging.yaml             # the staging overlay
|___ eslint.config.mjs                   # extends @app/eslint-config/next
|___ next.config.ts                      # transpiles the workspace packages it consumes
|___ package.json                        # its own deps, catalog versions
|___ README.md                           # what this API is, and how to run it locally
|___ site.metadata.ts                    # what the docs page and OG route read
|___ tsconfig.json                       # extends @app/typescript-config/nextjs
|___ vitest.config.mts                   # .mts, so the config itself is ESM under tsx
|___ vitest.setup.ts                     # the one place process.env is touched in tests
```

Five rules the shape encodes, each from `api-architecture`:

- **A route handler is thin.** It runs the guard, parses with a schema, calls one service, and returns the shared envelope. Business logic in a route is the single most common way an API becomes untestable.
- **`services/` is the only caller of `data/`.** A route that queries the store directly skips authorization, and the `server-only` barrel exports `services` and `guards` precisely so it cannot.
- **The guard runs first, in the route.** Not in a layout, not in the service — a service called by a cron job has no request to authorize, so authorization belongs where the request is.
- **Every route is registered in `docs/registry.ts`.** The spec is generated from it, so a route that skips registration is a route no caller can discover and no reviewer can check.
- **Caches fail open; limits, locks, and dedup fail closed.** A cache miss should serve a slow page, and a rate limiter that cannot reach its store should refuse the request — the same outage must not open both doors.
