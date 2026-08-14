---
name: security-audit
description: >-
  Manually invoked. Red-team application-security review of a web/full-stack app (or a diff/PR), scoped to whatever the app has — frontend, backend, or both — covering broken access control (BOLA/BFLA/BOPLA), XSS and unsafe rendering, weak CSP, clickjacking, insecure postMessage/iframes, secrets in the bundle, unsafe token storage, injection, SSRF, unrestricted resource consumption, security misconfiguration, supply-chain exposure, and fail-open error handling, against OWASP Top 10 2025 + OWASP API Security Top 10 2023. Verifies each finding and writes a prioritized report. Not on by default. Self-contained; the house standards `frontend-security` and `backend-security` are an optional enhancement. Part of the house audits family (see `audit-all`).
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
argument-hint: "[phase] [path]"
model: opus
effort: high
---

# Security audit

A **manually-invoked, red-team security audit** of an app or a specific diff/PR. It is **self-contained** — every check is spelled out inline, so it runs a full review with zero other skills installed — and each finding is verified against the real code before it lands in a phase-aware, scored report at `_reports/security-audit.md`.

> **Self-contained** — this checklist is comprehensive on its own and needs no other skill installed. Where the house standard(s) **`frontend-security`** and **`backend-security`** (Firestore/Storage rules → **`firebase-security-rules-auditor`**) ARE present, also apply their house-specific rules as an enhancement. Run the whole house audits family in one pass via **`audit-all`**.

## Arguments

- `[phase]` — `development` | `production`; sets the action-item tiers. Omitted → `production` (assume the app is live until told otherwise — the safer default).
- `[path]` — a file, directory, or PR/diff to scope the audit to; omitted → the whole repo.

## Audit protocol

**Mindset — reviewer/attacker first.** Don't assume code is fine because it looks careful; find the sequence that breaks it. Report only findings you can justify as real, each verified before it lands.

### Method

1. **Resolve phase** — use a phase arg (`development` | `production`) if given; else default `production` — assume the app is live with real users until told otherwise, so a CRITICAL finding gets Fix-Now urgency instead of a pre-launch discount. Phase sets the action-item tiers.
2. **Load the previous report** — if `_reports/security-audit.md` exists, read it: carry unresolved findings forward (same ID, status `UNRESOLVED`), move fixed ones to "Resolved since last audit", and continue ID numbering. First run → skip Resolved and mark all `NEW`.
3. **Run the checklist** (below), collecting findings with `file:line` evidence.
4. **Verify** each candidate — construct the concrete failure/abuse case; drop what you can't show is real; mark uncertain ones "needs confirmation" rather than inflating.
5. **Write the report** to `_reports/security-audit.md` (overwrite) and post the **chat summary** (see Output). Recommend fixes in the report; never modify code. Never commit or push without explicit approval.

### Severity

- **CRITICAL** — actively exploitable or broken now: data loss/leak, security breach, or total failure of the audited concern. Fix immediately.
- **HIGH** — a serious defect that will bite in production or blocks launch. Fix before shipping.
- **MEDIUM** — a real issue with a workaround or limited blast radius. Schedule it.
- **LOW** — minor, polish, or defense-in-depth.

Findings are ordered worst-first in the report.

### Report format

Write to `_reports/security-audit.md`:

```
# Security audit — <app/scope>

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
| Authorization (authz) | <X>/10 | <one-line justification> |
| Auth & sessions | <X>/10 | <one-line justification> |
| Injection | <X>/10 | <one-line justification> |
| Server-Side Request Forgery (SSRF) | <X>/10 | <one-line justification> |
| Resource limits | <X>/10 | <one-line justification> |
| Secrets & config | <X>/10 | <one-line justification> |
| Frontend | <X>/10 | <one-line justification> |

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

- **Full report** → `_reports/security-audit.md`, in the format above, overwriting the prior run.
- **Chat summary** → a short recap posted in chat: the overall `<X>/10` (with Δ vs last run), a severity count (Critical / High / Medium / Low, i.e. C / H / M / L), the top findings worst-first (id · severity · one-line · `file:line`), and the report path. Note any "needs confirmation" items.

**Report-only** — this audit recommends fixes in the report; it never modifies code.

## Checklist

Run the **BACKEND** blocks for any server/API code, the **FRONTEND** blocks for any browser code. Each block is self-sufficient. If installed, `backend-security` / `frontend-security` add extra house-specific depth — optional, not required.

### BACKEND (server / API)

**Authorization — the #1 risk (A01 / API1 Broken Object-Level Authorization (BOLA), API5 Broken Function-Level Authorization (BFLA), API3 Broken Object-Property-Level Authorization (BOPLA))**

- **Object level (BOLA/IDOR)** — can you read/mutate another user's resource by changing an id? Is ownership checked on the **resolved doc**, and is there **tenant/row isolation**? (→ `backend-security`, `firebase`)
- **Function level (BFLA)** — every route/action (esp. admin) asserts the required permission, not just "is logged in"? Enforced server-side, not from a client flag?
- **Property level (BOPLA)** — writes **allowlist** fields (no mass assignment of role/owner/status via `.omit()`/`.partial()`)? Reads map to a **Data Transfer Object (DTO)**, not raw `{ id, ...doc }` (excessive data exposure)?
- **The update bypass** — can create-valid-then-update reach a forbidden state? (rules → `firebase-security-rules-auditor`)

**Auth & sessions (API2)**

- Token signature/`iss`/`aud`/`exp` verified; `alg:none` rejected? Short-lived + rotation + revocation/blocklist? Passwords hashed with argon2/bcrypt? Login lockout + no account enumeration? Session in an httpOnly cookie?

**Injection & SSRF (A03 / API7)**

- Zod at **every** boundary (body, query, params)? String-built SQL/NoSQL/commands, unsafe deserialization, path traversal, server prototype pollution?
- **SSRF** — user-supplied outbound URL without an allowlist / without blocking metadata IP `169.254.169.254`? Redirects followed? Any LLM tool that can fetch a URL?

**Resource consumption & misconfig (API4/API6 / A02 / API8)**

- Rate limit + `Retry-After` on every endpoint (esp. auth/expensive/sensitive flows)? Payload-size / pagination / query-complexity caps? CORS pinned (not `*`)? Debug endpoints, default creds, or deprecated `/v1` in prod (API9)?

**Error handling, data & logging (A10)**

- **Fail-open** logic (a catch that grants)? Verbose stack traces / SQL / internal paths to the client? Secrets/PII in logs or URLs? TLS/HTTP Strict Transport Security (HSTS) + encryption at rest? Privileged actions audited? Webhook signatures / cron OpenID Connect (OIDC) verified + idempotent? Upstream API data validated (API10)?

### FRONTEND (browser)

**XSS & safe rendering (A03)**

- `dangerouslySetInnerHTML` / `innerHTML` / DOM sinks on unsanitized content? One DOMPurify wrapper or scattered raw usage? Untrusted values into `href`/`src` (`javascript:`), inline handlers, `style`, or hand-built SSR HTML? `useSearchParams`/`params`/`location`/`referrer`/`postMessage` rendered without validation? Any `eval`/`new Function`?

**Content Security Policy (CSP), clickjacking & cross-window (A02)**

- CSP present, **nonce-based, no `unsafe-inline`/`unsafe-eval`** (or theatre)? `frame-ancestors`/`object-src 'none'`/`base-uri` set? `postMessage` origin-checked + payload-validated (no `"*"`)? Third-party embeds sandboxed (not `allow-scripts` + `allow-same-origin`)?

**Secrets, tokens & navigation**

- Real secrets in `NEXT_PUBLIC_*` / the bundle? Auth tokens in `localStorage` instead of an httpOnly cookie? PII/tokens in URLs/logs/analytics? Source maps in prod? Open redirect from `?next=`? `target="_blank"` without `rel="noopener"`? Deep-merge of untrusted JSON (prototype pollution)?

**Supply chain (expanded)**

- CDN scripts without Subresource Integrity (SRI)? Risky/abandoned deps, `npm audit` criticals, lifecycle-script exposure, unpinned CI actions? (→ `devops`)

## Boundaries

- **Report-only** — this audit recommends fixes in the report; it never modifies code.
- **Verify each finding is real** — construct the concrete case; drop what you can't show; mark uncertain ones "needs confirmation" rather than inflating.
- **Suggest fixes using the repo's existing helpers** — but only where those helpers themselves conform to the standard; when the repo's own convention is the violation, the suggestion is the standard, not a tidier copy of the drift.
- **Never commit or push without explicit approval.**
