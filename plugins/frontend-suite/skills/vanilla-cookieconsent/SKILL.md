---
name: vanilla-cookieconsent
description: >-
  Use when adding, configuring, or reviewing GDPR-shaped cookie consent with the `vanilla-cookieconsent` v3 library — the consent banner, per-category script gating, revision-keyed re-prompts, Google Consent Mode wiring, and the preferences modal. Triggers on "cookie consent", "cookie banner", "GDPR", "consent mode", "cookie policy", "preferences modal", "reject all", "consent categories", "vanilla-cookieconsent", "consent gating". Covers the library-agnostic standard (equal-weight accept/reject, categories off by default, nothing non-essential before consent, revision bumps, client-side-only storage, a permanent withdrawal link) and the v3 mechanics (`run()`, `categories`, `guiOptions`, `language`, autoclear, `onConsent`/`onChange`, `data-cc` triggers, `type="text/plain"` script gating). Overlay a11y → `accessibility`; CSP and third-party-script risk → `frontend-security`; the client boundary and script loading → `nextjs-best-practices`; banner copy voice → `branding`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# vanilla-cookieconsent (GDPR cookie consent · v3)

Cookie consent is a legal state machine the **user** owns, not a UI widget you own. This skill keeps two layers deliberately separable — the behavioral standard (which survives a library swap) and the `vanilla-cookieconsent` v3 mechanics that implement it. It is engineering guidance for the widely-documented GDPR/ePrivacy requirements, **not legal advice** — the final call on categories, retention, and jurisdictions belongs to the project's counsel.

## The standard — library-agnostic, non-negotiable

- **Three first-layer actions, equal weight** — Accept all, Reject non-essential, and a per-category Customise/Manage entry point. Rejecting must cost the same effort as accepting: same layer, same visual weight, same number of clicks. A prominent "Accept" with a buried reject link or a reject hidden behind "Settings" is a compliance failure, not a design choice.
- **Everything non-essential is off by default.** No pre-ticked boxes — GDPR consent must be freely given and unambiguous, and a pre-ticked box is neither. Only strictly-necessary is on, `readOnly`, and disclosed honestly (shown with an "Always on" badge, never pretended to be optional).
- **Nothing non-essential fires before consent.** First paint must produce zero analytics/marketing network requests. Verify in the network tab with a cleared profile — an unticked toggle whose script already ran is the most common real-world failure.
- **A permanent withdrawal path on every page** — a footer link/button that reopens the preferences modal. Withdrawal must be as easy as giving consent; a banner that appears once and can never be re-opened fails this outright.
- **Revision-keyed persistence.** The stored choice is keyed to an integer revision; bump it whenever the category set or the cookie policy meaningfully changes, which invalidates stored consent and re-prompts existing users. Without the bump, a policy change silently rides on stale consent the user never gave.
- **Consent is browser-scoped, anonymous, and client-side only.** No account required, and no server-side consent registry — the consent cookie itself (a `consentId`, first/last consent timestamps, accepted categories, and the revision) is the demonstrable record; a server-side registry means collecting per-visitor data to justify collecting data. If counsel mandates a server log anyway, store only the minimal record (consentId, choices, revision, timestamp — never IP) and note that decision in the project's `AGENTS.md`.
- **Consent is not a feature flag.** A flag is the operator's choice — resolvable server-side, defaultable, flippable centrally. Consent is the user's legal choice — never defaulted on, never resolved for them, never overridden by ops. Don't route it through the flag system → `feature-flags`.
- **Banner, not wall.** The page stays readable and navigable behind the banner; full-page consent walls are legally contested and hostile. Keep `disablePageInteraction` at its default `false`.
- **Bucket B lives in `AGENTS.md`, not here** — the project's real cookie domain, analytics vendors and ids, category descriptions/copy, and current revision number are project facts, recorded per project.

## vanilla-cookieconsent v3 — setup and config

- **v3 is not v2** — the entry point is `CookieConsent.run(config)` (returns a `Promise`) via `import * as CookieConsent from "vanilla-cookieconsent"`, plus `import "vanilla-cookieconsent/dist/cookieconsent.css"`. v2's `initCookieConsent()` and its config shape are gone; don't copy v2 snippets.
- **Browser-only** — initialize once from a client component effect (or a dynamic import); it touches `document` and cookies. Server/Client boundary mechanics → `nextjs-best-practices`.
- **Defaults you rely on (know the numbers)** — `mode: "opt-in"` (keep it; `"opt-out"` is not GDPR-shaped), `autoShow: true`, `manageScriptTags: true`, `autoClearCookies: true`, `hideFromBots: true`, cookie `name: "cc_cookie"`, `expiresAfterDays: 182` (~6 months, the common re-consent window), `sameSite: "Lax"`, `secure: true`.
- **`guiOptions` — `equalWeightButtons: true` on BOTH modals.** This is the "reject as easy as accept" rule expressed in config; setting it `false` to visually demote Reject is the dark pattern this skill exists to prevent. Layouts are `box`/`cloud`/`bar` (consent) and `box`/`bar` (preferences); positions combine `top|middle|bottom` with `left|center|right`.
- **`categories`** — `necessary: { readOnly: true }`; every other category is a plain object (off by default under opt-in — never set `enabled: true` on a non-essential category). Give each vendor-cookie-setting category an `autoClear` list (exact names or regex, e.g. `{ name: /^_ga/ }`) so withdrawal actually deletes the cookies; use `services` when users should be able to toggle individual vendors inside a category.
- **`language`** — `default` plus `autoDetect: "browser"` (or `"document"`); `translations` are inline objects, file paths, or async loaders. The `consentModal` translation must include **both** `acceptAllBtn` and `acceptNecessaryBtn` (omitting `acceptNecessaryBtn` removes the first-layer reject button — a compliance failure), plus `showPreferencesBtn` and a `footer` linking the privacy and cookie policies. `preferencesModal.sections` bind copy to toggles via `linkedCategory`.
- **`revision`** — integer, default `0` (disabled). Set it to `1` at launch and bump on every policy/category change; stored consent with a stale revision is treated as absent and the banner reshows.

## Script gating — how scripts are actually withheld

- **`<script type="text/plain" data-category="analytics">` is the mechanism.** `type="text/plain"` makes the browser parse the tag as inert text; on grant the library rewrites the type and executes it (`manageScriptTags` is on by default). Conditionally _hiding UI_ gates nothing — a normal `<script>` already executed by the time your state updated.
- **Tag attributes** — `data-src` instead of `src` for external scripts, `data-service` to bind the tag to a per-service toggle, `data-type="module"` for module scripts, and `data-category="!analytics"` to run cleanup when a category is _rejected_. A gated tag enables/disables **at most once** — for anything dynamic, use callbacks instead.
- **SDK boot via callbacks** — `onConsent` fires on every page load where valid consent exists (boot the granted SDKs there); `onChange` fires on mid-session changes (boot newly-granted SDKs, call the vendor's opt-out for withdrawn ones — deleting cookies does not stop an already-booted in-memory SDK).
- **Prefer a consent-signal API over script-withholding where the vendor has one.** For Google tags, use Consent Mode: an unconditional inline `gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" })` **before** the tag loads (it stores nothing itself), then `gtag("consent", "update", …)` from `onConsent`/`onChange`. Map analytics → `analytics_storage`; marketing → `ad_storage` + `ad_user_data` + `ad_personalization`. Same pattern through GTM's consent defaults.
- **CSP interacts with the gate** — the library activating inline gated tags and `loadScript()`-injected scripts must still satisfy your CSP: inline gated tags in the initial HTML need the page nonce, and injected `src`s need allowed origins. Nonce plumbing and third-party-script risk → `frontend-security`.

## Reading consent state in the app

- **After `run()`** the module (and `window.CookieConsent`) exposes `acceptedCategory(name)`, `acceptedService(name, category)`, `getUserPreferences()`, `validConsent()`, and `getCookie()`.
- **Subscribe on `window`, not `document`.** The custom events — `cc:onConsent` (`detail.cookie`), `cc:onChange` (`detail.cookie`, `detail.changedCategories`, `detail.changedServices`), `cc:onFirstConsent`, `cc:onModalShow/Ready/Hide` — are dispatched on `window`; a `document.addEventListener("cc:onConsent", …)` listener **never fires** (custom events don't propagate from `window` down to `document`). This is a silent bug: the UI still works, but your state never updates.
- **One hook, not scattered reads** — expose a `useCookieConsent()` hook that reads `acceptedCategory()` once on mount and re-reads on the `window` events, returning per-category booleans with `null` before the library initializes (so callers can distinguish "undecided" from an explicit rejection). Components branch on the hook; nothing else touches the cookie.

## Withdrawal and the preferences modal

- **Footer trigger on every page** — `<button type="button" data-cc="show-preferencesModal">Cookie preferences</button>` (no JS needed), or `CookieConsent.showPreferences()` programmatically. Other `data-cc` values are `show-consentModal`, `accept-all`, `accept-necessary`, `accept-custom`.
- **Withdrawal must have teeth** — `autoClearCookies` plus per-category `autoClear` delete the vendor cookies, and your `onChange` handler calls the SDK opt-out for withdrawn categories. Add `reloadPage: true` to a category's `autoClear` only when a vendor can't be stopped without a reload.
- **`reset(true)`** erases the consent cookie and reshows the banner — useful for a "reset my choices" affordance and for testing the first-visit path.

## Accessibility — requirements, not polish

- The banner is an overlay dialog present on first paint — it must be keyboard-reachable and screen-reader-announced from the first Tab press, with a visible focus indicator on every control. This is WCAG conformance, not polish.
- v3 renders an accessible dialog (roles, labels, focus handling) — your job is to not break it: keep the library's markup, don't rebuild the banner as a bare `div`, and after theming with the `--cc-*` CSS variables re-verify contrast (text ≥ 4.5:1, UI controls ≥ 3:1) in both light and dark themes.
- Manually verify with keyboard only: Tab reaches Accept, Reject, and Manage preferences; the preferences modal traps focus while open, Esc closes it, and focus returns to the trigger. Full audit method → `accessibility`.

## Example

```ts
// lib/consent/consent-config.ts — the one consent config module. Real domain, vendors, and copy are Bucket B (AGENTS.md).
import type { CookieConsentConfig, CookieValue } from "vanilla-cookieconsent";

export type GrantedCategoriesProps = { analytics: boolean; marketing: boolean };

// Apps inject their SDK boot/opt-out logic so this module stays free of vendor imports.
export function buildConsentConfig(onGranted: (granted: GrantedCategoriesProps) => void): CookieConsentConfig {
  const fire = (cookie: CookieValue) =>
    onGranted({
      analytics: cookie.categories.includes("analytics"),
      marketing: cookie.categories.includes("marketing"),
    });

  return {
    revision: 1, // bump on any category/policy change — invalidates stored consent and re-prompts everyone
    cookie: { domain: ".example.com", expiresAfterDays: 182 }, // apex domain only if consent must span subdomains
    guiOptions: {
      consentModal: { layout: "box", position: "bottom right", equalWeightButtons: true },
      preferencesModal: { layout: "box", position: "right", equalWeightButtons: true },
    },
    categories: {
      necessary: { readOnly: true },
      analytics: { autoClear: { cookies: [{ name: /^_ga/ }, { name: "_gid" }] } },
      marketing: {},
    },
    language: {
      default: "en",
      autoDetect: "browser",
      translations: {
        en: {
          consentModal: {
            title: "We use cookies",
            description: "…",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject non-essential", // first layer, equal weight — never a buried link
            showPreferencesBtn: "Manage preferences",
            footer: '<a href="/privacy">Privacy Policy</a>\n<a href="/cookies">Cookie Policy</a>',
          },
          preferencesModal: {
            title: "Cookie preferences",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject non-essential",
            savePreferencesBtn: "Save preferences",
            closeIconLabel: "Close",
            sections: [
              { title: 'Strictly necessary <span class="pm__badge">Always on</span>', description: "…", linkedCategory: "necessary" },
              { title: "Analytics", description: "…", linkedCategory: "analytics" },
              // …
            ],
          },
        },
      },
    },
    onConsent: ({ cookie }) => fire(cookie), // every load with valid consent — boot granted SDKs
    onChange: ({ cookie }) => fire(cookie), // mid-session grant/withdrawal — boot or opt out
  };
}
```

```tsx
// app/providers.tsx (client component) — run once; the library is browser-only.
useEffect(() => {
  void import("vanilla-cookieconsent").then((CookieConsent) =>
    CookieConsent.run(
      buildConsentConfig(({ analytics }) => {
        gtag("consent", "update", { analytics_storage: analytics ? "granted" : "denied" });
        // …boot or opt out the non-Google SDKs here
      }),
    ),
  );
}, []);
```

```html
<!-- Gated tag — inert until the "analytics" category is granted -->
<script type="text/plain" data-category="analytics" data-src="https://analytics.example.com/script.js"></script>

<!-- Footer, every page — the permanent withdrawal path -->
<button type="button" data-cc="show-preferencesModal">Cookie preferences</button>
```

## Boundaries

- **This skill owns** the consent standard and the `vanilla-cookieconsent` v3 mechanics — the banner's actions, categories, revision, script gating, consent-signal wiring, and withdrawal path. Siblings link here instead of restating them.
- **Overlay a11y verification** (focus trap testing, contrast measurement, screen-reader checks) → `accessibility` (audit via `accessibility-audit`); this file states only the banner-specific requirements.
- **CSP, SRI, and third-party-script risk** → `frontend-security`; this skill covers only how the consent gate intersects the CSP (nonces on gated tags, allowed origins for injected scripts).
- **Server/Client boundary, script loading, and layout placement in Next.js** → `nextjs-best-practices`.
- **Runtime flags** → `feature-flags` — consent is the user's legal choice, never an operator flag; neither system may impersonate the other.
- **Banner copy voice and tone** → `branding`; the actual category descriptions are Bucket B in each project's `AGENTS.md`.
- **Building the footer link / consent-gated components as shared, prop-driven pieces** → `reusables`; file placement → `code-structure`.
- **Crawler concerns** → `seo` — keep `hideFromBots: true` so the modal never leaks into snapshots or indexed content.
