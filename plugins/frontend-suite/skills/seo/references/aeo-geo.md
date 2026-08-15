# Answer Engine Optimization (AEO) / Generative Engine Optimization (GEO) — ranking in AI answer engines — reference

Behind the "AEO / GEO" section of `SKILL.md`. Optimizing to be **cited** by AI answer engines (Google AI Overviews, ChatGPT, Perplexity, Gemini, Copilot) — a distinct game from blue-link ranking.

> Treat exact figures in the wild with suspicion — most AEO "stats" are single-vendor studies with false precision, and the engines change monthly. The _frameworks_ below are durable; don't hardcode percentages or per-product internals as load-bearing facts.

## The core shift

- **AI gets you cited, not just ranked.** A well-structured, authoritative page can be cited even when it isn't the #1 organic result; citation selection weights content quality/structure/relevance, not just position.
- Baseline (all engines): the page must be **indexed → crawlable → extractable**. If a bot is blocked, or the answer is buried/gated, you can't be cited.

## Three levers

1. **Structure (extractable).** AI pulls _passages_, not whole pages. Lead each section with a direct, self-contained answer (≈40–60 words), one idea per paragraph, so any passage stands alone. Headings phrased as the questions people ask.
2. **Authority (citable).** Cite named, authoritative sources with links; include specific, dated statistics (prefer first-hand/original data); named authors with credentials; Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T) alignment. Keep content **fresh** (show "last updated"; refresh competitive pages).
3. **Presence (be where AI looks).** AI answers lean heavily on third-party corroboration — Wikipedia, Reddit, YouTube, review sites (G2/Capterra), industry roundups. Being cited _there_ often matters more than your own domain.

## Content blocks by query intent

Match the block to what's asked (tables beat prose for comparisons; numbered lists beat paragraphs for process):

- **"What is X"** → Definition block: one-sentence direct answer first, then elaboration.
- **"How to X"** → Step-by-step numbered list, one action per step.
- **"X vs Y"** → Comparison table (feature rows), then a use-case recommendation.
- **Evaluation** → Pros/cons list.
- **Common questions** → Q&A block (natural question phrasing).
- **"Best X" / lists** → Listicle with a clear criterion per item.

### GEO citation patterns (make a passage quotable)

- **Statistic citation** — "According to [Source] (2025), X is N%." (specific number + named source + date)
- **Expert quote** — a named, credentialed voice.
- **Self-contained answer** — the passage makes sense lifted out of the page.
- **Evidence sandwich** — claim → evidence (stat/quote/source) → implication.

## Keyword stuffing _hurts_ AEO

Unlike classic SEO where it's merely useless, stuffing actively lowers AI extraction quality. Write for humans; if it reads like algorithm-gaming, it won't be cited or convert.

## Content types cited most (relative, not exact)

Comparisons, definitive guides, original research/data, listicles, how-tos. **Underperformers**: gated content (AI can't read it), undated/unattributed pages, thin marketing fluff, unparseable PDF-only content.

## AI-bot access (robots.txt)

You must allow an engine's crawler to be cited by it. Common agents:

```txt
User-agent: GPTBot            # ChatGPT (OpenAI) — search + training
User-agent: OAI-SearchBot     # ChatGPT search
User-agent: ChatGPT-User      # ChatGPT live browsing
User-agent: PerplexityBot     # Perplexity
User-agent: ClaudeBot         # Claude
User-agent: Google-Extended   # Gemini / AI training (separate from Googlebot)
User-agent: Bingbot           # Copilot (via Bing)
Allow: /
```

- Blocking `Google-Extended` does **not** remove you from Google Search (that's `Googlebot`) — it opts you out of Gemini/AI training.
- `CCBot` (Common Crawl) is training-oriented and can be blocked without losing search-citation eligibility.
- The training-vs-citation tradeoff (allow bots for visibility vs block to protect content) is a **business decision → record it in `AGENTS.md`**.

## llms.txt (emerging — unproven, low-cost)

A proposed convention (llmstxt.org): a markdown `/llms.txt` (optionally `/llms-full.txt`) curating your key pages/content as a clean map for LLMs.

- **Reality check:** as of now **no major AI engine has confirmed consuming it** for retrieval or citation, and some (e.g. Google) have publicly dismissed it — adoption is mostly dev-tool/docs sites. Don't confuse it with `robots.txt`: robots access is the real gate on citation eligibility; `llms.txt` is a hint at best.
- **Verdict:** cheap to add for a content/docs site as a hedge, and it can double as a human-readable content index — but **don't rely on it for visibility**. The real levers stay: extractable structure, authority/citations, freshness, and allowing the AI crawlers. Revisit if a major engine announces support.

## Extractability check (pass/fail per priority page)

| Check                                                            | Pass/Fail |
| ---------------------------------------------------------------- | --------- |
| Clear definition in the first paragraph?                         |           |
| Self-contained answer blocks (work without surrounding context)? |           |
| Statistics with sources cited?                                   |           |
| Comparison tables for "[X] vs [Y]" queries?                      |           |
| FAQ section with natural-language questions?                     |           |
| Schema markup present for the page type?                         |           |
| Expert attribution (author name, credentials)?                   |           |
| Recently updated (within 6 months)?                              |           |
| Heading structure matches query patterns?                        |           |
| AI bots allowed in robots.txt?                                   |           |

## Monitoring (tool-agnostic)

Pick your top 10–20 queries, run them through the engines monthly, log who gets cited and whether you appear. Vendor "AI visibility" tools exist but churn fast — the manual method is durable.

Query archetypes to test:

- "What is [your product category]"
- "Best [category] for [use case]"
- "[Your brand] vs [competitor]"
- "How to [problem your product solves]"
- "[Category] pricing"

## Boundary

A general "traffic dropped / why am I not ranking" request is **traditional SEO** → the `seo-code-audit` skill, not AEO patterns.
