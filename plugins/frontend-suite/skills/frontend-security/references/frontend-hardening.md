# Frontend hardening — concrete patterns

Companion to the `frontend-security` skill. Copy-adaptable snippets for the client-side controls it mandates. Header/Content Security Policy (CSP) plumbing specifics live in `nextjs-best-practices`; these show the _shape_ to aim for.

## Sanitized HTML — one `<SafeHtml>` wrapper

Never call `dangerouslySetInnerHTML` inline. Route all rich/CMS/user HTML through a single sanitizing component so the allowlist lives in one place.

```tsx
import DOMPurify from "isomorphic-dompurify";

type SafeHtmlProps = { html: string; className?: string };

// The ONLY place dangerouslySetInnerHTML is allowed. Everything untrusted goes through here.
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

Tighten the config per use (`ALLOWED_TAGS`/`ALLOWED_ATTR`) for comments vs. articles. Sanitize server-rendered HTML strings too — SSR does not escape hand-built markup.

## Strict, nonce-based CSP

Generate a per-request nonce in the Proxy, expose it, and reference it in `script-src`. Plumbing → `nextjs-best-practices`; the **policy** below is the point.

```ts
// per request: const nonce = crypto.randomUUID() (or base64 of random bytes)
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  `style-src 'self' 'nonce-${nonce}'`,
  `img-src 'self' data: https:`,
  `connect-src 'self' https://<your-api>`,
  `frame-ancestors 'none'`,          // clickjacking — most apps deny framing
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `require-trusted-types-for 'script'`, // hardening upgrade; verify app compat first
  `trusted-types app dompurify`,        // MUST accompany require-trusted-types-for — names the allowed policies; without it every DOM sink write throws
  `report-to csp-endpoint`,
].join("; ");
// report-to needs a named endpoint — send this header alongside the CSP:
// Reporting-Endpoints: csp-endpoint="https://example.com/csp-reports"
```

Rules: **no `unsafe-inline`, no `unsafe-eval`.** Roll out as `Content-Security-Policy-Report-Only` first, review reports, then switch to enforcing. Evaluate with Google's CSP Evaluator.

## Origin-checked `postMessage`

```ts
const ALLOWED_ORIGINS = new Set(["https://widget.example.com"]);

window.addEventListener("message", (event) => {
  if (!ALLOWED_ORIGINS.has(event.origin)) return;          // never trust an unlisted origin
  const parsed = WidgetMessageSchema.safeParse(event.data); // validate shape (Zod)
  if (!parsed.success) return;
  handleWidgetMessage(parsed.data);
});

// sending: target a specific origin, never "*"
iframeRef.current?.contentWindow?.postMessage(payload, "https://widget.example.com");
```

## Sandboxed third-party embed

```tsx
// grant only what's needed; avoid allow-scripts + allow-same-origin together (that re-opens the sandbox)
<iframe
  src="https://third-party.example.com/widget"
  sandbox="allow-scripts allow-forms"
  referrerPolicy="no-referrer"
  title="Third-party widget"
/>
```

## Subresource Integrity (SRI) on CDN assets

```html
<script
  src="https://cdn.example.com/lib@1.2.3/lib.min.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
></script>
```

Pin the version and regenerate the hash on upgrade. Prefer self-hosting; if you must use a CDN, SRI is mandatory.

## Safe external link

```tsx
<a href={url} target="_blank" rel="noopener noreferrer">…</a>
```

`noopener` blocks `window.opener` hijacking; `noreferrer` stops referrer leakage.

## Open-redirect-safe navigation

```ts
// Only allow same-origin targets. Naive string checks miss "/\evil.com", "/%2F%2Fevil.com",
// backslash and protocol-relative bypasses that browsers normalize off-site — resolve against
// the origin and compare the resulting origin instead.
export function safeRedirectTarget(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  try {
    const url = new URL(next, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}
```

## Auth-token storage (house model)

- Session lives in an **httpOnly + Secure + SameSite cookie** (set server-side → `backend-security`). JS can't read it, so XSS can't exfiltrate it.
- **Never** `localStorage`/`sessionStorage` for auth tokens. If a short-lived access token must be in JS, keep it **in a module variable (memory)** only, and refresh via the cookie.
- No secrets, PII, or tokens in URLs, `console` logs, analytics payloads, or devtools-visible state; gate production source maps.
