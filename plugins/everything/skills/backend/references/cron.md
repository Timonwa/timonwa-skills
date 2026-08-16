# Cron — the house pattern

Scheduled work runs as **route handlers driven by a managed scheduler** (e.g. Cloud Scheduler) hitting the API — task code stays in the service layer instead of being duplicated into platform scheduled functions.

## Single dispatcher

- **One scheduler entry per environment**, at the finest cadence any task needs (e.g. every 5 min), hitting **one dispatcher route** (`POST /cron/tick`).
- **Each task self-gates its own cadence** inside the dispatcher — every tick, hourly (`minute === 0`), daily (`hour === 0 && minute === 0`), weekly (`day === N && hour === 0 && minute === 0`).
- **Adding a task needs no scheduler change** — it's a new gated block in the dispatcher, shipped with the app rollout.
- Tasks live in per-domain `*-cron.service.ts` files; the route is a thin dispatcher.

## Error envelope

Wrap each task in its own try/catch and return `{ results, errors }` — one failing task never poisons the rest of the batch:

```ts
if (minute === 0) {                       // hourly
  try { results.expireInvites = await expirePendingInvites(); }
  catch (err) { errors.expireInvites = err instanceof Error ? err.message : "Unknown"; }
}
```

## Retry backoff

If the scheduler retries, **max backoff must stay below the schedule period** — the default (1 h) lands retries after the next tick has already run. Min backoff must exceed cold-start (~30 s). Zero retries is fine when tasks are idempotent and the next tick is soon.

| Schedule     | Max backoff |
| ------------ | ----------- |
| every 5 min  | 2m          |
| every 15 min | 5m          |
| hourly       | 20m         |
| daily        | 2h          |

## Auth

- **Default-deny OpenID Connect (OIDC):** verify the scheduler's token against the platform's public keys; the `aud` claim must equal the target URL **exactly** (no trailing-slash drift); the `email` claim must equal the per-env scheduler service-account email.
- The expected audience derives from `x-forwarded-host` / `x-forwarded-proto` — if the API sits behind any fronting proxy, verify those headers survive it, or the audience won't match what the scheduler signed.
- **One env-flag local bypass** (e.g. `CRON_LOCAL_BYPASS=true`) so a local `curl` can exercise the route — it must NEVER be set in a deployed environment.

## Two-layer-auth upgrade

When a task starts handling money or destructive actions: split cron onto its **own compute service**, deploy it `--no-allow-unauthenticated`, grant the invoker role to the scheduler service account only — and keep the app-level OIDC check. Two independent layers: misconfigure either and it still fails closed.

## Verification loop

Force-run the scheduler job → read the service logs for the per-task results → seed a row the task should change and confirm it changed.
