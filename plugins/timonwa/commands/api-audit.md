---
name: api-audit
description: >-
  Manually invoked. API-layer architecture audit — thin route handlers over a service layer, Zod validation at every boundary (body/query/params), shared response builders + typed errors, cursor pagination, rate-limit presence per tier, state-transition sub-routes, audit logging on privileged mutations, and cron/webhook auth. Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standard `backend` (and `backend-security` / `firebase`) is an optional enhancement. Part of the house audits family (see `audit-all`).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
argument-hint: "[phase] [path]"
model: opus
effort: high
---

# API audit

A **manually-invoked, red-team API audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/api-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`backend`** (plus **`backend-security`** and **`firebase`**) ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/api-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/api-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/api-audit.md`:

```
# API audit — <app/scope>

**Date:** <YYYY-MM-DD> · **Phase:** <phase> · **Mode:** Report-only · **Branch:** `<branch>` · **Scope:** <what was audited> · **Overall:** <X>/10

## Score change (previous → current)
| Metric | Previous | Current | Δ | Trend |
| --- | --- | --- | --- | --- |
| Overall | <prev/10 or N/A> | <cur/10> | <+N / -N / 0> | <▲ / ▼ / ■ / N/A> |

## Findings
| ID | Severity | Category | Status | Issue | Location |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | <category> | NEW | <one-line issue> | `file/path:line` |

### F1 — <title>
- **What:** <the defect, and the concrete evidence that proves it real>
- **Why it matters:** <impact / who it affects> <· optional standard or criterion ref, e.g. WCAG 2.1.2 / OWASP A01>
- **Fix:** <the specific remediation>

## Scorecard
| Category | Score | Notes |
| --- | --- | --- |
| Route/service separation | <X>/10 | <one-line justification> |
| Validation | <X>/10 | <one-line justification> |
| Responses | <X>/10 | <one-line justification> |
| Auth guards present | <X>/10 | <one-line justification> |
| Rate limiting | <X>/10 | <one-line justification> |
| Pagination | <X>/10 | <one-line justification> |
| State transitions | <X>/10 | <one-line justification> |
| Audit logging | <X>/10 | <one-line justification> |
| Cron / webhooks | <X>/10 | <one-line justification> |

## Action items
Tiers by phase — `development` → **Fix Now / Before Launch / Post-Launch**; `production` → **Fix Now / Next Release / Backlog**. Each task references a finding ID.

### <Tier>
| # | Priority | Task (finding ID) | Effort |
| --- | --- | --- | --- |

## Resolved since last audit
| ID | Issue | How it was resolved |
| --- | --- | --- |
```

### Output

Every run produces two things:

- **Full report** → `_reports/api-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Scope it first: identify the in-scope surface (a dedicated API app, route handlers acting as a BFF/webhooks, or Server Actions calling services — the latter drops the HTTP-envelope checks but keeps service/validation/guard/audit rules). Judge every handler against the standard, not against its neighbours: a shape that all the siblings share can still be wrong, and consistent-but-wrong is a **systemic** finding (report it once, note the count) rather than a clean bill of health.

### Route/service separation

- Routes are **thin orchestrators** running one fixed sequence and nothing else: **rate-limit → authorize → validate → delegate (one service call) → audit (privileged only) → respond**. Flag a handler that reorders this (e.g. validates before authorizing), skips a step, or makes more than one service call.
- No business logic, DB / data-store calls, branching, or data transformation **in the route** — all of it belongs in the service layer. Flag a handler importing the data store/ORM directly, building queries, or mapping/shaping data inline.
- Logic lives in `<resource>.service.ts`, which takes **validated data + the resolved actor** and returns **plain objects, never a `Response`**. Audience-only operations go in an `admin/` service — flag a **forked admin copy** of shared resource logic instead of reuse.
- **Schema-first build order** — the validated schema and service exist before the route. Flag a route validating against a shape with no shared schema, or logic that lives only in the handler because no service was created.

### Validation

- Zod (or the project's validator) at **every** boundary — request **body**, **query params**, **and** route params — via shared validators, not raw `request.json()` / `searchParams` / `ctx.params`.
- Route params are **awaited then validated** (`validateParams(await ctx.params, …)`) — flag `ctx.params` read raw or without `await` (it is a Promise).
- Shared schemas (e.g. `@app/schemas` or the resource schema file) are reused — flag an inline `z.object()` duplicating one that already exists.
- **Write-safety / no mass-assignment** — a mutating body must be validated by a schema that **omits every server-controlled field** (ownership ids, status, timestamps, counters, roles, moderation, billing) before the service writes it, because the validated body is written wholesale. Flag a handler that spreads a raw/loosely-validated body into a write, or a write schema that accepts fields the caller must not set.

### Responses

- Every handler responds through the **shared builders** — the house set is `ok(data, message?)` / `created(data, message?)` / `paginated(items, cursor)` for success and `errorResponse(error)` for failure, all emitting one fixed envelope (typically `{ success, data | error, message }`). Flag a hand-rolled `Response` / `NextResponse.json()` or an ad-hoc success/error shape.
- A single **`errorResponse(error)`** maps **typed error classes** (`NotFoundError` → 404, `ForbiddenError` → 403, `UnauthorizedError` → 401, `BadRequestError`/validation → 400, `ConflictError` → 409, …) to status codes; services **throw the typed class**, never build error bodies. Flag a service throwing a generic `Error` or a route assembling an error payload by hand.
- Every handler is wrapped in `try { … } catch (error) { return errorResponse(error) }` — flag a handler with no catch, or a catch that swallows / rewrites the error instead of delegating.
- The API sets **no cache policy** (consumers own caching + revalidation) — flag `Cache-Control` / `revalidate` / cache headers set inside a handler.

### Auth guards present

- Every non-public route runs **both** an authentication check (a verified token/session resolves an actor) **and** a permission guard (`requirePlatformPermission` / `requireResourcePermission` / a composite loader) at the top of the handler. Public auth routes (signup / login / password-reset) are the documented exception.
- **Auth on the request** — the handler accepts a verified credential (`Bearer <ID token>` header **or** the session cookie), verified with revocation checked; flag a route trusting an unverified token or a client-supplied user/role id.
- This audit only checks a guard **exists and runs server-side**. Bypass depth (Broken Object-Level Authorization (BOLA)/Broken Function-Level Authorization (BFLA)/Broken Object-Property-Level Authorization (BOPLA), tenant isolation, the update-vs-create bypass) is deeper security — enhance with `backend-security` / `security-audit` when installed.

### Rate limiting

- **Every handler is rate-limited**, tier chosen by what the route _does_, not what it costs — auth / sensitive-auth / strict-write / read / public-read / dedicated high-volume. No exemptions for "internal" or "cheap" reads. A traffic shape fitting no existing tier gets its **own** tier (with a comment), not a stretched one.
- Cron, webhooks, and dev routes skip **user** rate-limiting **but must be self-authed** (see Cron / webhooks). Credential endpoints add a **login lockout** (e.g. lock an `(IP, email)` pair after N failures) on top of the rate limit.

### Pagination

- List endpoints use **cursor pagination, never offset/`skip`** — a shared helper, an **opaque cursor token (a doc/row id, not a page number)**, the fixed `paginated` envelope (`{ items, nextCursor }`-shaped), and a **capped, validated page size** (a hard max, with a default). Flag offset/limit paging, an uncapped `pageSize`, or a bespoke pagination shape.

### State transitions

- State changes are their **own POST sub-routes** — mirroring `publish`/`unpublish`, `archive`/`unarchive`, `restrict`/`unrestrict` (a verb per transition). Flag state flipped via a `PATCH` boolean flag / query param where a sub-route is the established pattern.
- **`DELETE` only removes a row** — flag a `DELETE` used to "turn something off" (soft-delete / deactivate belongs in a transition sub-route).
- Transitions are **idempotent and guarded** — re-issuing "publish" on an already-published resource must not corrupt state.

### Audit logging

- **Privileged / admin mutations** log an entry with **actor, action, target id, and request metadata** (fire-and-forget is fine); ordinary user routes don't. Flag a privileged mutation (role/permission change, admin edit/delete, billing action, moderation) with no audit call.
- The `action` is a value in a **typed audit-action union registered in one place** — flag an ad-hoc string literal, and flag a new privileged mutation whose action isn't registered in that union.

### Cron / webhooks

- **Cron** endpoints verify the scheduler's **OpenID Connect (OIDC) token** (correct audience + a fixed service-account email), not a user session — flag a cron route open, guarded only by a shared secret in the URL, or behind normal user auth. A local-dev bypass behind a flag is fine.
- **Webhooks** verify a **cryptographic signature** from the sender (constant-time compare of the raw body against the signing secret) — flag an unverified webhook or one that parses the body before verifying.
- Both are **idempotent** — dedupe by a deterministic id and guard state transitions so a re-delivery is a no-op.

### Proxy / edge gate (if present)

- A single `/api/*` gate (proxy/middleware) enforces a **CORS allowlist** (per-env origins; `Allow-Credentials: true` only for the cookie) and **CSRF** (reject mutating methods whose `Origin` is off the allowlist with 403). Flag `Access-Control-Allow-Origin: *` alongside credentialed cookies, or mutating routes with no origin check.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
