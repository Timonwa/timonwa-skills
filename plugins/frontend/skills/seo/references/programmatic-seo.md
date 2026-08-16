# Programmatic SEO — reference

Behind the "Programmatic SEO" section of `SKILL.md`. Generating many templated pages from a data set. Legitimate when each page genuinely deserves to exist; spam when it doesn't.

## The modern guardrail (read first)

Google's 2024 policies are the line pSEO must not cross:

- **Scaled content abuse** — mass-producing pages (templated, AI-generated, or scraped) primarily to manipulate rankings, with little added value. Covers auto-translated and lightly-varied pages.
- **Site reputation abuse** ("parasite SEO") — third-party pages published on a strong domain to exploit its ranking.
- **Helpful Content system** — sitewide signal; a mass of unhelpful pages can drag down the whole site.

If a batch of pages wouldn't satisfy a real user on its own, it's a liability, not an asset.

## Opportunity gate (before building)

1. **Real demand** — aggregate search volume across the pattern; head vs long-tail distribution; trend direction. No demand → no pages.
2. **Can you compete** — who ranks now, do you have something better?
3. **Defensible data** — quality of the underlying data determines durability: **Proprietary > Product-derived > User-generated > Licensed > Public (weakest).**

## Per-page value (the anti-thin rule)

Every generated page must provide value **specific to that page** — not swapped variables in an identical shell. Use conditional content driven by the data, real numbers/insights, and enough substance to satisfy the intent. _"100 great pages beat 10,000 thin ones."_

## Playbooks (risk-tagged)

| Playbook                              | URL pattern               | Risk     | Value bar / risk note                                                        |
| ------------------------------------- | ------------------------- | -------- | ---------------------------------------------------------------------------- |
| Templates/tools                       | `/tools/[task]`           | low      | Genuine utility per page                                                     |
| Integrations                          | `/integrations/[product]` | low      | Real integration detail                                                      |
| Glossary                              | `/glossary/[term]`        | low      | Real definitions                                                             |
| Examples ("[type] examples")          | `/examples/[type]`        | low      | Real, curated examples with screenshots/embeds                               |
| Curation ("best [category]")          | `/best/[category]`        | low–med  | Genuine criteria + real testing, dated updates — not affiliate-bait rankings |
| Directory ("[category] tools")        | `/tools/[category]`       | low–med  | Real per-listing detail + filtering, kept current — not a name list          |
| Comparisons                           | `/compare/[x]-vs-[y]`     | low–med  | Honest, balanced, real data                                                  |
| Conversions                           | `/convert/[from]-to-[to]` | low–med  | Working converter/real data                                                  |
| Personas ("[product] for [audience]") | `/for/[audience]`         | med      | Genuinely persona-specific content — not an audience-name swap               |
| Locations                             | `/[service]/[city]`       | **high** | Doorway risk — needs real local data                                         |
| Profiles                              | `/[entity]`               | **high** | Scraped/thin risk — needs original value                                     |
| Translations                          | `/[locale]/…`             | **high** | Native localization + `hreflang`, never machine-bulk                         |

Low-risk playbooks carry inherent per-page value; **Locations/Profiles/Translations are doorway-/scaled-abuse-adjacent** — only pursue with genuinely unique data and human review.

### Choosing your playbook (match to your assets)

| If you have…              | Consider            |
| ------------------------- | ------------------- |
| Proprietary data          | Directory, Profiles |
| Product with integrations | Integrations        |
| Design/creative product   | Templates, Examples |
| Multi-segment audience    | Personas            |
| Local presence            | Locations           |
| Tool or utility product   | Conversions         |
| Content/expertise         | Glossary, Curation  |
| International potential   | Translations        |
| Competitor landscape      | Comparisons         |

Playbooks can layer (e.g. Curation + Locations — "Best coworking spaces in San Diego") — but layering multiplies page count, so the per-page-value bar applies to every combination.

### Value requirements (examples)

- **Comparisons** — actual feature-by-feature data, honest balance, a use-case recommendation, updated when products change.
- **Locations** — real local data (providers, pricing, regulations, specifics), not a city-name swap.
- **Integrations** — real setup steps, screenshots, use cases per product.

## Implementation

1. **Keyword pattern research** — identify the variable(s); validate demand per variant.
2. **Data model** — source, first-party vs public, update cadence; the data is the product.
3. **Template** — structure + the mechanism that guarantees per-page uniqueness (conditional sections, computed values).
4. **Internal linking** — hub-and-spoke: a hub/category page links to spokes; spokes link back and to siblings; no orphans; breadcrumbs.
5. **Indexation** — prioritize high-volume variants; `noindex` genuinely thin ones (triage, not a license to generate thin pages); split sitemaps by type; watch crawl budget.
6. **URLs** — subfolders, not subdomains (subfolders consolidate authority).

## QA

- **Pre-launch**: unique title/description per page, correct heading structure, schema where relevant, page speed, crawlable, no conflicting `noindex`.
- **Post-launch**: indexation rate, rankings, traffic, engagement, conversion; watch for thin-content/Helpful-Content warnings, ranking drops, manual actions, crawl errors.

## Common mistakes

Thin content (variable-swap only), keyword cannibalization across variants, over-generation (pages with no demand), poor data quality, and building "for Google, not users."
