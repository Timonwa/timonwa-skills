---
name: react-best-practices
description: Use when writing or reviewing React components, hooks, or state (React 19). Enforces house React practice — derive don't sync (you-might-not-need-an-effect), rules of hooks, composition, React 19 features (use, Actions, useActionState, useOptimistic, ref as a prop), performance (kill waterfalls, code-split, don't fetch in effects), and letting the React Compiler handle memoization. Reusable-component design lives in `reusables`; the server/client boundary in `code-structure`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# React (19)

Idiomatic React 19. Reusable-component _design_ → `reusables`. Server vs Client Components + the barrel/boundary → `code-structure`. Naming → `naming`.

## State & effects — derive, don't sync

- **Compute during render** whatever can be derived from props/state; don't copy it into state and re-sync with an effect. Most `useEffect`s are a smell.
- **`useEffect` is only for syncing with an _external_ system** (DOM, subscriptions, non-event network, timers) — and always clean up.
- **Not effects:** transforming data for render (compute inline); responding to a user event (do it in the handler); resetting state when a prop changes (use `key`).
- **`useLayoutEffect` only for pre-paint measurement** (measure, then position/scroll before the browser paints); it blocks paint and warns under SSR — everything else stays `useEffect`.
- **StrictMode double-invocation is a dev-only correctness probe** — it re-runs renders and effect setup/cleanup to expose impurity; write idempotent effects with proper cleanup, don't "fix" it by removing StrictMode.
- **One source of truth** — don't duplicate state; lift it to the closest common parent, or keep it in the URL where that's the real source.
- **Context**: split fast-changing values from stable ones and memoize the provider `value` object so consumers don't re-render on every parent render — but state colocation beats context for most cases.

## Hooks

- **Rules of hooks:** call unconditionally at the top level; custom hooks are `use*` and compose smaller hooks (`naming`).
- `useState` for local state, `useReducer` for related transitions, `useRef` for non-render values/DOM, `useId` for ids, `useSyncExternalStore` for external stores.
- **React Compiler** (stable 1.0) — enable with `reactCompiler: true` in `next.config.*`, or `babel-plugin-react-compiler` outside Next. With it on, **don't hand-memoize** (`useMemo`/`useCallback`/`memo`) except for referential contracts the compiler can't see (e.g. a stable identity an external library depends on) — comment why. Without it, memoize along measured hot paths only, not reflexively.

## React 19 features (use them)

- **`use(promise)` / `use(context)`** — read a promise (with Suspense) or context, conditionally.
- **Actions** — pass an async function to `<form action>`; drive it with **`useActionState`** (pending / result / formAction) and read status in children via **`useFormStatus`**.
- **`useOptimistic`** — optimistic UI while an action is in flight.
- **`ref` is a normal prop** — no `forwardRef` in new code; a component accepts `ref` directly.
- **`useTransition`** for non-urgent updates that shouldn't block the UI; **`useDeferredValue`** when expensive derived UI (filtered lists, previews) should lag behind fast input.
- Document metadata (`<title>`, `<meta>`, `<link>`) can render directly inside components (React hoists it) — but NOT in Next.js App Router: use the Metadata API / `generateMetadata` there (→ `nextjs-best-practices`).
- **Ref cleanup functions** — a ref callback can return a cleanup, called when the element unmounts; use it instead of null-checking in the callback.

## Error boundaries

- **Every Suspense boundary pairs with an error boundary.** A rejected promise read by `use()` (or a throwing lazy component) throws to the nearest error boundary — with no boundary the subtree just goes blank.
- Use **`react-error-boundary`** (`ErrorBoundary` with `fallbackRender` + `resetErrorBoundary`) or a small class component with `static getDerivedStateFromError`; there is still no hook for catching render errors.
- Wire **`onCaughtError` / `onUncaughtError`** root options (`createRoot`/`hydrateRoot`) for centralized error reporting.
- In Next.js App Router, `error.tsx` provides the boundary per route segment (→ `nextjs-best-practices`).

## Performance & data

- **Kill waterfalls** — fire independent async work in parallel (`Promise.all`, or sibling Suspense boundaries), never a chain of sequential `await`s or dependent effects. One slow request shouldn't gate the others.
- **Code-split the heavy stuff** — `React.lazy` + Suspense (or the framework's dynamic import) for below-the-fold / rarely-used components and heavy non-critical libraries, so they stay out of the initial bundle.
- **Don't fetch in `useEffect`** — it waterfalls, doesn't dedupe, and races. Fetch on the server (`code-structure`, and Next data fetching → `nextjs-best-practices`), or use a caching client (TanStack Query) that dedupes, caches, and revalidates.
- **Memoize on evidence, not reflex** — see Hooks; the compiler covers the common case.

## Components

- **Composition over configuration** — pass `children` / slot props, not a mega-config object. A Server Component composes Client Components and passes data + actions down as props (`code-structure`).
- Keep components small and single-purpose (split per `code-structure`); logic in hooks/`lib`, markup in `.tsx`.
- Lists need a stable **`key`** — a real id, never the array index when items can reorder.
- `"use client"` only on the interactive leaves; everything else stays a Server Component (`code-structure`).

## Avoid

- `useEffect` for derived state or event responses; state that mirrors a prop; fetching in `useEffect`.
- Reflexive `useMemo`/`useCallback` when the compiler is on; premature optimization.
- Sequential `await`s for independent data (waterfall); eager-importing a heavy library used on one path.
- Index keys on dynamic lists; giant prop-config objects; business logic in components (→ `lib`).
- `forwardRef` in new code (ref is a prop now); class components (sole exception: an error boundary).

> **Audit:** review this domain on demand with the manually-invoked `frontend-audit` command (see `audit-all` for the whole suite).
