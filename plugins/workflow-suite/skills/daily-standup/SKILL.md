---
name: daily-standup
description: >-
  Prepare the user's daily standup update from their GitHub activity across the orgs they work in. Use when the user asks to write, prepare, or clean up their daily standup, daily update, or "what did I do yesterday" post. Resolves the previous weekday, fetches authored AND reviewed/commented activity via `involves:`, reconciles it with the user's answers to four questions, then formats a copy-paste-ready update for the configured destination (Discord, Slack, or wherever the team posts). Never posts anywhere and never claims work the user hasn't confirmed.
argument-hint: "[date] [orgs]"
allowed-tools: Bash(gh api:*), Bash(date:*), Read, Grep
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Daily standup

Build the user's daily standup — previous-day recap plus today's plan — from real GitHub activity and their own answers, formatted ready to paste into the team channel.

## Arguments

- `date` — the day to report on (overrides the previous-weekday logic), e.g. `2026-08-07`.
- `orgs` — GitHub org(s) to search (comma or space separated). Optional; falls back to configuration (below).

## Configuration — resolve before Step 1

Resolve these in order; never hardcode any of them:

1. **Arguments** — a date or orgs passed to the skill win.
2. **The project's `AGENTS.md`** — a **DevRel** section listing the GitHub handle, the orgs to monitor, and the standup destination (Discord, Slack, …).
3. **Ask once** — for anything still missing, ask the user, then proceed. Suggest adding a DevRel section to `AGENTS.md` so future runs don't ask.

Call the resolved values `HANDLE`, `ORGS`, and the destination `DEST` below.

## Guardrails — read first

- **Never post the standup anywhere.** Output it in chat for the user to paste; "prepare my standup" is not permission to send messages.
- **The user's confirmation is ground truth.** GitHub activity and last standup's plan are inputs to reconcile, never facts to assert — only include what the user confirms (Step 3).
- **Renamed orgs fail in search** (404/422) — always search with an org's current name. Old org names inside URLs the user pastes usually redirect; leave user-provided URLs as-is.

## Two ways this runs

- **Fresh daily (default):** work through Steps 1–4 — resolve dates, pull GitHub activity, ask the user, then format.
- **Improving an existing daily:** if the user pastes a past standup to clean up, skip Steps 1–3 and apply only the Step 4 formatting rules to what they gave you. Don't re-fetch GitHub or invent activity — reword, group, and expand only what's there.

## Step 1 — Work out the dates

Today is the date in the system context (or `date +%Y-%m-%d` via Bash if unsure). The "previous day" is the most recent weekday before today:

- Today is Monday → previous day = last Friday.
- Today is Tuesday–Friday → previous day = yesterday.
- Never use Saturday or Sunday as the previous day.

A `date` argument or an explicit range in the user's message overrides this. Format dates for display as "Month DD" (e.g. "June 08").

## Step 2 — Fetch the previous day's activity

For each org in `ORGS`, run both queries; run all of them in parallel, substituting real dates for `PREVIOUS_DATE`/`TODAY_DATE`:

```bash
gh api "search/issues?q=involves:HANDLE+org:ORG+updated:PREVIOUS_DATE&per_page=30" --jq '.items[] | "\(.number) \(.title) \(.html_url) \(.pull_request.url // "issue")"'
gh api "search/issues?q=author:HANDLE+org:ORG+created:TODAY_DATE&per_page=20" --jq '.items[] | "\(.number) \(.title) \(.html_url)"'
```

`involves:` deliberately catches everything — authored, commented, reviewed, or assigned — so nothing the user touched is missed. The accuracy rule that follows from that: **distinguish "did / authored" from "reviewed / merged"** and describe each item accurately; confirm in Step 3 rather than claiming authorship.

## Step 3 — Ask before completing the standup

After gathering the data, ask the user ALL of these in a single message:

> 1. **Paste your last posted daily** — specifically its **Today** section. That's the plan of record for the previous day; I'll reconcile it with the GitHub activity. 2. **Did you actually do everything in that list?** Some items may not have happened or carried over — tell me what to drop or mark as still in progress. Don't assume everything listed was done. 3. **Anything you did that isn't in that list or on GitHub?** (calls, reviews, research, writing, community support, meetings — or "no") 4. **What do you plan to work on today?** One item per line.

Wait for the response. Build the **Previous Day** section from all four together plus the Step 2 activity — the pasted plan is a starting point, **not** ground truth; only include what the user confirms.

## Step 4 — Format and output

Produce the standup ready to paste into `DEST`. **Output it inside a fenced code block** (triple backticks, no language tag) so it renders with a copy button.

Each bullet is **at most 2 lines** — one sentence max; chat platforms have character limits, so don't pad.

**Expand multi-step work into sub-tasks — never flatten a real effort to one line.** A single line makes substantial work look trivial. When an item has several parts, write a parent line followed by 2-space-indented sub-bullets so the scope is visible:

- **Previous Day:** a shipped deliverable made of pieces → list the pieces (a guide collection → each guide; a feature → each part built/fixed; a doc → its main sections).
- **Today:** a multi-step plan → the concrete steps (research/verify against the code, restructure, build or write each piece, add assets, review, open the PR).
- Expansion is driven by whether the task is multi-step, not by whether it has a GitHub link — plain tasks (research, planning, "start the X series") are often the biggest; itemise those too.

Judgement: expand only when the work genuinely has parts. Keep a truly atomic task (a quick fix, a single review) as one line — don't invent filler sub-tasks. Every bullet, parent or sub, still stays ≤ 2 lines.

**Describing the user's own Today answers — same discipline as GitHub titles:**

- The answers to question 4 are **raw notes, not copy**. Echoing them back lightly cleaned up ("review the taxonomy and merge the pr" → "Review the Taxonomy guide and merge the PR") is as much a failure as restating a PR title — the user already knows what they typed.
- Rewrite each item into a full sentence and **enrich it with what you already know** from the conversation and the GitHub data: resolve "the pr" to its number and link, name the doc or feature, say what the step accomplishes.
- Only expand into sub-steps you have **evidence** for — steps discussed in the conversation, visible in the work itself, or confirmed by the user. When you know nothing beyond the raw note, one well-written line beats invented structure.

**Describing GitHub activity — CRITICAL rules:**

- **NEVER restate the PR/issue title.** The title is not the description. Read it, understand what was actually done and why it matters, then write your own sentence.
- Bad: `[#212](url) — fix(billing): invoice sort, upload UX, plan card layout`
- Good: `[#212](url) — Fixed invoice sorting and the receipt-upload flow in the billing panel so customers can track their payments clearly`
- Never say "commented on" — describe what was actually done (fixed, reviewed, flagged, addressed feedback, …).
- Issue-only item → link the issue; PR-only → link the PR. If an issue has a linked PR, read **both** to understand the task but link **only the PR**.
- Past tense for Previous Day. Future/present for Today — **but if the user wrote a Today item in past tense, that's intentional; keep their tense.**
- **Most DevRel tasks are multi-step — surface the workflow.** Use the natural sequence for that task type, e.g. guides (research → verify against the codebase → draft → screenshots → cross-links → PR), QA (set up → run the flows → record issues → share → re-test), articles (research → outline → draft → edit → visuals → publish). These archetypes are a **fallback for when you know nothing about the task** — real steps from the conversation always win, and never inject an archetype step (screenshots, visuals, …) the user hasn't actually planned. If you're unsure what the real sub-steps are, **ask the user rather than guess**.

```
Good day

**Previous Day (Month DD)**
* [number](url) — one sentence on a standalone piece of work, in your own words
* [number](url) — parent line for a multi-part deliverable (a parent can carry its own link):
  * sub-item — one piece that made it up
  * sub-item — another piece

**Today (Month DD)**
* Standalone task — one sentence on what will be done
* Parent line for a multi-step task:
  * concrete step you'll do
  * concrete step you'll do
```

Rules:

- No GitHub activity on the previous day → note it and rely entirely on the user's Step 3 answers.
- Today items the user linked as issue/PR numbers → `[number](url)`; plain-text tasks → `* task description`.
- No commentary after the standup block — the output is copy-paste ready.
- Tone professional but warm; it's a team update.

## Output

The finished standup in a fenced code block in chat, nothing written to disk, nothing posted.

## Boundaries

- Never posts to Discord/Slack/anywhere; never asserts unconfirmed work.
- Triaging external contributions and mentions → `community-triage`.
- Handle/orgs/destination live in the project's `AGENTS.md` DevRel section (scaffolded by `scaffold-agents-md`), or come in as arguments.
