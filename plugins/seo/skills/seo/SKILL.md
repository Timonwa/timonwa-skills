---
name: seo
description: Use when building SEO into a site — writing page metadata (title/description/OpenGraph/Twitter/canonical/robots), sitemaps, robots rules; structured data / schema.org / JSON-LD / rich results; AEO/GEO (ranking in AI answers — ChatGPT, Perplexity, Google AI Overviews); programmatic SEO (templated pages at scale); site architecture / URL structure / internal linking; or improving indexability / Core Web Vitals. Owns the discipline AND the house SEO implementation (siteConfig, buildMetadata, SEO catalogs, JsonLd + schema builders, env-gated robots/sitemap). Running a full SEO audit is the separate, manually-invoked `seo-audit` command. Next API mechanics → `nextjs-best-practices`; semantic markup → `html-best-practices`; a11y → `accessibility`; naming → `naming`.
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# SEO

You own SEO as a discipline **and** the house implementation of it: ship correct, discoverable SEO into every page — metadata, structured data, robots, sitemap, architecture — following the standard below, plus the Answer Engine Optimization (AEO)/Generative Engine Optimization (GEO) and programmatic principles. Every indexable page carries a title, description, canonical, OpenGraph/Twitter, and correct robots; key pages carry structured data.

> **Auditing an existing site** (the run-occasionally action — crawl/indexation diagnostics, Core Web Vitals (CWV), migration, severity report) is a **separate, manually-invoked `seo-audit` command**, per the house rule that each audit is its own focused skill. It audits _against_ this standard.

> **Boundaries.** `nextjs-best-practices` owns the raw Next APIs (Metadata API, `sitemap.ts`, `robots.ts`, `ImageResponse`, caching) — this skill owns _what to put in them_ and the house helpers. `html-best-practices` owns semantic markup; `accessibility` owns a11y (both help SEO, cross-ref freely). `naming` owns identifier names. Writing the blog article itself (structure, voice) → `technical-article`; this skill owns its metadata.
>
> **Project facts → `AGENTS.md`:** the site name/url/description, social handles, locales, which routes are noindex, and the framework. This skill is the standard; those are per-project.

## The house implementation (the standard)

Prescriptive, framework-agnostic in spirit (Next examples shown; Astro maps the same concepts onto `<head>`). Set it up once per app; every page reuses it.

### 1. `siteConfig` — one source of brand/SEO truth

A single config object (single app) or a shared brand constant + per-app config (monorepo):

```ts
// lib/config/site.ts
export const siteConfig = {
  name: "Acme",
  url: "https://acme.com",            // no trailing slash
  description: "…",
  defaultImage: "/api/og",           // default OG image — relative; metadataBase resolves it (see §4)
  defaultImageAlt: "Acme",
  author: "Acme",
  twitter: "@acme",
  socials: ["https://github.com/acme", "https://linkedin.com/company/acme"], // → schema `sameAs`
} as const;
```

### 2. `buildMetadata()` — the metadata builder

One builder returns a Next `Metadata` from per-page input, applying defaults, a self-referencing canonical, OG/Twitter, and **env-gated** robots. Non-prod is always `noindex` (protects staging). Indexable pages get the rich-result directives.

```ts
// lib/utils/seo/metadata.ts
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";
import { env } from "@/lib/config/env";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;                        // "/pricing" → canonical
  imageUrl?: string;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  locale?: string;                      // set only in i18n apps (see §8)
};

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const { title, description, path = "/", imageUrl, imageAlt, noIndex = false, type = "website" } = input;
  const desc = description ?? siteConfig.description;
  // relative paths throughout — the root layout's required `metadataBase` resolves canonical/OG/image URLs
  const image = { url: imageUrl ?? siteConfig.defaultImage, alt: imageAlt ?? siteConfig.defaultImageAlt };
  const indexable = env.isProd && !noIndex;

  return {
    // `title` is added conditionally so `...buildMetadata()` never spreads `title: undefined` over the root layout's title template
    ...(title !== undefined && { title }),
    description: desc,
    alternates: { canonical: path },
    robots: indexable
      ? { index: true, follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false, googleBot: { index: false, follow: false, noarchive: true } },
    openGraph: {
      type, url: path, siteName: siteConfig.name,
      ...(title !== undefined && { title }), description: desc,
      images: [image],
    },
    twitter: {
      card: "summary_large_image", site: siteConfig.twitter, creator: siteConfig.twitter,
      ...(title !== undefined && { title }), description: desc, images: [image],
    },
  };
}
```

In a **monorepo**, put the builder in a shared package taking a config arg; each app binds its `siteConfig` once. Data shapes are named per `naming` (`BuildMetadataInput`, not `…Props`/`…Type`).

### Root layout — set once

`metadataBase` is **required** — every canonical/OG/image path above is relative and resolves against it — plus the **title template**:

```ts
// app/layout.tsx — spread FIRST, explicit keys after, so the title template can never be wiped by the spread
export const metadata: Metadata = {
  ...buildMetadata(),
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
};
```

### 3. SEO catalogs — copy lives in data, not JSX

Keep page titles/descriptions in typed catalogs keyed by route, split indexable vs private. Pages reference by key, never inline strings.

```ts
// lib/utils/seo/catalog.ts
type SeoEntry = { title: string; description: string; ogTitle?: string; ogSubtitle?: string };

export const PUBLIC_SEO = {
  pricing: { title: "Pricing", description: "…", ogSubtitle: "Plans & pricing" },
  // …
} as const satisfies Record<string, SeoEntry>;

export const NOINDEX_SEO = {
  notFound: { title: "Not found", description: "…" },
  // …
} as const satisfies Record<string, SeoEntry>;
```

```ts
// lib/utils/seo/metadata.ts — thin wrappers over buildMetadata
export function publicMetadata(key: keyof typeof PUBLIC_SEO, path: string): Metadata {
  const seo = PUBLIC_SEO[key];
  return buildMetadata({ title: seo.title, description: seo.description, path,
    imageUrl: getOgImageUrl({ title: seo.ogTitle ?? seo.title, subtitle: seo.ogSubtitle }) });
}
export function noIndexMetadata(key: keyof typeof NOINDEX_SEO, path?: string): Metadata {
  const seo = NOINDEX_SEO[key];
  return buildMetadata({ title: seo.title, description: seo.description, path, noIndex: true });
}
```

```ts
// app/pricing/page.tsx — the literal path stands in for the app's central routes module (e.g. ROUTES.pricing)
export const metadata = publicMetadata("pricing", "/pricing");
```

Dynamic routes use `generateMetadata` (async, `await params`) and pass real data in — cover image, trimmed description, `noIndex` when the record isn't public.

### 4. OG images

`getOgImageUrl()` picks a provided cover, else a generated `/api/og?title=…&subtitle=…` (built with `ImageResponse` → `nextjs-best-practices`). Always 1200×630, with alt text. It returns an **absolute** URL because feeds and JSON-LD require absolute image URLs — in metadata, absolute URLs pass through `metadataBase` untouched, so it stays consistent with the relative-path convention above (`siteConfig.defaultImage` stays relative and lets `metadataBase` resolve it).

```ts
// lib/utils/seo/og-image.ts — absolute on purpose: feeds/JSON-LD can't use relative URLs
export function getOgImageUrl({ title, subtitle, coverImage }: { title?: string; subtitle?: string; coverImage?: string | null }): string {
  if (coverImage) return coverImage;                 // real content image wins
  const q = new URLSearchParams();
  if (title) q.set("title", title);
  if (subtitle) q.set("subtitle", subtitle);
  return `${siteConfig.url}/api/og${q.toString() ? `?${q}` : ""}`;
}
```

### 5. Structured data — `<JsonLd>` + a connected graph

One generic, **XSS-safe** component; schema built by helpers, anchored with stable `@id` so nodes cross-reference into a single graph (the Industry Best Practice, IBP, pattern — don't emit disconnected islands).

```tsx
// components/_shared/JsonLd.tsx  (Server Component)
export function JsonLd({ data }: { data: object | object[] }) {
  // escape < (script breakout), & (HTML entity ambiguity), and U+2028/U+2029 (invalid raw in a JS string context)
  const json = JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
```

```ts
// lib/utils/seo/schema.ts — every builder anchors on a stable @id
const ORG_ID = `${siteConfig.url}/#org`;

// organizationSchema() / websiteSchema() → full implementations (contactPoint, SearchAction, @id wiring)
// live in references/structured-data.md — one copy, don't reimplement here.

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name,
      item: new URL(t.path, siteConfig.url).toString() })) };
}
```

Render sitewide nodes in the root layout, page-specific ones on the page:

```tsx
// app/layout.tsx      → <JsonLd data={[organizationSchema(), websiteSchema()]} />
// app/blog/[slug]     → <JsonLd data={[articleSchema(post), breadcrumbSchema(trail)]} />
```

Which types, required props, and the FAQPage/HowTo caveats → `references/structured-data.md`.

### 6. `robots.ts` — env-gated

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  if (!env.isProd) return { rules: { userAgent: "*", disallow: "/" }, sitemap: `${siteConfig.url}/sitemap.xml` };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`, host: siteConfig.url };
}
```

AI-bot access (GPTBot, PerplexityBot, ClaudeBot, Google-Extended…) is an AEO decision → `references/aeo-geo.md`.

### 7. `sitemap.ts`

Small site: one flat list built from your route constants + dynamic loaders, real `lastModified`. Large site: split into child sitemaps via `generateSitemaps()`. Only indexable, canonical URLs; never noindex/redirected ones.

### 8. i18n / hreflang

Multi-locale apps set `locale` and emit `alternates.languages` for every locale plus `x-default` — a per-locale self-canonical:

```ts
alternates: {
  canonical: `${siteConfig.url}/${locale}${path}`,
  languages: { ...Object.fromEntries(locales.map((l) => [l, `${siteConfig.url}/${l}${path}`])),
               "x-default": `${siteConfig.url}/${defaultLocale}${path}` },
}
```

## Technical fundamentals

Build to these; the `seo-audit` command verifies them.

- **Core Web Vitals** targets: **LCP < 2.5s · INP < 200ms · CLS < 0.1**.
- **Crawlable & indexable**: real `<a href>` navigation, a self-referencing canonical on every page, only indexable/canonical URLs in the sitemap, no stray `noindex` on pages that should rank.
- **One host, one URL shape**: HTTPS, a single www/non-www, one trailing-slash + case policy — enforced with 301s.

The full audit workflow (priority order, crawl/indexation/canonicalization/migration checklists, the JS-rendered-schema caveat, severity report) lives in the separate **`seo-audit`** skill.

## On-page

- **Title** — unique, front-load the primary topic, brand at the end (the template adds it); aim **~50–60 characters** (Google truncates around 600px, so it's pixel-width, not a hard count — keep key words first). **Description** — unique, compelling, a click driver; aim **~150–160 characters** (mobile truncates shorter). Google frequently rewrites both, so treat lengths as guidance — but don't let key info get cut off.
- **One `<h1>`**, logical heading hierarchy, no skipped levels (`html-best-practices`).
- Write for **search intent**, not keyword density — satisfy the query; avoid thin/duplicate pages.
- **Images**: descriptive filenames + meaningful `alt` (also a11y), modern formats, sized to avoid CLS.
- **Internal links**: descriptive anchor text (not "click here"), no orphan pages, link important pages more.

## Structured data → `references/structured-data.md`

JSON-LD only (never microdata for new work); mark up only content that exists on the page; validate (Rich Results Test + Schema.org Validator). **Valid ≠ displayed** — Google decides when to show rich results. **FAQPage/HowTo no longer produce rich results for most sites** (use only for entity understanding). **Never self-author `aggregateRating`/`review`** — genuine UGC only, or risk a manual action.

## Site architecture → `references/site-architecture.md`

Readable, lowercase, hyphenated URLs that mirror the hierarchy; pick one trailing-slash + case policy and enforce it. **Every removed/changed URL needs a 301** (preserve link equity). Keep important pages shallow (crawl depth matters; the "3-click rule" is a heuristic, not law). **Pillar/cluster** model: a hub page links to spokes, spokes link back. Breadcrumbs mirror the URL and ship `BreadcrumbList` schema. Navigation must be crawlable HTML links, not JS-only.

## AEO / GEO (AI answer engines) → `references/aeo-geo.md`

AI search gets you **cited, not just ranked** — a well-structured page can be cited even when it's not #1. Three levers: **Structure** (extractable), **Authority** (citable), **Presence** (be in the third-party sources AI reads). AI extracts _passages_, so lead each section with a direct, self-contained answer; use intent-matched blocks (definition, steps, comparison table, FAQ); cite sources with dates; keep content fresh; allow the AI crawlers you want citations from.

## Programmatic SEO → `references/programmatic-seo.md`

Only when each page **genuinely deserves to exist** and you have defensible data (proprietary > product-derived > user-generated > public). Template + unique per-page value; **never** doorway/thin pages. Respect Google's **scaled-content-abuse**, **site-reputation-abuse**, and **Helpful Content** policies (the modern guardrail). Manage indexation (noindex thin variants, split sitemaps, hub-and-spoke linking). Subfolders, not subdomains.

## Do / Don't

- **Do** give every indexable page a self-referencing canonical, unique title/description, OG image, and correct robots; env-gate staging to noindex; connect structured data with `@id`; write for intent; keep navigation crawlable.
- **Don't** hardcode SEO copy in JSX (use catalogs); ship disconnected schema or markup for absent content; self-author ratings; rely on FAQPage/HowTo for rich results; mass-produce thin pages; block the AI/search crawlers you want citations from; leave changed URLs without 301s.
