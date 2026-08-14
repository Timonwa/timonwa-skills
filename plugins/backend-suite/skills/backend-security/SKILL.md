---
name: backend-security
description: >-
  Use for server-side / API application security when building or reviewing server-side code — endpoints (route handlers, Server Actions, controllers), services, cron jobs, webhooks — authorization (BOLA, function-level, mass assignment / property-level, tenant isolation), authentication & sessions (JWT verification, token rotation + revocation, password hashing, MFA, lockout), injection & input validation, SSRF, resource-consumption / DoS limits (rate limits, payload + pagination caps), secrets & config, error hygiene, data protection, audit logging, file-upload safety, and CSRF. Mapped to OWASP Top 10 2025 + OWASP API Security Top 10 2023. Client-side security → `frontend-security`. Mechanics live in the specialists — API architecture → `backend`; Firebase auth/rules/RBAC/App Check → `firebase`; Server Action / Proxy / route-handler APIs → `nextjs-best-practices`; schemas → `typescript-best-practices`; secrets / supply chain / CI headers → `devops`. A full review is the manual `security-audit` command.
model: opus
effort: high
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Backend security

In-depth **server-side / API security** for backends (route handlers, Server Actions, services, cron, webhooks). The server is the **only real trust boundary** — every control the client can't be trusted to enforce lives here. Its sibling **`frontend-security`** owns the browser; a full-stack app applies both, an API-only service may apply only this one.

> **Delegations:** the client side (XSS, Content Security Policy (CSP), token storage, third-party scripts) → **`frontend-security`**; API _architecture_ (thin route → service, RBAC guard shape, rate-limit tiers, typed errors + response builders, cursor pagination, cron/webhook wiring) → `backend`; Firebase auth/session-cookie/rules/RBAC-role model/App Check → `firebase` (+ `firebase-security-rules-auditor`); Server Action / Proxy / route-handler mechanics → `nextjs-best-practices`; Zod schemas → `typescript-best-practices`; secrets, supply-chain hardening, security headers in CI → `devops`.
>
> **Concrete snippets** (ownership check, field allowlist mapper, Server-Side Request Forgery (SSRF) URL guard, JWT verify, rate-limit tiers, safe query) → `references/server-hardening.md`. **A full app review** → the manual **`security-audit`** skill.

## First principle — authorization is the whole game

Across the 2025 web and 2023 API Top 10s, **broken access control is #1** — Broken Object-Level Authorization (BOLA) is consistently the top-reported API vulnerability class. So the backend's core job: **re-authorize every request against the specific object, function, and fields it touches**, from the actor's server-verified identity — never from anything the client sent. Client checks are UX; the API is the gate.

## The map — OWASP Top 10 2025 + API Security Top 10 2023

- **A01 / API1 BOLA + API5 Broken Function-Level Authorization (BFLA) + API3 Broken Object-Property-Level Authorization (BOPLA)** — object-, function-, and property-level authorization. The dominant risk (below).
- **A07 / API2 Broken Authentication** — sessions/tokens/passwords (auth below).
- **A05 Injection** — SQL/NoSQL/command (validation below).
- **A08 Software or Data Integrity Failures** — unsafe deserialization of untrusted data (validation below).
- **API7 / A01 SSRF** — user-controlled outbound requests (SSRF below).
- **API4 Unrestricted Resource Consumption** — rate/size/complexity limits (limits below).
- **API6 Sensitive Business Flow abuse** — bots draining high-value flows (limits below).
- **A02 / API8 Security Misconfiguration** — secrets, CORS, defaults, debug (config below).
- **A04 Cryptographic Failures** — weak/missing encryption, bad randomness (data protection below).
- **A09 Security Logging & Alerting Failures** — missing or unmonitored audit trails (audit logging below).
- **A10 Mishandling of Exceptional Conditions** — fail-open, verbose errors (error hygiene below).
- **A03 Software Supply Chain Failures** — dependency/CI compromise; delegated to `devops`.
- **API9 Improper Inventory** + **API10 Unsafe Consumption of APIs** — old endpoints, blind trust in upstreams (below).

## Authorization (the core)

- **Object level (BOLA)** — on _every_ request that references a resource by id, verify the actor owns or may access **that specific object** before reading/writing it. Never infer access from "is authenticated" or from an id in the request body. **Re-authorize every id in the payload, not just the URL's** — a valid parent + attacker-controlled child/foreign-key id (`move task X into project Y`) must also check access to Y. Enforce **tenant/row isolation** so a query can't cross tenants (→ `references/server-hardening.md`).
- **Function level (BFLA)** — every route/action asserts the required permission for _that operation_ (admin routes especially). A guard at the top, from a central policy (`can()`), not scattered `if` checks. The role model (claims + per-resource roles) → `firebase`; the guard shape → `backend`.
- **Property level (BOPLA = mass assignment + excessive data exposure)** — never bind a request body wholesale to a stored object, and never return a document wholesale.
  - **Writes:** an **allowlist** schema — the write schema omits _every_ server-controlled field (ownership, role, status, timestamps, counters, billing). `.omit()`/`.partial()` are **fail-open**; prefer `.pick()` of exactly what the actor may set (→ `backend` write-safety, `firebase`).
  - **Reads:** map to an explicit **response Data Transfer Object (DTO)**; never `return { id, ...doc.data() }` to a less-privileged caller (leaks fields).
- **Defense in depth** — re-check at each layer (edge/gateway → route → service → data rules). The data layer (Firestore/Storage security rules) is the last backstop, not the only one (→ `firebase-security-rules-auditor`).

## Authentication & sessions (A07 / API2)

- **House flow** — client sign-in → ID token → **httpOnly, Secure, SameSite session cookie**, verified server-side with check-revoked; reject unverified email by default (→ `firebase`). Accept `Bearer <ID token>` _or_ the cookie on the API (→ `backend`).
- **Tokens** — short-lived access tokens + **refresh rotation**; maintain a **revocation/blocklist** (a JWT can't otherwise be invalidated). **Verify signature, `iss`, `aud`, and `exp`** on every token; reject `alg: none` and unexpected algorithms. **JWTs are signed, not encrypted** — no secrets/PII in the payload.
- **Passwords & accounts** — hash with **bcrypt/argon2/scrypt** (never fast hashes); enforce a **login lockout** on `(IP, email)` + rate limits to blunt credential stuffing; keep auth responses **uniform** to avoid account enumeration; offer/enforce **MFA** for privileged accounts.
- **Reset / verification / magic-link tokens** (a top takeover vector) — high-entropy (CSPRNG), **single-use, short-TTL, hashed at rest**, invalidated on use or password change; never leak them in logs/URLs, and **don't build the reset link from a client `Host` header** (host-header poisoning) — use a configured base URL.
- **Session lifecycle** — **invalidate all sessions/refresh tokens on password change, MFA reset, role/permission downgrade, and account recovery**; rotate the session id on privilege elevation (session-fixation defense).

## Injection & input validation

- **Validate at the boundary with Zod** — body, query, **and route params** — and infer types from the schema (→ `typescript-best-practices`). Reject unknown keys; bound lengths and ranges.
- **Never build queries/commands from strings** — parameterized queries / the ORM's safe API for SQL, safe operators for NoSQL, no shelling out with user input (command injection), no user input in file paths (**path traversal** — resolve + confine to a base dir).
- **Unsafe deserialization (A08)** — don't deserialize untrusted data into privileged types; **server-side prototype pollution** — guard deep-merge/`Object.assign` from untrusted JSON; avoid user-controlled template/`eval` paths (template injection, RCE).

## SSRF (server-side request forgery)

When the server fetches a **user-supplied URL** (webhooks, image proxies, link previews, imports, LLM tools):

- **Allowlist** destinations (scheme + host); reject everything else. Block private/loopback/link-local ranges and the **cloud metadata IP `169.254.169.254`**.
- **Disable HTTP redirects** (or re-validate each hop); resolve DNS and validate the _resolved_ IP to defeat **DNS rebinding**; set tight timeouts.
- **LLM/agent tools** — an SSRF vector via **prompt injection**; apply the same allowlist to any URL a model can cause the server to fetch.

## Resource consumption & abuse (DoS)

- **Rate-limit every endpoint by tier** (auth / sensitive / write / read / public), return **429 + `Retry-After`**; a route that fits no tier gets its own. Tier by _what it does_, not what it costs (→ `backend`).
- **Cap the inputs** — max request-body size, **mandatory pagination limits** (cursor, capped page size → `backend`), upload size/count, and per-request timeouts.
- **Algorithmic / CPU DoS** — treat regex and parsing as attack surface: no user-controlled or catastrophically-backtracking regexes on request input (**ReDoS**); bound parse work and **reject decompression/zip bombs** by capping decompressed size.
- **GraphQL** (if used) — enforce **query depth + complexity** limits, **disable introspection in prod**, and cap **aliasing/batching** (batched or aliased operations bypass per-request rate limits).
- **Sensitive business flows (API6)** — protect high-value flows (signup, checkout, invites, password reset) from automated abuse with lockout + bot mitigation, beyond raw rate limits.

## Concurrency & idempotency

- **Race conditions / TOCTOU** — guard state transitions and limited-quantity flows (balance debits, redeem/claim, invite-accept, seat allocation) with a **transaction / atomic conditional update or a lock**. A check-then-act split across two calls is a double-spend / coupon-reuse bug.
- **Idempotency for client mutations** — accept and enforce an **`Idempotency-Key`** on retriable POSTs (payments, orders, sends) and dedupe on it, so a retry or double-click can't create duplicate side effects (webhooks/cron dedupe the same way → `backend`).

## Secrets, config & error hygiene

- **Secrets** — in a **Secret Manager**, never in code, `NEXT_PUBLIC_*`, or committed `.env`; rotate on a schedule; **least-privilege service accounts**; validate env at boot with Zod (→ `devops`, `nextjs-best-practices`).
- **Configuration** — tight **CORS** (specific origins, not `*`; `Allow-Credentials` only with an explicit origin), disable debug/introspection in prod, secure defaults, no directory listing or verbose banners (→ `backend` proxy, `devops` headers).
- **Error handling (A10) — fail closed.** A `catch` must **deny**, never grant. Return a **generic message + correlation id** to the client; log details server-side. Never leak stack traces, SQL, internal paths, or which check failed.

## Data protection (A04)

- **In transit** — HTTPS everywhere + HTTP Strict Transport Security (HSTS) (→ `devops`). **At rest** — rely on the platform's encryption; **field-level encryption** for especially sensitive PII (→ `field-encryption`).
- **Minimize & mask** — collect the least data needed; **never log secrets/tokens/PII** or put them in URLs (query strings hit proxy/CDN/browser logs); redact in logs and error reports.
- **Randomness** — generate all security-sensitive values (tokens, nonces, ids, salts) with a **CSPRNG** (`crypto.randomBytes` / `crypto.randomUUID`), never `Math.random()` or timestamps.

## Audit logging & monitoring (A09)

- **Log privileged/security-relevant actions** (auth events, role changes, admin mutations, deletes) with actor, action, target, and request metadata — action strings a typed union, not ad-hoc (→ `backend`).
- Make logs **tamper-resistant** and **alert** on anomalies (auth failure spikes, 4xx/5xx surges, new-device sign-ins). Don't log the sensitive payloads themselves.

## File uploads

Validate **type and size server-side** (never trust the client content-type or extension); store outside the web root / in object storage with least-privilege; prefer the **reserve-then-upload, rules-gated** model (→ `firebase`); scan where feasible; serve via signed URLs, not by echoing user paths.

## CSRF, webhooks & third-party APIs

- **CSRF** — for cookie auth, enforce `SameSite` **and** a server-side **Origin/Referer allowlist** on mutating requests (reject off-allowlist with 403) — the proxy owns this (→ `backend`, `nextjs-best-practices`).
- **Webhooks / cron** — verify a **signature** (webhooks) or the scheduler's **OpenID Connect (OIDC) token** (cron) with a **constant-time compare** (`crypto.timingSafeEqual`, never `===`); reject events **outside a small signed-timestamp window** (replay defense); make handlers **idempotent** (dedupe by a deterministic id). They skip user rate-limiting but authenticate their own way (→ `backend`).
- **Unsafe consumption of upstream APIs (API10)** — don't blindly trust data from third-party APIs; validate/sanitize it, set timeouts, and handle their failures. **Inventory (API9)** — retire deprecated/`/v1` and staging endpoints; no debug routes in prod.

## Do / Don't

- **Do** re-authorize every object/function/field server-side from the verified actor; allowlist writes and map reads to DTOs; verify token signature/iss/aud/exp with rotation + revocation; hash passwords with argon2/bcrypt + lockout; validate all input with Zod and use parameterized queries; allowlist SSRF targets and block metadata IPs; rate-limit + size/paginate/complexity-cap every endpoint; keep secrets in a manager with least-privilege service accounts; fail closed with generic errors + correlation ids; encrypt in transit/at rest and minimize PII; audit privileged actions; verify webhook signatures + cron OIDC and make handlers idempotent.
- **Don't** trust client-sent ids/roles/fields for authorization; bind request bodies wholesale or return raw documents; accept `alg: none` or skip token claim checks; use fast hashes or leak auth timing/enumeration; string-build SQL/NoSQL/commands or deserialize untrusted data; fetch user URLs without an allowlist; leave an endpoint unlimited; commit secrets or over-scope service accounts; return stack traces or fail open in a catch; log secrets/PII; skip webhook/cron auth or idempotency.
