# Server hardening — concrete patterns

Companion to the `backend-security` skill. Copy-adaptable server-side snippets. The API _architecture_ these plug into (guards, response builders, rate-limit tiers) lives in `backend`; the Firebase specifics in `firebase`.

## Object-level authorization (Broken Object-Level Authorization, BOLA) — check ownership on the resolved doc

```ts
// Decode the token ONCE, load the doc, resolve the actor's role on it, then assert.
export async function loadResourceWithPermission(request: Request, id: string, perm: Permission) {
  const actor = await getActor(request);                 // server-verified identity
  const doc = await getResource(id);                      // load the SPECIFIC object
  if (!doc) throw new NotFoundError();
  if (doc.tenantId !== actor.tenantId) throw new NotFoundError(); // tenant isolation (404, not 403)
  const role = resolveResourceRole(actor, doc);          // owner / editor / viewer
  if (!can(role, perm)) throw new ForbiddenError();       // pure policy check
  return { actor, doc };
}
```

Never authorize from an id/role in the request body. Cross-tenant misses return **404**, not 403 (don't confirm the object exists).

## Property-level (Broken Object-Property-Level Authorization, BOPLA) — allowlist writes, Data Transfer Object (DTO) reads

```ts
// WRITE: pick exactly what the caller may set. .omit()/.partial() are fail-open — a new
// server-controlled field is silently writable. Allowlist instead.
const UpdateProfileInput = ProfileSchema.pick({ displayName: true, bio: true });
const data = UpdateProfileInput.parse(await request.json());
await updateProfile(id, data);                            // service writes only these fields

// READ: map to an explicit DTO — never return the raw document to a less-privileged caller.
function toProfileDTO(doc: UserDoc) {
  return { id: doc.id, displayName: doc.displayName, bio: doc.bio }; // no email/role/internal flags
}
```

## JWT verification

```ts
const payload = jwt.verify(token, key, {
  algorithms: ["RS256"],        // pin the algorithm — never accept "none" or a client-chosen alg
  issuer: EXPECTED_ISS,
  audience: EXPECTED_AUD,
});                              // throws on bad signature / iss / aud / exp
if (await isRevoked(payload.jti)) throw new UnauthorizedError(); // blocklist for logout/rotation
```

Short-lived access token + rotating refresh token in an httpOnly cookie. No secrets/PII in the payload (signed, not encrypted).

## SSRF (Server-Side Request Forgery)-safe outbound fetch

```ts
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

const ALLOWED_HOSTS = new Set(["api.partner.com"]);

export async function safeFetch(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new BadRequestError("scheme"); // reject file:/gopher:/http: etc.
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new BadRequestError("host");
  const records = await lookup(url.hostname, { all: true });  // ALL A + AAAA records, not just the first
  for (const { address } of records) {
    if (ipaddr.parse(address).range() !== "unicast") throw new BadRequestError("private/metadata ip");
  }                                                            // blocks 169.254.169.254, 10/8, ::1, fc00::/7…
  return fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) }); // no redirects, tight timeout
}
```

Gaps to close beyond this sketch: there's a **validate-then-connect** TOCTOU (the resolver can return a different IP on the real connection — pin the validated IP for the actual socket where your client allows it), and cover IPv6/decimal/octal-encoded hosts. Apply the **same guard to any URL an LLM tool** can make the server fetch (prompt-injection SSRF).

## Rate-limit tiers

```ts
export const RATE_LIMITS = {
  AUTH:      { windowMs: 60_000, max: 5 },    // login, signup, password reset — + (IP,email) lockout
  SENSITIVE: { windowMs: 60_000, max: 10 },   // destructive or costly authed ops (delete, export, billing)
  WRITE:     { windowMs: 60_000, max: 30 },   // normal authed writes
  READ:      { windowMs: 60_000, max: 300 },  // authed reads
  PUBLIC:    { windowMs: 60_000, max: 100 },  // anonymous reads
} as const;

// on limit: return 429 with Retry-After. Tier by what the route DOES, not what it costs.
```

## Parameterized query (no string-building)

```ts
// GOOD — placeholders; the driver escapes values
await db.query("SELECT id, name FROM users WHERE tenant_id = $1 AND id = $2", [tenantId, id]);
// NoSQL: never pass a raw request object as a filter (operator injection) — pick scalar fields explicitly.
```

## Fail-closed error handling

```ts
try {
  await doPrivilegedThing(actor);
} catch (error) {
  logger.error({ error, correlationId, actorId: actor.id }); // details server-side only
  return errorResponse(error); // typed error → status + generic message; NEVER a stack trace to the client
}
// A catch must DENY. Never `catch { return allow() }`.
```
