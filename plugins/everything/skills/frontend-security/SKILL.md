---
name: frontend-security
description: >-
  Use for client-side / browser application security when building or reviewing frontend code (React / Next.js) — XSS and safe rendering (JSX escaping, DOMPurify, no raw dangerouslySetInnerHTML, DOM sinks, Trusted Types), a strict nonce-based Content Security Policy, clickjacking (frame-ancestors), postMessage and iframe isolation, SRI + third-party-script risk, client secrets and auth-token storage (no secrets in the bundle, httpOnly cookies, never localStorage), open redirects / reverse tabnabbing, client-side prototype pollution, and not trusting client-side validation. Mapped to OWASP Top 10 2025 (client-relevant risks). Server-side security → `backend-security`. Mechanics live in the specialists — header/CSP/env plumbing → `nextjs-best-practices`; component structure → `code-structure` / `reusables`; a11y of focus/contrast → `accessibility`; schemas → `typescript-best-practices`. A full review is the manual `security-audit` command.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Frontend security

In-depth **client-side / browser security** for web UIs (React / Next.js). The browser is a hostile, fully-inspectable environment — this skill owns the discipline for everything that runs there. Its sibling **`backend-security`** owns the server; a full-stack app applies both, a static/marketing site may apply only this one.

> **Delegations:** the whole server side (access control, injection, Server-Side Request Forgery (SSRF), auth/session, rate limiting, secrets, error hygiene) → **`backend-security`**; header / Content Security Policy (CSP) / env plumbing in Next → `nextjs-best-practices`; component & file structure → `code-structure` / `reusables`; focus/contrast/reduced-motion a11y → `accessibility`; input schemas → `typescript-best-practices`.
>
> **Concrete snippets** (nonce CSP, DOMPurify wrapper, postMessage guard, sandboxed iframe, Subresource Integrity (SRI), safe redirect, token storage) → `references/frontend-hardening.md`. **A full app review** → the manual **`security-audit`** skill.

## First principle — the client is untrusted and inspectable

Everything shipped to the browser is **readable and editable**: source, `NEXT_PUBLIC_*` values, in-memory state, and every network call. Two consequences that drive the rest of this skill:

- **Client-side checks are UX, never enforcement.** Hiding a button, disabling a field, or validating a form in the browser improves experience — it does not secure anything. The server re-decides everything (→ `backend-security`). Assume an attacker calls your API directly with the button removed.
- **Nothing sensitive lives in the client.** No real secrets, no privileged keys, no data the user isn't allowed to see — because they _can_ see it.

## OWASP Top 10 2025 — the client-relevant slice

- **A05 Injection → XSS** — the dominant frontend risk (safe rendering + CSP below).
- **A02 Security Misconfiguration** — missing/weak CSP and security headers, exposed source maps, verbose client errors.
- **A03 Software Supply Chain Failures** — malicious npm packages and third-party scripts running in your bundle (SRI + third-party below; deps → `devops`).
- **A01 Broken Access Control** — the _enforcement_ is server-side (`backend-security`); the frontend must simply never rely on its own checks.

## XSS & safe rendering

XSS is untrusted data reaching a place the browser executes. Defenses are layered — escape, sanitize, and CSP as the backstop.

- **Let the framework escape.** JSX/React auto-escapes interpolated text — that's the safe default; don't defeat it. The danger is where escaping _doesn't_ apply: `href`/`src` (a `javascript:` URL), inline event handlers, `style`, `dangerouslySetInnerHTML`, and any raw DOM write.
- **`dangerouslySetInnerHTML` only on sanitized HTML** — pass it through **DOMPurify** behind a single shared `<SafeHtml>` wrapper (→ `references/frontend-hardening.md`); never hand it raw user/CMS/markdown-rendered content. Same rule for direct `innerHTML`.
- **Know the DOM sinks** — `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `setTimeout`/`setInterval` with a string, `element.setAttribute("on…")`, assigning to `location`/`href`/`src`. Never feed any of them untrusted input. **No `eval`/`new Function`** at all.
- **React has escape hatches beyond `dangerouslySetInnerHTML`** — don't spread untrusted objects into JSX props (`{...userData}`), and never build a `style` string, attribute name, or `href`/`src` from user input; these bypass JSX escaping just like a raw DOM write.
- **Enforce a URL-scheme allowlist** on any user-controlled `href`/`src`/redirect — allow `https:`/`mailto:`/`tel:` and **reject `javascript:`, `data:`, `blob:`, `vbscript:`** (React does _not_ block a `javascript:` href).
- **DOM clobbering** — attacker `id`/`name` attributes in sanitized HTML can shadow globals/properties (`window.config`, `document.getElementById`); don't trust named DOM lookups on user HTML, and enable DOMPurify's `SANITIZE_NAMED_PROPS`/`SANITIZE_DOM`.
- **SSR & Server Components are XSS vectors too** — server-fetched data interpolated into hand-built HTML bypasses client escaping. Render through JSX; sanitize any HTML _string_ regardless of where it renders.
- **Untrusted sources** — `useSearchParams()`, `params`, `location.*`, `document.referrer`, `postMessage` payloads, API responses, and **clipboard `paste` / `drop` HTML** (`getData("text/html")`) are all untrusted; validate/encode/sanitize before rendering, navigating, or writing to the DOM.
- **Trusted Types** (`require-trusted-types-for 'script'`) turn DOM-XSS sinks into typed, guarded operations — React supports it, Next has rough edges, so treat it as a hardening upgrade.

## Content Security Policy — the XSS backstop

Even if something slips through, a strict CSP stops the browser executing it.

- **Strict + nonce-based** — `default-src 'self'`, a per-request **nonce** for scripts/styles, and **no `unsafe-inline` / `unsafe-eval`** (those defeat the whole point). Add `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors` (clickjacking), a **tight `connect-src`** (your exact API + `wss://` origins — a loose one lets injected script exfiltrate), and a `report-to` endpoint. Policy is here; the nonce plumbing is `nextjs-best-practices` (→ `references/frontend-hardening.md`).
- **Trusted Types, done right** — if you set `require-trusted-types-for 'script'`, also declare a **`trusted-types`** directive naming the allowed policy (e.g. your DOMPurify policy) and route sink writes through it; otherwise every DOM write throws.
- **Roll out in `Report-Only` first**, watch violations, then enforce. Evaluate with Google's CSP Evaluator. A CSP full of `unsafe-*` is theatre — flag it as such.

## Clickjacking, framing & cross-window messaging

- **Deny framing** with CSP `frame-ancestors 'none'` (+ legacy `X-Frame-Options: DENY`) unless the app is meant to be embedded — then allowlist specific ancestors. Header baseline → `devops`.
- **`postMessage`** — always **check `event.origin` against an allowlist** _and_ validate the payload shape (Zod) before acting; never `postMessage(data, "*")`. Treat every inbound message as attacker-controlled.
- **Third-party embeds** run in a **sandboxed iframe** (grant only needed tokens; avoid `allow-scripts` + `allow-same-origin` together, which re-opens the sandbox) and communicate over origin-checked `postMessage`.

## Third-party scripts, SRI & bundle surface

- **Every third-party script runs with your privileges** — analytics, tag managers, chat widgets can inject arbitrary code and read the DOM/cookies. Minimize them, prefer self-hosting, and isolate risky ones in a sandboxed iframe.
- **SRI** (`integrity` + `crossorigin`) on every CDN `<script>`/`<link>`, with pinned versions. Dynamic-import chunks that SRI can't cover lean on the CSP + lockfile + supply-chain gates (→ `devops`).
- **Bundle analysis is security-adjacent** — dead deps and unused code enlarge the attack surface and the supply-chain blast radius; prune them.

## Secrets & auth tokens in the client

- **No real secrets in frontend code.** `NEXT_PUBLIC_*` and anything in the bundle is **public** — privileged API keys, signing secrets, and admin creds stay server-side (→ `nextjs-best-practices`, `backend-security`). A key that must ship to the client (e.g. a public analytics key) must be safe to expose _and_ locked down by origin/referrer at the provider.
- **Token storage** — the session belongs in an **httpOnly, Secure, SameSite cookie** (set server-side → `backend-security`); JS can't read it, so XSS can't steal it. **Never** put auth tokens in `localStorage`/`sessionStorage`. If a short-lived access token must be in JS, keep it **in memory only** and refresh from the cookie.
- **Don't leak sensitive data client-side** — no PII/secrets in URLs (they hit history, logs, referrers), `localStorage`, analytics payloads, `console`, or Redux/devtools state; gate or strip **production source maps**; set `autoComplete="off"` on sensitive fields where appropriate; avoid caching private responses in a service worker.

## Navigation & other client pitfalls

- **Open redirects** — validate any `?next=`/`returnTo` against an allowlist or force same-origin relative paths; never redirect to a raw user value (→ `references/frontend-hardening.md`).
- **Reverse tabnabbing** — `target="_blank"` links carry **`rel="noopener noreferrer"`** (blocks `window.opener` hijack + referrer leak).
- **Client-side prototype pollution** — deep-merge/`Object.assign` from untrusted JSON can poison `__proto__`; use safe parsers and guard merges (a common vector in vulnerable frontend deps).
- **CSRF** — for cookie-based auth, protection is `SameSite` cookies + a server origin check (enforced in `backend-security`); the frontend's part is sending requests same-origin and not defeating `SameSite`.
- **File uploads** — client type/size checks are UX only (the server re-validates → `backend-security`); for previews use `URL.createObjectURL` + `revokeObjectURL`, and **never render an uploaded SVG inline** (it executes script) — treat it as an `<img src>` or sanitize it.
- **Service workers** — register from a tight scope, never cache authenticated/PII responses, and treat an XSS-registerable SW as a persistent foothold (be able to `unregister` + purge caches).
- **CORS & header leakage (client side)** — don't paper over CORS with `mode: "no-cors"`; send `credentials: "include"` only to your own origins. Set a strict `Referrer-Policy` (`strict-origin-when-cross-origin` or tighter) so path/query values don't leak in `Referer`, and a locked-down `Permissions-Policy` (header baseline → `devops`).

## Do / Don't

- **Do** treat the client as untrusted and inspectable; escape by default and sanitize all HTML with DOMPurify behind one wrapper; ship a strict nonce-based CSP (no `unsafe-*`) with `frame-ancestors`; origin-check + schema-validate every `postMessage`; sandbox third-party embeds; SRI + pin CDN assets; keep the session in an httpOnly cookie; validate redirect targets; add `rel="noopener"`; prune the bundle.
- **Don't** rely on client checks for authorization; pass raw HTML/user input to `dangerouslySetInnerHTML`/`innerHTML` or any DOM sink; use `unsafe-inline`/`unsafe-eval`/`eval`/`new Function`; store auth tokens in `localStorage`; put real secrets in `NEXT_PUBLIC_*` or the bundle; `postMessage(data, "*")` or skip origin checks; ship source maps/verbose errors to prod; redirect to an unvalidated URL; deep-merge untrusted JSON.
