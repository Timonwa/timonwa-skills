---
name: nextjs-best-practices
description: Use when writing or reviewing Next.js App Router code (Next 16) — Server vs Client Components and the `use client` boundary, data fetching, caching (Cache Components, `use cache`, `cacheLife`, `cacheTag`), streaming/Suspense, Server Actions & mutations, revalidation (`updateTag`/`revalidateTag`/`revalidatePath`), Metadata & OG images, Route Handlers, Proxy (formerly Middleware), and env/secret safety. Async `params`/`searchParams`. Folder structure & the `lib/server` boundary live in `code-structure`; React mechanics in `react-best-practices`; naming in `naming`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Next.js (App Router, 16)

Server-first Next.js. The framework mechanics — rendering model, data, caching, mutations, metadata, routing edges. Folder structure, thin routes, and the `lib/server` boundary → `code-structure`. React itself (hooks, `use`, Actions, derive-don't-sync) → `react-best-practices`. Naming → `naming`.

> **What's a project fact (→ `AGENTS.md`), not a rule here:** whether **Cache Components** (`cacheComponents: true`) is enabled, the auth provider, per-route rendering strategy, and the data source. This skill encodes the _approach_; the repo's `AGENTS.md` says which knobs are on.

## Server-first by default

- **Everything is a Server Component** until it needs interactivity. Reach for `"use client"` only on the **interactive leaf** (state, effects, event handlers, browser APIs, context) — never on a layout/page to "make a child work."
- **`"use client"` is a boundary, not a label** — every module a client file imports joins the client bundle. Keep the directive low in the tree; pass Server Components into clients via `children`/props (they render on the server and stream in) rather than importing them across the boundary.
- **Data down, actions down.** A Server Component fetches and passes serializable data + Server Actions as props to Client Components. Context providers are Client Components wrapping `{children}` as deep as possible.
- **Stream a promise instead of awaiting** when a client leaf needs the data: start the fetch on the server (don't `await`), pass the promise, read it with `use()` under `<Suspense>` (→ `react-best-practices`).

## `params`, `searchParams`, and runtime APIs are async

- `params` and `searchParams` are **Promises** — type them `Promise<…>` and `await` them. Same for `cookies()`, `headers()`, `draftMode()`.
- Anything reading runtime data (`cookies`/`headers`/`searchParams`/uncached fetch) can't prerender — wrap that component in its **own `<Suspense>`** so the rest of the page stays static.

## Data fetching

- **Fetch on the server** — `fetch` or an ORM/db client directly in async Server Components, close to the source; secrets never reach the client.
- **Kill waterfalls.** Independent requests run in parallel with `Promise.all` (they start when `fetch` is called); sequential `await`s are only for genuinely dependent data. Sibling segments already fetch in parallel — the trap is two `await`s in one component.
- **Dedupe within a request** with React `cache()` — one memoized call shared across `generateMetadata`, the page, and nested components (scoped per request, no cross-request sharing).
- **Client fetching**: prefer server + `use()`; when you must fetch on the client, use a caching library (**TanStack Query** / SWR) that dedupes and revalidates — never a raw `fetch` in `useEffect`.

## Caching & rendering (Cache Components / Next 16)

**House standard = Cache Components** (`cacheComponents: true` + `use cache`). A page is a **static shell** + **cached** regions + **streamed dynamic** holes — Partial Prerendering; Next flags any uncached/runtime access that isn't wrapped, at build time. Repos still on the previous model cache `fetch` inline + dedup with React `cache()` — **we don't use `unstable_cache`**. Whether the flag is on is a **project fact**. Full detail — house `cacheLife` tiers, `CACHE_TAGS`, the cached-reader shape, revalidation, legacy model: **`references/caching.md`**.

- **`use cache`** caches an async function's or component's result. Data-level (a reader in `lib/server/services/`) is the default — shared, cached independently of UI; UI-level (a whole `async` component/page) for rendered output. Args + closed-over values form the cache key. Can't sit directly in a Route Handler body.
- **`cacheLife('<tier>')`** — house pattern: define **freshness tiers** (`realtime`/`frequent`/`daily`/`static`, by how fresh the data must be) centrally in `next.config`, call them by name — not the generic built-ins, and not storage "temperature" names. Keep the tier set identical across every app. **`cacheTag(CACHE_TAGS.x)`** — tags are named constants in `lib/constants/`, never string literals. Both go inside the `use cache` scope, with a one-line comment on _why_ that tier.
- **Fresh-every-request data** → don't cache it; wrap the component in `<Suspense>` with a fallback so it streams at request time. Pull runtime values out and pass them into a cached child as args when you want to cache around them.
- **Non-deterministic** (`Math.random()`, `Date.now()`, `crypto.randomUUID()`): either `await connection()` first (per-request, in Suspense) or `use cache` it (same value for all until revalidation).
- **Stream segments** with `loading.js` (wraps the whole segment in Suspense); use a **`<Suspense>`** closer to the data for granularity. Reuse the route's `loading.tsx` / a colocated `*Skeleton` rather than authoring a drifting one; one responsive component renders both live UI and skeleton.
- **Under Cache Components, every route must prerender.** Reading request-time data outside `<Suspense>` is a _blocking_ build error — fix it, don't suppress it. (On the previous model that same read just makes the route dynamic, not a build failure.) Three blocker classes: request-time reads (`cookies`/`headers`/`params`/`searchParams` → Suspense), sync-IO (`Date.now`/`Math.random`/`crypto` → `await connection()` + Suspense), and a `use cache` scope that reads request data (wrong directive). Push Suspense to the smallest leaf so the static shell is largest ("instant"). Adoption/optimization detail + Vercel's official skills → `references/caching.md`.

## Mutations — Server Actions

- **`"use server"`** marks a Server Function; group mutations in an actions file (or inline in a Server Component). Invoke via `<form action>`, `formAction`, or from a client handler.
- **Authorize inside every action.** They're reachable by direct `POST`, not just your UI — check session/ownership at the top of each one, always.
- **Pending & optimistic UI** via `useActionState` (pending/result) and `useOptimistic` (→ `react-best-practices`); forms degrade gracefully without JS.
- **After a mutation, revalidate** — pick by intent:
  - **`updateTag(tag)`** — read-your-own-writes (user must see their change now); Server Actions only; immediately expires.
  - **`revalidateTag(tag, 'max')`** — background refresh where slight staleness is fine (stale-while-revalidate); Actions or Route Handlers.
  - **`revalidatePath(path)`** — when you don't know the tags; coarser, prefer tags.
  - **`refresh()`** — re-render the current route (router refresh); does _not_ revalidate tagged data.
- **`redirect()`** after the write throws a control-flow signal — call revalidation _before_ it.

## Metadata & SEO

- Export a static **`metadata`** object, or **`generateMetadata`** when it depends on data (Server Components only). Share the fetch with the page via React `cache()` so it runs once.
- **File conventions** over hand-rolled tags: `favicon.ico`, `opengraph-image`/`twitter-image`, `robots.ts`, `sitemap.ts`; deeper files override shallower.
- **Dynamic OG images** via **`ImageResponse`** from `next/og` — either an `opengraph-image.tsx` (colocated, exports `size = { width: 1200, height: 630 }` + `contentType = "image/png"`) or a shared `/api/og` route parameterised by query (`?title=…`), which `seo`'s `getOgImageUrl()` targets. Gotchas: **satori renders a flexbox subset only** (no grid, limited CSS); **load custom fonts explicitly** (`fetch` the `.woff`/`.ttf` and pass via `fonts`) — system fonts won't apply; keep it cacheable (deterministic output). Which image a page uses (cover vs generated) + dimensions/alt → `seo`; the card's visual design → `frontend-design`.
- Structured data / deeper SEO strategy → the `seo` skill; this covers the Next mechanics.

## Route Handlers

- `route.ts` with Web `Request`/`Response` (+ `NextRequest`/`NextResponse` helpers); can't sit at the same segment as `page.tsx`. Type `params` via `RouteContext<'/path/[id]'>` and `await ctx.params`.
- **Not cached by default.** Under Cache Components (the house standard), route-segment `dynamic`/`revalidate` exports are **incompatible** — cache by extracting the data into a `use cache` function the handler calls (`use cache` can't sit directly in the handler body). **Legacy model only:** opt a `GET` in with `export const dynamic = 'force-static'`. Non-GET verbs never cache.
- Use for webhooks, third-party callbacks, and BFF endpoints — not to re-expose data a Server Component could fetch directly.

## Errors, interrupts & post-response work

- **`error.tsx`** per segment catches that segment's render errors — it **must be a Client Component**; **`global-error.tsx`** is the root catch-all that replaces the root layout, so it must render standalone (own `<html>`/`<body>`) without app providers.
- **Put `error.tsx` and `loading.tsx` at the route-group level, not on individual pages.** Each wraps its segment _and everything nested below it_, so one file at the group covers every page in it; per-page copies duplicate the same boundary and get forgotten on the next page added. Override with a page-level file only when that page genuinely needs different handling.
- **An `error.tsx` does not catch its own segment's `layout.tsx`** — the boundary is nested _inside_ that layout, so a throwing layout (a session guard, a provider) escalates to the parent boundary, and only `global-error.tsx` catches a failing root layout. If a group's layout can throw, the boundary that handles it has to live one level up.
- **`not-found.tsx`** + `notFound()` for missing resources; **`forbidden()`** / **`unauthorized()`** with `forbidden.tsx`/`unauthorized.tsx` (enable `authInterrupts`) are the typed auth interrupts.
- **`after()`** — run post-response work (audit logs, analytics) without blocking the response.
- **`instrumentation.ts`** with an **`onRequestError`** export is the hook for server-side error reporting.

## Navigation, images & static params

- **`next/image`** always for content images; never lazy-load the LCP image — give it `priority`.
- **`<Link>`** prefetches viewport links by default — opt out (`prefetch={false}`) for huge lists.
- **`generateStaticParams`** for dynamic segments whose values are known, so they prerender.
- **`useSearchParams`** requires a `<Suspense>` boundary in static contexts — wrap the component that reads it.

## Tooling

- **Turbopack** is the Next 16 default bundler; a custom webpack config means explicitly opting back into webpack.
- **React Compiler** — enable with `reactCompiler: true` in `next.config` (stable); pairs with `react-best-practices`' no-hand-memoization rule.

## Proxy (formerly Middleware)

- Next 16 renames **Middleware → Proxy**: one `proxy.ts` at the project root (or `src/`), exporting `proxy` (or default) + a `matcher` config.
- For header rewrites, A/B redirects, and **optimistic** auth redirects only. **Not** for slow data fetching or as real session/authorization — do that in the action/route/data layer. `fetch` cache options are ignored here. For plain redirects, prefer `redirects` in `next.config.ts`.

## Env & secret safety

- Only **`NEXT_PUBLIC_`**-prefixed vars reach the client; everything else is server-only (replaced with `""` on the client). Never put a secret behind `NEXT_PUBLIC_`.
- Mark server-only modules with **`import 'server-only'`** so an accidental client import fails at build (`client-only` for the inverse). Keep server data access behind the `lib/server` barrel (→ `code-structure`).

## Avoid

- `"use client"` on a page/layout to fix a child; importing a Server Component into a client module (pass as `children` instead).
- Forgetting to `await` `params`/`searchParams`/`cookies`/`headers`; reading runtime data outside a `<Suspense>` under Cache Components.
- Sequential `await`s for independent data; fetching in `useEffect`; a Server Action with no auth check.
- `revalidatePath` where a tag would do; `refresh()` when tagged data needs revalidating.
- Secrets in `NEXT_PUBLIC_`; heavy logic or auth in Proxy; a `route.ts` handler that just re-fetches what the page already can.

> **Audit:** review this domain on demand with the manually-invoked `frontend-audit` / `performance-audit` command (see `audit-all` for the whole suite).
