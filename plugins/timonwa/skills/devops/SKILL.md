---
name: devops
description: >-
  Use for a repo's build/ship automation — CI/CD pipelines (GitHub Actions job graph, a composite setup action, affected checks, auxiliary workflows), CI hardening / supply chain (least-privilege token, SHA-pinned actions, secret/SAST/dependency scanning, lifecycle-script hardening, Renovate, artifact provenance/SBOM when publishing), testing + performance gates in CI (Playwright E2E against preview deploys, size-limit / Lighthouse CI budgets), pre-commit hooks (husky + lint-staged + commitlint), security headers, env-management strategy (secrets in `.env`, per-tier constants in committed config keyed off `APP_ENV`, Zod-at-boot validation), quality gates / branch protection (CODEOWNERS, environments), and deploy orchestration (OIDC cloud auth, preview deploys, health-check + rollback). The build tool (turbo tasks/caching) → `turborepo-monorepo`; deploy target / App Hosting → `firebase-architecture` / `firebase-app-hosting-basics`; commit-message format → `stage-commit`; env/secret safety in app code → `nextjs-best-practices` / `firebase-architecture`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# DevOps

How the repo **builds, checks, and ships** — the CI/CD pipeline, pre-commit gates, security headers, env strategy, and delivery. This owns the _automation/pipeline_; the specialists own the pieces it drives.

> **Delegations:** turbo tasks/caching/`--affected` + the workspace → `turborepo-monorepo`; deploy mechanics (App Hosting per-env, Blaze, secrets) → `firebase-architecture` / `firebase-app-hosting-basics`; Conventional Commits → `stage-commit`; env validation + secret handling in app code → `nextjs-best-practices` / `firebase-architecture`; the app-security discipline (OWASP map, Content Security Policy (CSP) policy, client + server hardening) → `frontend-security` / `backend-security`.
>
> **Project facts → `AGENTS.md`:** exact workflow files, branch names, deploy targets/hosts, and secret names.

## CI/CD — GitHub Actions

- **One composite setup action** (`.github/actions/setup`): checkout → `corepack enable` → `pnpm` + Node (`cache: pnpm`) → `pnpm install --frozen-lockfile` → turbo remote-cache env. Every job reuses it; never re-paste setup steps.
- **Job graph:** _changes-detection_ (skip docs-only) → _lint + type-check_ → _format check_ (Biome for JS/TS, Prettier for md) → _build_ → _test_ → _rules-test_ (repos with Firebase only: `@firebase/rules-unit-testing` + emulator integration tests, → `firebase-architecture`). Run **affected** (`turbo run … --affected`, needs `fetch-depth: 0`) on PRs; **full** on protected branches. Share the remote cache (`TURBO_TOKEN`/`TURBO_TEAM`) across runs.
- **Tool ownership (lint/format):** Biome owns JS/TS/JSON formatting + linting; Prettier owns md/mdx **only** — no overlap in either direction (no Prettier overrides for code, no Biome on `.md`). House lint rules: `no-console` as **error** with `info`/`warn`/`error`/`debug` allowed (bans `console.log` specifically); `no-unused-vars` as error with `argsIgnorePattern: "^_"` and the paired convention of prefixing intentionally-unused args (`_event`).
- **Auxiliary workflows, one concern each:** PR-title validation (Conventional Commits), auto-assign, labeler, stale-bot, release notes. Keep them small and separate.

## CI hardening & supply chain

- **Least-privilege `GITHUB_TOKEN`** — set a workflow-level `permissions: {}` (deny-all) default and grant per-job (`contents: read`, `contents: write` etc. only where that job needs it).
- **Pin _all_ third-party actions to a full commit SHA** — tags are mutable (the tj-actions/`changed-files` tag was moved to leak secrets from 23k+ repos). The old "a major is fine for official actions" carve-out is retired — even first-party actions get a SHA. **Renovate/Dependabot** bumps the SHAs (and deps) with changelogs.
- **Harden dependency installs** — `pnpm install --frozen-lockfile` always. **pnpm blocks dependency lifecycle scripts by default** since 10 (postinstall/preinstall is the top npm-malware vector) — keep that default and allowlist only the packages that genuinely need a build step via **`allowBuilds`** in `pnpm-workspace.yaml`, a map of package name → `true`/`false`/`"warn"`. It replaced `onlyBuiltDependencies`, which was **removed in pnpm 11** along with `neverBuiltDependencies`, `ignoredBuiltDependencies`, and `ignoreDepScripts` (`pnpm-v10-to-v11` codemods the migration). In 11 `strictDepBuilds` defaults to `true`, so an unreviewed build is a hard error rather than a warning — fix the allowlist, never reach for `dangerouslyAllowAllBuilds`. Config lives in `pnpm-workspace.yaml` **only**: pnpm 11 no longer reads the `pnpm` field in `package.json`, so even a single-package repo needs that file. Don't reach for `.npmrc` `ignore-scripts=true` — it also disables your own workspace scripts. Prefer deps published with **provenance** (npm green-check / Trusted Publishing).
- **`concurrency`** with `cancel-in-progress` per ref (don't burn minutes on superseded pushes); a **`timeout-minutes`** on every job.
- **Scan:** enable secret scanning (GitHub + a `gitleaks` CI/pre-push pass), **SAST** (CodeQL), and **dependency review** (`actions/dependency-review-action`) / `pnpm audit` (SCA) on PRs.
- **Required status checks + review** on protected branches (the Quality gates below).

### Build provenance & SBOM (when publishing)

For repos that **publish a package or a signed artifact** (not app-only repos): generate an **SBOM** at build time (Syft/Trivy/CycloneDX — resolves the full dep graph, so a future CVE is a lookup, not an audit), emit **SLSA provenance** (`actions/attest-build-provenance`), and **sign keylessly with Sigstore/cosign** using the workflow's **OpenID Connect (OIDC) identity** (no long-lived signing keys). On npm, publish with **provenance** (`--provenance` + `id-token: write`). Caveat: provenance attests _which build produced the artifact_, not that the run was authorized — keep it paired with SHA-pinning and protected branches. App-only repos can skip signing but still benefit from an SBOM for CVE triage.

## Testing & performance gates in CI

- **E2E** — Playwright headless on PRs; run it **against the per-PR preview deploy** (deploy → capture the preview URL from the deploy step → pass it in as the base URL), so reviewers and the suite exercise the real build, not a shared staging box. Upload the HTML report + traces as artifacts on failure. Unit/component tests still run in the `test` job on the source.
- **Bundle-size budgets (cheapest gate, fails first)** — enforce byte budgets on `.next/static` at build with **`size-limit`** (or `@next/bundle-analyzer` to inspect drift). Byte budgets are deterministic and catch dependency bloat that a green Lighthouse run hides.
- **Lighthouse CI (closest to UX)** — `@lhci/cli` against the **preview URL** on your money/traffic pages; assert perf + a11y `minScore` and metric budgets (**LCP / FCP / CLS**) — set thresholds just above today's real numbers to catch _regressions_, not to chase 100s. INP needs real interaction — track it with **field RUM** (`web-vitals`), not in CI.
- **Gate where it helps most** — byte budgets at build; E2E + Lighthouse against the preview before merge. Make these **required status checks** (below). CI budgets gate the build you're shipping; they don't replace production RUM.

## Pre-commit hooks

- **husky** manages hooks (`prepare: "husky"`). **pre-commit** runs **lint-staged** (Biome on staged JS/TS, Prettier on staged md) + affected type-check/build; **commit-msg** runs **commitlint** (Conventional Commits → `stage-commit`). Keep hooks **fast** — staged/affected only, never a full-repo build.

## Quality gates & branch protection

Merge only when: affected **lint + type-check + build** pass, **format check** passes, **E2E + budget gates** pass (above), and the **PR title** is a Conventional Commit. **Protected branches** (`main`/`dev`/`staging`/`prod`) are never pushed directly — PR + green CI required (matches `stage-commit`'s "never push to default").

- **CODEOWNERS** — a `.github/CODEOWNERS` routes review to the right owner per path (and, with "require review from Code Owners", makes it mandatory). Useful even solo to auto-tag and to protect sensitive paths (CI config, rules, infra).
- **Deployment environments** — define GitHub **environments** (`staging`/`production`) with **required reviewers** and/or a **wait timer** on prod, and scope deploy secrets/OIDC to the environment. This is where a human approves a prod release; pairs with the OIDC deploy below.
- **Merge queue** (team scale) — re-tests each PR against the latest base before auto-merging, so main stays green. Overkill solo; turn it on once concurrent PRs start colliding.

## Security headers

Set on **every app** via `next.config.ts` `headers()` (baseline):

```txt
X-Content-Type-Options: nosniff
X-Frame-Options: DENY                         # or a CSP frame-ancestors directive
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()   # lock unused features
```

Add **`X-Robots-Tag: noindex, nofollow`** for internal/admin apps. A **Content-Security-Policy is required for public apps** — the policy itself → `frontend-security`. (Header mechanics via `nextjs-best-practices`.)

## Env management

- **Validate env at boot** with Zod in a leaf `config/env.ts` (imports only zod) — fail fast; never read `process.env` in app code.
- **`process.env` carve-out allowlist** — the only files that read `process.env` directly: the env module (`config/env.ts`), `next.config.ts`, `app/global-error.tsx` (must render even when the env module's Zod parse throws), test setup, and standalone scripts. All app code imports the parsed `env` object.
- **`.env` is for secrets. Everything else is a constant, even when it varies by tier.** Base URLs, cookie domains, CORS origins, allowlists, analytics ids, project ids, public keys — all of them live in committed code, in a config module keyed off `APP_ENV`. Committing them is the point: every tier's values are reviewable in one diff instead of retyped into three dashboards, and a new deployment needs no new variables. The gate is one question — **would leaking this hurt?** Yes → `.env` and a secret manager. No → config, however much it differs per tier.
- **Tier is `APP_ENV`, never `NODE_ENV`** — the framework owns `NODE_ENV`, and a staging build _is_ a production build, so the two answer different questions. `NEXT_PUBLIC_*` is rare once constants live in config: a public value that isn't a secret has no reason to be an env var at all.
- **`.env.example` names every secret the app cannot boot without, with no values**, plus `APP_ENV`; `.env.local` is gitignored. **Secrets via Cloud Secret Manager** (→ `firebase-architecture`), never committed or `NEXT_PUBLIC_`-exposed.

## Delivery / deploy

- **One project/target per environment** (dev/staging/prod); deploys happen only after **green CI on the protected branch**.
- **CI validates; it does not deploy.** In a monorepo where every app tracks the same branch, **disable auto-rollout per backend** (push-to-deploy rebuilds every backend on any change) and deploy specific commits manually or via explicit release workflows.
- **Local pre-deploy checklist** (before any manual deploy):
  1. `format` → `lint` → `check-types` all pass;
  2. build the **specific app** being deployed;
  3. every referenced secret **exists** in the target project;
  4. that backend **has access** to each of those secrets.
- **Cloud auth via OIDC / Workload Identity Federation** — CI authenticates to the cloud with a short-lived OIDC token, **never** a long-lived service-account key stored as a CI secret (pairs with Application Default Credentials (ADC) → `firebase-architecture`).
- **Preview deployments per PR** (App Hosting preview channels / host previews) for review; tear down on merge/close.
- **Deploy safety** — gate on a post-deploy **health check**, and keep **rollback** one step away (previous release/instance).
- Host is a per-project choice: **App Hosting** (per-env `apphosting.{env}.yaml`, → `firebase-app-hosting-basics`) for Firebase apps; a lighter host (Vercel) for small/personal ones. `output: "standalone"` keeps Next builds container-ready.

## Dependencies & releases

- **Automated updates** via Renovate/Dependabot (grouped, scheduled); auto-merge low-risk patch bumps behind green CI. **`pnpm audit` / SCA** in CI — fix or triage before release.
- **Releases:** tags + automated release notes; **Changesets** only when publishing packages to a registry (not for app-only repos).

## Observability (Industry Best Practice, IBP)

Wire **error tracking** (e.g. Sentry) with source maps, **uptime/health checks**, and **deploy + budget alerts** (bound attack-driven bills → `firebase-architecture`). Ship structured logs; alert on error-rate and failed deploys.

## Do / Don't

- **Do** centralize CI setup in a composite action; run affected in CI and hooks; set minimal `GITHUB_TOKEN` `permissions`, **pin every third-party action to a SHA**, add `concurrency` + `timeout-minutes`; **keep dependency lifecycle scripts blocked** (the pnpm default + an `allowBuilds` allowlist); scan (secrets/SAST/deps) and automate dependency updates; run **E2E + size/Lighthouse budgets against the preview** and make them required checks; use **CODEOWNERS + deployment environments** (prod behind required reviewers); gate merges on lint/type-check/build/format + budgets + a Conventional PR title; set security headers on every app; validate env at boot; authenticate to the cloud via OIDC; keep secrets in Secret Manager; one project per env; deploy only on green CI with a health-check + rollback; emit an **SBOM + signed provenance when publishing** a package.
- **Don't** duplicate setup steps across jobs; run full builds when affected suffices; leave `GITHUB_TOKEN` over-privileged or actions pinned to a mutable tag; run installs with lifecycle scripts enabled; store long-lived cloud/service-account keys as CI secrets; skip secret/dependency scanning or the perf budgets; ship without E2E on the real build; push protected branches directly; commit secrets or `.env` files; skip security headers; read `process.env` directly or hardcode cross-app URLs; set `NODE_ENV` in env/apphosting.

> **Audit:** review this domain on demand with the manually-invoked `environment-audit` / `dependency-audit` command (see `audit-all` for the whole suite).
