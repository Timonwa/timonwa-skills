# Next.js caching & revalidation — deep reference

Detail behind the Caching section of `SKILL.md` (Next 16).

**House standard = Cache Components** (`cacheComponents: true` + the `use cache` directive) — new Next work uses this model. Whether a given repo has the flag on is a **project fact → its `AGENTS.md`**, but the _direction_ is Cache Components everywhere. **We do not use `unstable_cache`.** On the previous model (flag off), cache `fetch` inline with options and dedup non-`fetch` reads with React `cache()` — see the short legacy section at the end.

---

## The decision, every piece of data

1. **Static** — same for everyone, known at build → prerender (default under Cache Components).
2. **Cached-dynamic** — same for everyone, live source, OK to serve stale for a window → `use cache` + a `cacheLife` tier + a `cacheTag`.
3. **Per-request dynamic** — depends on the request (cookies/headers/searchParams) or must be fresh → don't cache; stream under `<Suspense>`.

The trap is treating (2) as (3) — refetching shared data every request — or (3) as (2) — caching per-user data everyone then shares.

---

## Cache Components (the house model)

### The cached-reader shape

Cached reads live in `lib/server/services/` (data layer) as plain async functions — `"use cache"`, tier, tag, then the fetch:

```ts
// lib/server/services/projects-store.ts
export async function listProjects(): Promise<Project[]> {
  'use cache'
  cacheLife('static')          // changes only via our own writes → tag-invalidated
  cacheTag(CACHE_TAGS.projects)
  const rows = await db.query<ProjectRow>('select * from projects order by name')
  return rows.map(toProject)
}
```

- **Data-level** (a reader function) is the default — shared across components, cached independently of UI. UI-level `use cache` (on an `async` component/page) is for caching rendered output.
- Args + closed-over values form the cache key → different inputs get separate entries.
- `use cache` **can't** sit directly in a Route Handler body — extract to a helper.
- Always add a one-line comment on **why** that tier (the code can't say it).

### `cacheLife` — define semantic tiers centrally

House pattern: don't scatter the built-in `hours`/`days` profiles — define **named tiers by how fresh the data must be** in `next.config.ts` (Next explicitly blesses this: _"you may prefer different named profiles to better align with your application's caching strategies"_), and call them by name. Name by **freshness/cadence** (Next's own axis — presets go `seconds`→`max`; custom examples are `editorial`/`marketing`/`biweekly`), not by storage "temperature" (`hot`/`cold` reads as access-frequency in S3/CDN, a different axis):

```ts
// next.config.ts — canonical tiers; keep the SAME set across every app (define once in shared config for monorepos)
const nextConfig: NextConfig = {
  cacheComponents: true,
  // stale = client-side hint · revalidate = server background refresh · expire = hard ceiling.
  cacheLife: {
    realtime: { stale: 30,  revalidate: 60,      expire: 300 },      // ~1m — volatile: counters, live status
    frequent: { stale: 300, revalidate: 900,     expire: 3600 },     // 15m — feeds, lists that move often
    daily:    { stale: 300, revalidate: 86400,   expire: 604800 },   // 1d  — articles, catalog, profiles
    static:   { stale: 300, revalidate: 2592000, expire: 31536000 }, // tag-invalidated only — settings, rarely change
  },
}
```

Then `cacheLife('realtime' | 'frequent' | 'daily' | 'static')` at each read site. A custom inline object (`cacheLife({ stale, revalidate, expire })`, seconds) is fine for a one-off, but prefer a named tier. Tune the _numbers_ per app if the data demands it, but keep the _tier names_ identical everywhere — that's the standard.

> **Naming honesty:** these names denote _relative freshness_, and the values must back them up (`daily` really is ~1 day). Cadence names read cleanly only when the durations fit; if a tier's real cadence is awkward (e.g. 30 min), pick the nearest honest word rather than inventing a misleading one.

**Built-in profiles** for reference (`stale` / `revalidate` / `expire`): `default` 5m/15m/never · `seconds` 30s/1s/60s · `minutes` 5m/1m/1h · `hours` 5m/1h/1d · `days` 5m/1d/1w · `weeks` 5m/1w/30d · `max` 5m/30d/1y. A **short-lived** cache (`seconds`, `revalidate: 0`, or `expire` < 5m) is excluded from prerenders and becomes a dynamic hole.

### `cacheTag` — centralized tag constants

Tags are named constants in `lib/constants/`, `as const` — **never** string literals at the call site (→ `naming`):

```ts
// lib/constants/cache.ts
export const CACHE_TAGS = {
  projects: 'projects',
  posts: 'posts',
  settings: 'settings',
  // ...
} as const
```

Reuse the same tag across readers to invalidate them together; the writer calls `updateTag(CACHE_TAGS.x)`.

### Runtime APIs → out of cache, into Suspense

`cookies()`, `headers()`, `searchParams`, `params` (unless sampled via `generateStaticParams`) can't prerender. Wrap the component that reads them in its **own `<Suspense>`**. To cache _around_ runtime data, read it in an uncached parent and pass it as an arg into a `use cache` child (it becomes part of the key):

```tsx
async function ProfileContent() {                 // not cached — reads runtime data
  const sessionId = (await cookies()).get('session')?.value
  return <CachedContent sessionId={sessionId} />
}
async function CachedContent({ sessionId }: { sessionId: string }) {
  'use cache'                                       // sessionId is in the key
  return <div>{await fetchUserData(sessionId)}</div>
}
```

### Non-deterministic values

`Math.random()`, `Date.now()`, `crypto.randomUUID()`: either `await connection()` before them (per-request, wrap in `<Suspense>`) for a fresh value each request, or `use cache` the component so all users see the same value until revalidation.

### Serverless durability

`use cache` is in-memory by default; in serverless, memory may not persist across requests, so entries can re-evaluate. Consider `'use cache: remote'` for durable, shared caching.

---

## Prerendering, blockers & instant routes

Under Cache Components every route must be **prerenderable**: a route that reads request-time data _outside_ `<Suspense>` is **blocking** and fails the build. Fix blockers; don't suppress them. (Distilled from Vercel's official `next-cache-components-adoption` / `-optimizer` skills.)

**The three blocker classes** (in the order the build surfaces them):

1. **Request-time reads** — `cookies()`, `headers()`, `await params`, `await searchParams`. Push the read into a `<Suspense>`-wrapped child; forward the _promise_ and await it in the child, not at the page top.
2. **Sync-IO at module/render time** — `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()`. `await connection()` before them + wrap in `<Suspense>` to defer to request time. Grep the repo for these first — they hide in shared layouts and deps.
3. **`"use cache"` reading request data** — the directive is wrong for that scope; remove it. A cache boundary can't also be a blocking read.

**Read the build glyphs:** `○` Static (fully prerendered) · `◐` Partial Prerender (static shell + request-time content streamed — the goal for routes using cookies/headers/params) · `ƒ` Dynamic (genuinely request-time). The glyph reflects prerender-time behavior, not which knobs you exported.

**Suspense placement (the optimizer's core rule):** don't wrap the whole page in one coarse boundary high in the tree. _"If an element renders in both the fallback and the resolved tree, hoist it above the boundary."_ Push boundaries down to the smallest request-time leaf so the static shell is as large as possible.

**Loading UI:** reuse the route's `loading.tsx` or a colocated `*Skeleton` — don't author a fresh skeleton that mirrors the layout (it drifts as the page changes). One **responsive** component should render both the live UI and its skeleton so the breakpoint switch happens once.

**"Instant" is the bar:** the static shell should commit on first paint, not sit on a fallback. Vercel's optimizer guards this with `@next/playwright`'s `instant()` test as a CI regression guard.

**Escape hatch:** `export const instant = false` marks a route as allowed to block (16.3+) — use sparingly, with a reason; the default is to fix.

**Migrating an existing app:** you can't keep `dynamic` / `revalidate` / `fetchCache` exports alongside `cacheComponents` — _translate_ them (don't just delete; `dynamic = 'force-dynamic'` is the one safe deletion). `experimental.dynamicIO` → top-level `cacheComponents`. For the full workflow, Vercel's `next-cache-components-adoption` (feature-by-feature adoption + `cache-components-instant-false` codemod) and `next-cache-components-optimizer` (drive a route to instant) skills live in `vercel/next.js` under `skills/` — `npx skills add vercel/next.js`. **This skill encodes the principles; those run the migration.**

> **Version note:** top-level `cacheComponents` works on **16.2**. But `export const instant`, the codemod, dev-overlay validation, and the `next-dev-loop` skill need **16.3+** — upgrade before an adoption pass.

## Revalidation — pick by intent

Revalidate from Server Actions (in `lib/server/actions/*`):

- **`updateTag(tag)`** — Server Actions only; _immediately expires_. Read-your-own-writes — the user must see their change now. The **house default** after a mutation.
- **`revalidateTag(tag, 'max')`** — Server Actions + Route Handlers; _stale-while-revalidate_. Background refresh where slight staleness is fine.
- **`revalidatePath(path)`** — Server Actions + Route Handlers; _invalidates a whole route_. When you don't know the tags (coarser — prefer tags).
- **`refresh()`** — Server Actions; _re-renders the current route_. Refreshes router UI; does **not** touch tagged data.

Prefer **tag-based** (`updateTag`/`revalidateTag`) over `revalidatePath`. Call revalidation **before** `redirect()` (redirect throws and stops execution). The second arg to `revalidateTag` sets the stale window; `'max'` is the longest.

```ts
// lib/server/actions/projects.ts
export async function createProject(/* … */) {
  // …auth check, mutate…
  updateTag(CACHE_TAGS.projects)
  updateTag(CACHE_TAGS.dashboard)   // the dashboard aggregates projects too
}
```

---

## Cross-cutting (both models)

- **Dedupe non-`fetch` reads** with React `cache()` — the standard for non-`fetch` dedup. One memoized call shared across `generateMetadata`, the page, and children within a request. Scoped per request; no cross-request sharing.
- **Preload** to start a fetch early and dodge a waterfall: a `cache()`d getter + a `preload(id)` that calls it with `void`, invoked above the first blocking `await`; pair with `import 'server-only'`.
- **Parallelize** independent requests with `Promise.all` (or `Promise.allSettled` when one may fail) instead of sequential `await`s.

---

## Previous model (legacy — `cacheComponents` off)

Minimal on purpose; new work should move to Cache Components.

- **Cache a `fetch`** inline: `fetch(url, { cache: 'force-cache' })`, time-based `fetch(url, { next: { revalidate: 3600 } })`, or tag it `fetch(url, { next: { tags: [CACHE_TAGS.x] } })`. `fetch` is auto-memoized within one render pass.
- **Dedup non-`fetch` reads** with React `cache()` (above). **Not `unstable_cache`.**
- **Route-segment config** when a whole route must be static/dynamic: `export const dynamic = 'force-static' | 'force-dynamic'` and `export const revalidate = <seconds>` (lowest across a route's segments wins). Reach for it only when a page-wide setting is genuinely needed.
- **On-demand**: `revalidateTag(CACHE_TAGS.x)` / `revalidatePath(path)` in a Server Action or Route Handler — same as the table above.
