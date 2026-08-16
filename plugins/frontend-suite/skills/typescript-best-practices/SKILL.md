---
name: typescript-best-practices
description: Use when writing or reviewing TypeScript — typing code, designing types, configuring tsconfig, or fixing type errors. Enforces strict, inference-first TypeScript (TS 5.x) — no any / unsafe casts, discriminated unions, satisfies, utility types, and Zod as the source of truth. Identifier naming and suffixes live in the `naming` skill.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# TypeScript

Strict, inference-first TypeScript. Types are documentation the compiler checks — make illegal states unrepresentable. (Identifier naming + suffixes → the `naming` skill.)

## Non-negotiables

- **`strict: true`, always.** Never disable strict or a rule to "make it pass."
- **No `any`.** Take `unknown` at boundaries and narrow; reach for a generic before `any`. (Lint bans it.)
- **No unsafe casts.** No `as` to launder unknown data into a type; no non-null `!` to silence the compiler — narrow or fix the type instead. (`as const`, and `as` for a genuinely-known narrowing, are fine.)
- **Type everything typeable, but infer internally / annotate boundaries** — annotate function params, exported return types, and public APIs; let locals infer.
- **`import type` for type-only imports** — `verbatimModuleSyntax` enforces it; keeps types out of the runtime module graph.

## Designing types

- **`satisfies`** to check a value against a type _while keeping its literal type_ (config objects, lookup maps) — not a plain annotation, which widens.
- **Discriminated unions** for "one of N shapes" (`{ status: "ok"; data } | { status: "error"; message }`); narrow on the discriminant and exhaustive-check the default with `never`.
- **`as const`** for literal/readonly data; derive the union from it (`type Status = (typeof STATUSES)[number]`).
- **Utility types** over hand-rolling: `Pick` / `Omit` / `Partial` / `Required` / `Record` / `ReturnType` / `Awaited`. Compose, don't duplicate.
- **Generics** with constraints (`<T extends …>`); give them meaningful names when non-trivial. Don't over-generalize.
- **`type` vs `interface`:** prefer `type` (composes, unions, inference); use `interface` only when you need declaration merging or `implements`.
- **Errors are `unknown`** — `catch (error: unknown)` and narrow (`instanceof Error`, a schema parse) before touching it.
- **Branded types** for ids where mixing them up is a real bug risk (`type UserId = string & { readonly __brand: "UserId" }`) — don't brand everything.
- **`NoInfer<T>`** to lock an inference site so a second argument can't widen what the first inferred.
- **Template-literal types** for string grammars the compiler can check (e.g. cache tags: `` type CacheTag = `${Entity}:${string}` ``).

## Zod = source of truth

**Zod 4.** String-format validators are top-level — `z.email()`, `z.uuid()`, `z.url()`; the chained `z.string().email()` forms are deprecated. Where data crosses a boundary (API, forms, content, env), validate with a Zod schema and **infer the type** — never maintain a parallel hand-written type:

```ts
const UserSchema = z.object({ id: z.string(), name: z.string(), email: z.email() });
type User = z.infer<typeof UserSchema>;
```

**Compose schemas, don't repeat them** — derive related shapes from a base: `CreateX` (user-writable fields) → `.extend()` into the full `X` (adds `id`/timestamps) → `.omit({…}).partial()` for `UpdateX`. Write schemas are **`.pick()` allowlists** off the full schema — fail-closed: a new field isn't client-writable until you explicitly add it (house `backend` standard). Keep validation limits in `UPPER_SNAKE` constants and reference them in `.min()`/`.max()`, not magic numbers.

(Schema/type naming → `naming`.)

## Where contracts live

Same four layers whichever shape the repo is — **a single app puts them in `lib/`, a monorepo puts them in a shared package** so the API and every app import one copy. The grammar and the rules below do not change between the two, which is what makes moving an app into a workspace a folder move:

| Layer          | Single app                            | Monorepo                         |
| -------------- | ------------------------------------- | -------------------------------- |
| `constants/`   | `src/lib/constants`                   | `packages/contracts/constants`   |
| `schemas/`     | `src/lib/schemas`                     | `packages/contracts/schemas`     |
| `types/`       | `src/lib/types`                       | `packages/contracts/types`       |
| `permissions/` | `src/lib/constants` + `src/lib/utils` | `packages/contracts/permissions` |

What each holds:

- `constants/` — `as const` arrays → derived unions, validation limits, label maps.
- `schemas/` — Zod schemas + their inferred types. One file per domain (`<domain>.schema.ts`) plus a `shared.schema.ts` for cross-domain primitives (timestamp, pagination, email) that per-endpoint schemas `.extend()`.
- `types/` — plain TS interfaces with **no Zod**, for runtime-UI state that isn't a wire contract (upload progress, client auth state). The boundary rule: **wire contract → schema; UI-only state → interface.**
- `permissions/` — permission strings, role → permission maps, `can()` helpers (when the app has RBAC). **Client-safe on purpose:** `can()` is pure with no I/O, so the same function gates a UI affordance and a server guard. A single app therefore splits it across the existing kinds — the strings and maps are constants, `can()` is a util — rather than adding a kind that only a monorepo needs.

Rules that keep it honest:

- **Declare a schema and its inferred type together as one unit** — `export const XSchema = …` immediately followed by `export type X = z.infer<typeof XSchema>`. Never pool the types at the bottom of the file — pooled types drift when schemas are added or renamed.
- **Additive changes are the default** (new optional field, extended schema). A destructive change (remove/rename a field) ships as **one coordinated PR** updating the API and all consumers — the contract is shared, so a partial rollout breaks the other side.

## tsconfig baseline

- `strict: true` and an explicit `target` (don't inherit the default). **`module`/`moduleResolution` follow who resolves the imports:** `"preserve"` + `"bundler"` for anything a bundler builds — an app, or a package every consumer bundles; `"NodeNext"` + `"NodeNext"` for a package **Node** loads directly. `NodeNext` then requires the `.js` extension on relative imports, which is the ESM spec and what makes plain `tsc` output loadable. Getting this wrong builds clean and fails at import time, so in a workspace it is a separate shared config per consumer, never one setting for every package.
- **`verbatimModuleSyntax: true`** — forces `import type`, so every import statement is erasable and single-file transpilers stay correct.
- **`erasableSyntaxOnly: true`** (TS 5.8+) — bans enums, namespaces, and parameter properties; the compiler-level enforcement of this skill's no-`enum` rule.
- `isolatedModules`, `skipLibCheck: true` (don't re-check `node_modules` types), `noEmit` (the framework builds), `jsx: "react-jsx"`; the framework TS plugin where applicable (`{ "name": "next" }`).
- Path alias `@/*`. Add a second alias only with a reason — e.g. an `@env` alias for the validated env module, giving env access a single import point.
- Strictness upgrades to adopt knowingly: **`noUncheckedIndexedAccess`** (indexed access yields `T | undefined`) and **`exactOptionalPropertyTypes`** (`?:` no longer accepts an explicit `undefined`).

## Avoid

- `any`, unsafe `as`, non-null `!` abuse, `@ts-ignore` (use `@ts-expect-error` **with a reason** only when truly unavoidable).
- **`enum`** — prefer an `as const` object + derived union (smaller output, tree-shakeable, plays well with `isolatedModules`).
- A hand-written type that duplicates a Zod schema or an already-inferred shape.

> **Audit:** review this domain on demand with the manually-invoked `codebase-audit` command (see `audit-all` for the whole suite).
