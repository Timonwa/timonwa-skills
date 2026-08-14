# Structured data (schema.org / JSON-LD) — reference

Behind the "Structured data" section of `SKILL.md`. Rendered via the `<JsonLd>` component (XSS-escaped) and built by `@id`-anchored helpers.

## Rules

- **JSON-LD only** for new work (Google's recommended format; microdata/RDFa are legacy).
- **Mark up only what's on the page.** Mismatched or invisible-content markup risks a manual action.
- **Connect the graph** with stable `@id`s — Organization/WebSite/WebPage/Breadcrumb reference each other rather than sitting as disconnected islands.
- **Validate**: Rich Results Test (eligibility) + Schema.org Validator (syntax). **Valid ≠ displayed** — Google chooses when to show rich results.
- **Values**: dates ISO 8601, URLs absolute/fully-qualified, enums exact (e.g. `https://schema.org/InStock`).
- **SSR the JSON-LD** (Server Component) so crawlers see it without executing JS.

## What actually earns rich results today

- **Live for most sites**: `Product` (offers/price), `Breadcrumb`, `Article`/`NewsArticle`, `Recipe`, `Review`/`AggregateRating` (genuine UGC only), `Event`, `VideoObject`, `Organization` (knowledge panel signals), `LocalBusiness`.
- **No longer rich results for most sites** (use only for entity understanding, don't promise SERP features): **`FAQPage`** (restricted to authoritative gov/health since Aug 2023) and **`HowTo`** (deprecated 2023).
- **Never self-author `aggregateRating`/`review`** on your own Product/Organization/LocalBusiness — self-serving reviews violate Google's guidelines. Only mark up genuine, user-generated ratings.

## Required vs recommended (durable types)

- **Organization** — req `name`, `url`; rec `logo`, `sameAs`, `contactPoint`.
- **WebSite** — `url`, `name`; optional `SearchAction` (sitelinks search box).
- **Article / BlogPosting** — req `headline`, `image`, `datePublished`, `author`; rec `dateModified`, `publisher`, `description`, `mainEntityOfPage`.
- **Product** — req `name`, `image`, `offers` (`price` + `priceCurrency` + `availability`); rec `sku`, `brand`, and only-if-genuine `aggregateRating`/`review`.
- **SoftwareApplication** — for SaaS/app pages; req `name`, `offers`; rec `applicationCategory` (e.g. `BusinessApplication`), `operatingSystem` (e.g. `Web`), and only-if-genuine `aggregateRating`.
- **BreadcrumbList** — req `itemListElement` (`position`, `name`, `item`).
- **LocalBusiness** — req `name`, `address`; rec `geo`, `openingHoursSpecification`, `telephone`, `priceRange`.
- **Event** — req `name`, `startDate`, `location`; rec `endDate`, `eventAttendanceMode`, `eventStatus`, `offers`, `performer`, `organizer`.

## Examples

Organization + WebSite as a connected graph (sitewide, in the root layout):

```ts
const ORG_ID = `${siteConfig.url}/#org`;

export function organizationSchema() {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": ORG_ID,
    name: siteConfig.name, url: siteConfig.url, logo: `${siteConfig.url}/logo.svg`,
    sameAs: siteConfig.socials,
    contactPoint: { "@type": "ContactPoint", email: "hello@acme.com", contactType: "customer support" } };
}
export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url, name: siteConfig.name, publisher: { "@id": ORG_ID },
    potentialAction: { "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/search?q={q}` },
      "query-input": "required name=q" } };
}
```

Article:

```ts
export function articleSchema(post: Post) {
  return { "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, description: post.excerpt,
    image: new URL(post.cover, siteConfig.url).toString(),
    datePublished: post.publishedAt, dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Person", name: post.author, url: `${siteConfig.url}/about` },
    publisher: { "@id": `${siteConfig.url}/#org` },
    mainEntityOfPage: new URL(post.path, siteConfig.url).toString() };
}
```

Product (offer, no self-serving rating):

```ts
export function productSchema(p: Product) {
  const url = new URL(`/shop/${p.slug}`, siteConfig.url).toString();
  return { "@context": "https://schema.org", "@type": "Product",
    name: p.name, description: p.summary,
    image: p.images.map((s) => new URL(s, siteConfig.url).toString()),
    brand: { "@type": "Brand", name: siteConfig.name }, url,
    offers: { "@type": "Offer", price: p.price, priceCurrency: "USD",
      availability: "https://schema.org/InStock", url } };
}
```

SoftwareApplication (SaaS/app pages — the product page of a web app):

```ts
export function softwareApplicationSchema() {
  return { "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: siteConfig.name, applicationCategory: "BusinessApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };  // no self-authored aggregateRating
}
```

FAQPage — structurally valid, but **no rich result for most sites** (keep only if you want the entity understanding):

```ts
export function faqSchema(items: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a } })) };
}
```

### `@graph` note

Bundling all of a page's nodes in one `<script>` via `{"@context": "https://schema.org", "@graph": [node, node, …]}` is equivalent to passing an array of nodes (what `<JsonLd data={[…]}>` emits) — validators and most docs show the `@graph` form, so don't flag one as wrong when you see the other.

## Common errors

- Missing required properties; content mismatch (markup describes what isn't on the page).
- Relative image/URL values (must be absolute); non-ISO dates; wrong enum strings.
- Disconnected nodes (no `@id` links) — technically valid but weaker for entity understanding.
- Rendering JSON-LD only client-side (crawler may miss it); or via `next/head` + `dangerouslySetInnerHTML` (legacy — use a Server Component `<script>`).
