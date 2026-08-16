---
name: content-performance
description: >-
  Manually invoked. Reads exported analytics from any platform — search consoles, rank trackers, product analytics, CMS reports, a spreadsheet someone assembled by hand — and turns it into a prioritised list of content fixes: titles to rewrite where impressions are high but clicks aren't, pages decaying in rank, queries you rank for with no page, orphaned or thin pages, and internal links worth adding. Works from whatever columns the export actually has rather than a fixed tool's schema. Reports only; never edits a page. Give it the export and the site. The SEO standard itself → `seo`; auditing the implementation in code → `seo-code-audit`.
argument-hint: "[path to export(s)] [site URL]"
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Content performance

Turn exported analytics into a ranked list of what to fix. **This reads data and reports; it never edits a page or invents a number.**

## Arguments

- **`$1` — the export(s)**: a file, several files, or a directory. CSV, TSV, JSON, or a pasted table — from any platform. With nothing, ask for the data.
- **`$2` — the site**: the base URL, so page paths in the export resolve to real pages.

## Read the export before analysing it

Any platform's export is fine, because the analysis keys off **columns, not tools**. Read the header row first, map it to the signals below, and work with what's there.

| Signal you need    | Columns that carry it, whatever they're called                     |
| ------------------ | ------------------------------------------------------------------ |
| **Reach**          | impressions · views · pageviews · sessions · displays              |
| **Engagement**     | clicks · visits · entrances · CTR (or derive it from clicks/reach) |
| **Position**       | position · rank · avg. rank · SERP position                        |
| **Query**          | query · keyword · search term                                      |
| **Page**           | page · URL · address · landing page · path · slug                  |
| **Time**           | date · period · month · week — needed for any trend claim          |
| **Onward journey** | bounce rate · exits · time on page · next page · scroll depth      |

- **Say what the data can't answer.** No click column means no CTR findings; no position column means no decay or striking-distance findings; one date range means no trend findings. Name the sections you're skipping and why, rather than filling them with guesses.
- **Ask when a column is ambiguous** — "views" can mean sessions or pageviews, and the difference changes the conclusion. One question beats a wrong ranking.
- **Never infer a metric you weren't given.** No estimated volumes, no modelled traffic, no "roughly". If it isn't in the export, it isn't in the report. Deriving CTR from clicks ÷ impressions is arithmetic and fine; estimating search volume is invention and isn't.
- **Two windows beat one.** For anything about decay or growth, ask for a second export from an earlier period — a single snapshot cannot show a trend.
- **Attribute every claim** to the export and date range it came from, since a 7-day window and a 12-month window support very different recommendations.

## What to look for

Work through whichever the data supports:

| Finding                     | The signal                                                    | The fix                                                           |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Title/snippet mismatch**  | High impressions, low CTR, decent position                    | Rewrite the title and meta description to match the query intent  |
| **Ranking decay**           | Position worse than the earlier window, impressions flat/down | Refresh the page — update facts, add what's now missing           |
| **Striking distance**       | Ranking 5–20 for a query with real impressions                | Strengthen that page on that query; don't write a second one      |
| **Query with no page**      | Impressions on a query the site answers only in passing       | A new page — check it isn't already covered before recommending   |
| **Cannibalisation**         | Two pages trading positions on one query                      | Merge, or differentiate intent and link one to the other          |
| **Orphaned page**           | Indexed, has impressions, no internal links in                | Link it from the pages that should have linked it all along       |
| **Thin or zero-click page** | Indexed, near-zero impressions over a long window             | Improve it, merge it, or remove it — decide, don't leave it       |
| **High-exit page**          | Product analytics show entries but no onward journey          | Fix the next step; the page answered and then stranded the reader |

## Reporting

- **Ranked by expected impact**, not by severity label — a title rewrite on a page with 50k impressions outranks a perfect fix on a page with 40.
- **Each finding carries the numbers it came from**, the page, and the specific change. "Rewrite the title" is not a finding; "position 6, 12k impressions, 0.4% CTR — the title says _Configuration_ where the query is _how to set environment variables_" is.
- **Group by action**, so a batch of title rewrites can be done in one sitting.
- **Name what you'd do first** if only three things get done.
- **Separate observations from recommendations.** A number in the export is a fact; what to do about it is a judgement, and the report should be readable by someone who wants to disagree with the second part.

Write the report to `_reports/content-performance-[YYYY-MM-DD].md` (ask before overwriting), and summarise the top findings in the chat.

## Never

- Invent, estimate, or round a metric that wasn't in the export.
- Recommend a new page without checking whether an existing one already covers the query.
- Recommend republishing with a fresh date as a ranking tactic.
- Edit page content — that's the writing skills' job, once you've decided what to change.
- Treat a single short window as a trend.

## Boundaries

- **The SEO standard** — metadata, structured data, sitemaps, AEO/GEO, the house implementation → `seo`.
- **Auditing the implementation in code** (metadata wiring, robots, JSON-LD validity, crawlability) → `seo-code-audit`.
- **Rewriting the page once you know what's wrong** → `docs-standards` for structure, `prose-editing` for the line level.
