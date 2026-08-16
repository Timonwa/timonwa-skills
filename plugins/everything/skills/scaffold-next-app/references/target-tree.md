# The target tree

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
|    |    |    |    |___ cloudinary/     # only if image delivery = Cloudinary
|    |    |    |    |    |___ client.ts  # the configured SDK every caller reuses
|    |    |    |    |    |___ transform.ts # thumbnail and preview URL builders
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |___ email/          # only if the app sends mail
|    |    |    |    |    |___ client.ts  # one agent per mail type, each with its token
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |___ firebase/       # only if store = Firebase
|    |    |    |    |    |___ client.ts  # lazy Firestore, Auth, and Storage singletons
|    |    |    |    |    |___ rest.ts    # the auth flows the Admin SDK cannot do
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |___ redis/          # only if the app needs a shared cache
|    |    |    |    |    |___ index.ts   # the client barrel
|    |    |    |    |    |___ client.ts  # the one connection; never a second `new Redis()`
|    |    |    |    |    |___ dedup.ts   # SET NX EX so a retry cannot double-charge
|    |    |    |    |    |___ keys.ts    # every key built here; inline strings are banned
|    |    |    |    |    |___ locks.ts   # SET NX EX to take, Lua compare-and-delete to free
|    |    |    |    |    |___ maintenance.ts # the mirror the proxy reads; fails open
|    |    |    |    |    |___ rate-limit.ts # the sliding window every instance shares
|    |    |    |    |    |___ store.ts   # the read-through wrapper; every write invalidates
|    |    |    |    |    |___ ttl.ts     # the TTL presets, so none are defined inline
|    |    |    |    |___ index.ts        # the kind barrel
|    |    |    |    |___ <service>.client.ts # a one-file client needs no folder
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
|    |    |___ schemas/                  # Zod schemas; mirrors packages/contracts in a monorepo
|    |    |    |___ index.ts             # the kind barrel, one explicit export line per file
|    |    |    |___ shared.schema.ts     # cross-domain primitives - timestamp, pagination, email
|    |    |    |___ <domain>.schema.ts   # one domain's schemas, each with its inferred type
|    |    |___ types/                    # shapes with no const or schema behind them
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
|___ .env.example                        # secrets only, plus APP_ENV; no values
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
