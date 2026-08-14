---
name: field-encryption
description: >-
  Use when encrypting individual sensitive fields at the application level before they reach the data store, or reviewing code that does — symmetric field encryption with Node's built-in crypto (AES-256-GCM), the versioned ciphertext format, and the service-boundary decrypt pattern. Triggers on "encrypt this field", "field-level encryption", "encryption at rest", "AES-256-GCM", "encryption key", "decrypt on read", "hydrate", "key rotation", "ciphertext in the response". Covers the threat model (what it does and does not protect against), which fields to encrypt vs hash vs leave plain, unique-IV + auth-tag mechanics, the hydrate* boundary and the update*() ciphertext-return trap, stripping encrypted fields from list responses, and key provisioning/rotation (printf not echo; key loss = data loss). The broader server-side security surface → `backend-security`; the service layer it lives in → `backend`; the store's field-stripping conventions → `firebase`; secret-manager tooling → `devops`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Field encryption

Application-level encryption of individual sensitive fields with **AES-256-GCM via Node's built-in `crypto`**, keyed from a secret manager — so a copy of the data store is not a copy of the secrets. One principle drives every rule here: **plaintext exists only inside the service layer, between one `encryptField()` call on write and one `hydrate*()` call on read** — the store, logs, list responses, and clients see only versioned ciphertext or nothing.

This is deliberately store- and KMS-agnostic — any secret manager that can hold a 32-byte key works. Real key names, secret ids, and project ids are Bucket B: they live in each project's `AGENTS.md`, never in this skill.

## Threat model — decide honestly before you build

Field encryption is **defense in depth**, not a silver bullet. State what it buys in the design doc, or someone will assume it buys more.

- **It protects against:** a leaked DB export or backup snapshot; over-broad internal read access (an insider or support tool with read-only DB access sees ciphertext); a document accidentally logged (logs show `v1:…`, not the secret); a compromised store-level credential that can't reach the app's env.
- **It does NOT protect against:** a compromised app server or secret manager — whoever holds the key decrypts freely; a route-layer bug that returns the decrypted field on a public endpoint (that's the stripping discipline below, not cryptography); online brute force against a "verify this value" endpoint — rate-limit those (→ `backend-security`).
- **Key loss = data loss.** There is no recovery path for ciphertext whose key is gone. Backup/escrow is part of the design: the secret manager is the source of truth, and at least 2 people must be able to retrieve the key. A design without a written recovery answer is not done.

## Which fields — encrypt vs hash vs plain

- **Encrypted fields can't be queried, sorted, or indexed** — ciphertext is opaque and non-deterministic (fresh IV per write), so equality queries, prefix search, and ordering all break. If the product needs to filter or sort on a field, it cannot be encrypted as-is; that constraint drives the schema design, decide it up front.
- **Encrypt** values the user must read back later — retrievable passcodes, payout/bank details, third-party API credentials stored on the user's behalf. Hashing is wrong here because there's no way to show the value again.
- **Hash, don't encrypt**, values you only ever need to verify or dedupe — login passwords (argon2/bcrypt → `backend-security`), or an HMAC-SHA256 keyed identifier for deduping low-entropy values like IPs (a plain SHA-256 over the small IPv4 space is trivially brute-forced; the keyed HMAC isn't).
- **Leave plain** everything else. Each encrypted field adds a decrypt on every read and removes queryability — encrypt the ~3-10 genuinely sensitive fields, not the document.
- **One key per environment (dev/staging/prod), not per field**, until per-field threat models genuinely diverge (different rotation cadence, different blast radius) — N fields × 3 envs of secrets explodes the rotation/recovery surface while barely changing the threat model, since anyone who can read one secret in the manager can read them all. Revisit the assumption past ~10 encrypted fields.

## The primitive — AES-256-GCM with a versioned format

- **Storage format is `v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>`.** The version prefix is not optional polish — an unversioned format is a trap: the day you must rotate the key or change algorithms, you can't tell old ciphertext from new, so you can't run a rolling migration. With the prefix, `v1:` and `v2:` rows coexist during the backfill window and `decryptField()` dispatches on it.
- **Fresh random IV per encryption** — 12 bytes from `crypto.randomBytes()` (the NIST-recommended GCM nonce length), generated inside `encryptField()`, never passed in, never reused. **IV reuse under the same GCM key is catastrophic**: it leaks the XOR of plaintexts and can let an attacker forge auth tags. This is also why ciphertext is non-deterministic — encrypting the same value twice yields different bytes.
- **Keep the auth tag.** GCM is authenticated encryption: the 16-byte tag (Node's default; `getAuthTag()` after `cipher.final()`, `setAuthTag()` before `decipher.final()`) makes decryption fail on any tampered or wrong-key ciphertext instead of returning garbage. That's the difference from CBC — you get integrity, not just confidentiality. Store the tag alongside the IV and ciphertext.
- **The key is 32 bytes (64 hex chars)** — required by AES-256. Load it from env, validate the exact shape at boot (Zod `z.string().regex(/^[0-9a-f]{64}$/i)`) so a malformed key fails the deploy, not the first decrypt in prod.
- **Decrypt fails closed with a generic error.** Wrong segment count, missing prefix, or a failed auth tag all throw a typed internal error with a generic public message ("Failed to read encrypted field"); the underlying cause goes to server logs only. Never return the raw stored bytes on failure — a value that isn't valid ciphertext is a bug or tampering, and it must surface.
- **`null` passes through both directions** so optional fields stay optional without call-site branching.
- **Verify-style comparisons use `crypto.timingSafeEqual`** (on equal-length buffers), never `===` — decrypt-then-compare endpoints are exactly where timing leaks matter.

## The service boundary — `hydrate*()` on read, plaintext-return on update

- **Callers always pass and receive plaintext; the service owns the ciphertext.** Encrypt immediately before the store write, decrypt immediately after the read. Routes, schemas, and clients never see `v1:…` — the schema keeps the field as plain `string | null`, agnostic to at-rest encryption.
- **Centralize decryption in one `hydrate<Resource>()` helper per service and route every read path through it** — the single get, the list mapper, all of them. One helper is one review surface: a new read path that skips it sticks out in review, and plaintext can't leak into logs, caches, or responses from a path nobody audited.
- **The `update*()` ciphertext-return trap** — a named bug class. Update services typically return `{ ...existing, ...writeUpdates }`; since `writeUpdates.field` is ciphertext bound for the store, the merged return leaks `v1:…` to the caller. Explicitly overwrite the merged field with the plaintext the caller just passed in before returning (example below). Symptom in the wild: a client shows `v1:a3f0…` after an edit but the correct value after a refresh.
- **Always strip encrypted fields from list and public responses.** Ciphertext still leaks that a value exists and roughly how long it is, and it's dead weight on the wire — project list items through an explicit `.pick()` allowlist mapper that omits the field (the stripping mechanics → `firebase`). Only the owner-facing detail/edit read returns the decrypted value.
- **Every encrypted field gets a round-trip test:** encrypt → write → raw read shows `v1:…` → hydrated read returns the original plaintext.

## Key provisioning & rotation

- **Generate with a CSPRNG:** `openssl rand -hex 32` (or `crypto.randomBytes(32).toString("hex")`). Never derive the key from a password or reuse one across environments — each env gets its own key, so a leaked dev key can't read prod data.
- **Write it to the secret store with `printf`, not `echo`** — `echo` appends `\n`, most secret managers store the whitespace literally, and the corrupted key fails hex validation or (worse) silently decrypts nothing: `printf '<64-hex-key>' | <secret-store-cli> set <KEY_NAME> --data-file -`. Read the value back after setting and compare character-for-character.
- **If a key already exists for the environment, never generate a fresh one** — pull the existing value from the secret manager. A fresh key writes ciphertext no other instance can decrypt; this is the most common way new-machine setup corrupts a shared dev environment.
- **Rotation is a plan you write down on day one**, even if the script comes later: (1) add the new key alongside the old in the secret manager, (2) teach `decryptField()` to pick the key by version prefix, (3) switch `encryptField()` to emit `v2:`, (4) backfill — read every `v1:` row, decrypt with old, re-encrypt as `v2:`, (5) only then retire the old key. Pin the secret version during the rollout so an unrelated deploy can't pick up a half-rotated state. Rotate on suspected leak, and as hygiene every 12-24 months.

## Example

```ts
import crypto from "node:crypto";
import { env } from "@/config/env"; // Zod-validated: FIELD_ENCRYPTION_KEY is /^[0-9a-f]{64}$/i
import { InternalServerError } from "@/helpers/errors";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // NIST-recommended GCM nonce length
const VERSION = "v1";

const getKey = (): Buffer => Buffer.from(env.FIELD_ENCRYPTION_KEY, "hex");

/** Plaintext → "v1:<iv>:<authTag>:<ciphertext>" (hex). `null` passes through. */
export function encryptField(plaintext: string | null): string | null {
  if (plaintext === null) return null;
  const iv = crypto.randomBytes(IV_BYTES); // fresh per call — GCM IV reuse is catastrophic
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes, only valid after final()
  return `${VERSION}:${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/** Fails closed: bad format, wrong key, or a tampered byte throws — never returns raw stored bytes. */
export function decryptField(encrypted: string | null): string | null {
  if (encrypted === null) return null;
  const parts = encrypted.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new InternalServerError("Failed to read encrypted field", new Error(`unrecognised ciphertext format (expected "${VERSION}:…")`));
  }
  const [, ivHex, authTagHex, ciphertextHex] = parts as [string, string, string, string];
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex")); // before final(), or GCM can't verify
    return Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]).toString("utf8");
  } catch (cause) {
    throw new InternalServerError("Failed to read encrypted field", cause);
  }
}
```

```ts
// resource.service.ts — the boundary in practice
function hydrateResource(raw: ResourceProps): ResourceProps {
  return { ...raw, accessCode: decryptField(raw.accessCode) };
}

export async function getResourceOrThrow(id: string): Promise<ResourceProps> {
  const raw = await readResourceDoc(id); // …throws typed 404 if missing
  return hydrateResource(raw);
}

export async function updateResource(id: string, updates: UpdateResourceInput): Promise<ResourceProps> {
  const existing = await readResourceDoc(id);
  const writeUpdates: Partial<ResourceProps> = { /* … */ };
  const plaintextForReturn = updates.accessCode; // hold plaintext before it's gone
  if (updates.accessCode !== undefined) writeUpdates.accessCode = encryptField(updates.accessCode);
  await writeResourceDoc(id, writeUpdates);
  const merged = { ...hydrateResource(existing), ...writeUpdates };
  // The update*() trap: writeUpdates.accessCode is ciphertext — return the plaintext the caller sent.
  if (plaintextForReturn !== undefined) merged.accessCode = plaintextForReturn;
  return merged;
}
```

## Boundaries

- The broader server-side security surface — OWASP mapping, secrets discipline, CSPRNG rules, password hashing, rate-limiting verify endpoints, error hygiene → `backend-security`. This skill is the field-encryption deep-dive it delegates to.
- The service-layer architecture the boundary lives in (schema → service → route, typed errors, where `hydrate*` sits) → `backend`.
- The data store and its field-stripping / list-projection conventions (`.pick()` allowlist mappers, `ListItemProps`) → `firebase`.
- Secret-manager tooling, env-validation-at-boot strategy, and CI secret scanning → `devops`; a live-environment key/config review → `environment-audit`.
- Field types and Zod schema shapes (the encrypted field stays `string | null` on the schema) → `typescript-best-practices`.
- The full manual review that checks all of this together → `security-audit`.
