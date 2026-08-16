---
name: rbac-audit
description: >-
  Manually invoked. RBAC / authorization-coverage audit — unprotected API routes and Server Actions, function-level (BFLA) and object-level (BOLA) coverage, property-level / mass-assignment (BOPLA) exposure, the permission registry, the role-to-permission hierarchy, frontend gates that must back onto server checks, and data-layer rules coverage. Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `backend-security`, `firebase-architecture`, and `api-architecture` are an optional enhancement (rule internals hand off to `firebase-security-rules-auditor`). Part of the house audits family (see `audit-all`).
argument-hint: "[phase] [path]"
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# RBAC audit

A **manually-invoked, red-team RBAC audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/rbac-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`backend-security`**, **`firebase-architecture`**, and **`api-architecture`** (rule internals → **`firebase-security-rules-auditor`**) ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/rbac-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/rbac-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/rbac-audit.md`:

```
# RBAC audit — <app/scope>

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
| Route coverage | <X>/10 | <one-line justification> |
| Permission registry | <X>/10 | <one-line justification> |
| Role hierarchy | <X>/10 | <one-line justification> |
| Object-level | <X>/10 | <one-line justification> |
| Property-level | <X>/10 | <one-line justification> |
| Frontend gates | <X>/10 | <one-line justification> |
| Data rules | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/rbac-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Self-contained — the concrete criteria are inline below. Check every API route/Server Action, the permission registry, the role mappings, the object-level checks, the frontend gates, and the data rules. If `backend-security` (authorization), `firebase-architecture` (role model), or `api-architecture` (guards) are installed, they deepen each section and give the app's own patterns to match — but the audit runs without them. Only rules-file _internals_ hand off — to `firebase-security-rules-auditor`.

The frame is **broken access control** (OWASP #1): **Broken Object-Level Authorization (BOLA)** (object-level — a forged id reaches another actor's resource), **Broken Function-Level Authorization (BFLA)** (function-level — an operation runs without the permission it requires), and **Broken Object-Property-Level Authorization (BOPLA)** (property-level — a request sets or reads fields the actor may not, e.g. mass assignment of `role`/`ownerId`/`status`). Every section below targets one or more of these.

### Route coverage (BFLA)

- **Every mutating or sensitive endpoint is guarded** — each exported HTTP handler (POST/PUT/PATCH/DELETE and any sensitive GET) and each Server Action asserts **auth + the specific permission that operation requires**, not just "is authenticated". Enforced server-side, never from a client flag. A route reachable without the permission it needs is BFLA (function-level).
- **No unprotected endpoints** — categorize each route as public (explicitly, e.g. auth/webhook), auth-only (authenticated, no role), or permission-guarded; flag any non-public route with none of these. Webhooks/cron verify a signature / OpenID Connect (OIDC) instead of a user permission — flag those that verify nothing.
- **Guard sits in the right place** — at the thin route/action boundary before the service runs (→ `api-architecture`), not buried mid-service or after a side effect.

### Permission registry

- **Actions are registered and typed in one place** — every permission passed to a guard/`can()` call comes from the single permission registry, typed (no ad-hoc string literals scattered across routes).
- **No unregistered actions** — flag any permission string used in code that the registry doesn't define (a typo silently grants or denies).
- **No orphans** — flag registered actions used by no route/action. In `development` these are often "defined, not yet used" for planned routes — note them, don't treat as errors; in `production`, treat a truly dead permission as cleanup.

### Role hierarchy

- **Mapping is correct** — the role→permission mapping assigns each permission deliberately; every registered action belongs to at least one role.
- **Higher roles superset lower** — where roles are tiered, a higher role holds every permission of the one below it plus its own. Flag a lower role holding a permission its superior lacks (a hierarchy gap).
- **No privilege gaps or over-grants** — flag a role granted a permission outside its intended domain (over-grant) or a sensitive action reachable by a role that shouldn't have it. Read-only/limited roles must not hold create/update/delete outside their scope.
- **Allowlist roles received recent permissions** — for every recently added permission, verify each allowlist-based role that should hold it was explicitly granted it. Allowlists never auto-receive new permissions (only top/exclusion-based roles do), and a route shipped without the grant is the most common RBAC bug: the endpoint exists, the intended role is denied.

### Revocation and staleness

- **A token-embedded role is a cached role** — where roles live in a JWT/custom claims, they stay live until the token refreshes (up to an hour). Flag any check that must take effect immediately — a ban, a role downgrade, a plan/entitlement drop, removing someone from a resource — resolved from the token rather than the store.
- **Revocation actually revokes** — removing a role, banning a user, or deleting an account invalidates the existing session (refresh tokens revoked, and verification checks the revoked flag), rather than relying on natural expiry. Flag a "ban" that leaves a valid session usable.
- **The store is the source of truth** — cached roles are re-derived from the stored records, never edited independently, and a client-writable role field is immutable at the data layer. Flag any path where a user can set their own role.

### Object-level (BOLA)

- **Per-resource roles checked on the resolved doc** — for resource-scoped access, the guard resolves the target document and checks the actor's **per-resource role on that doc**, not merely "is authenticated" or "has some global role". Flag any id-addressed handler that skips the object-level check (BOLA/IDOR).
- **Tenant / owner isolation** — reads and writes are scoped to the actor's tenant/owner; changing an id in the path/body must not reach another tenant's data.
- **Every id in the payload is re-authorized** — when a request references multiple resources (parent + child, a batch, or a nested/foreign-key id like "move X into Y"), **each** referenced id is authorized, not just the first/outermost one. Flag any handler that trusts an inner or foreign-key id because the outer one passed.

### Property-level (BOPLA)

- **Writes are an allowlist, not the raw body** — the write path sets only fields the actor may set; server-controlled fields (`ownerId`, `role`/permissions, `status`, `tenantId`, timestamps, counters, billing) are never bound from the request body. Flag any handler that spreads the request body into a write (mass assignment) — a privilege escalation via a smuggled `role`/`ownerId`.
- **Reads don't over-expose** — responses return an explicit field set, not the whole document, to a less-privileged caller. Flag a raw `{ id, ...doc }` returned across a trust boundary (leaks server-only or other-actor fields).

### Frontend gates

- **Gates exist but are UX, not the boundary** — page/layout gates and Server Action re-checks improve UX and prevent obvious mistakes, but the **server is the real gate**. Confirm the frontend layering exists (authenticated route groups require auth; role-differentiated areas filter by permission; nav hides links the actor can't use) — and confirm it is _not_ the only thing standing between a user and a mutation.
- **Server Actions re-check server-side** — every data-mutating Server Action re-resolves the actor server-side and calls the permission check itself; flag any that trust client-side gating alone (an exploitable bypass).
- **Gate by differentiation, not blanket wrapping** — recommend a page-level check only when a page is narrower than its layout's already-gated role set; a redundant check on a page no smaller than its layout is noise, not defense-in-depth.

### Data rules

- **Rules exist for every collection/bucket** — each data collection and storage bucket has a security rule; flag any with none (especially private originals that must never be public).
- **Rules align with API guards** — client-writable paths in the rules match what should be client-writable; anything meant to flow only through the privileged server path (Admin SDK) must not be client-writable in the rules. Flag a collection missing from the rules, or writable by clients when it shouldn't be.
- **Rules files declare `rules_version = '2'`** — a file without the declaration falls back to v1 semantics (no collection-group queries, different wildcard behavior); flag any rules file missing it.
- **`firebase.json` references exist on disk** — every rules/indexes file it points at (`firestore.rules`, `firestore.indexes.json`, each storage target's rules file) is actually present; a dangling reference breaks deploy or silently deploys nothing.
- **Deny-all posture holds** — in a server-mediated architecture every `allow` clause is either `if false` or carries a comment justifying the client access; flag client bucket/collection writes that have neither.
- **No server service imports the client SDK** — server code talks to the data store via the Admin SDK only; flag any server-side import of `firebase/firestore` / `firebase/storage` (client-SDK calls from the server are subject to rules and break the access model).
- **Depth → `firebase-security-rules-auditor`** — this audit checks _coverage and alignment_ only. Hand off rule-internal correctness (privilege-escalation, create-vs-update inconsistencies, `hasOnly`/type/size checks) to that specialist.

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
