---
name: community-triage
description: >-
  Triage external community contributions and mentions across the GitHub orgs a DevRel monitors. Use when the user asks to triage contributions, check external PRs/issues, see what the community has opened, or find where they've been tagged/mentioned. Fetches org members dynamically to separate external from internal authors, filters a time window on last-updated date (default last 2 months), collapses bot PRs into a batch-merge list, and reports two sections — External Contributions grouped by repo, and You've Been Tagged. Read-only; never comments on, merges, or closes anything.
argument-hint: "[orgs] [window, e.g. last 6 months]"
allowed-tools: Bash(gh api:*), Bash(gh search:*), Bash(date:*), Read, Grep
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Community triage

Sweep the configured GitHub orgs for open issues and PRs that need DevRel attention — external contributions and items where the user has been tagged — and present a tight two-section report.

## Arguments

- `orgs` — one or more GitHub org names to triage (comma or space separated). Optional; falls back to configuration (below).
- `window` — the activity window, e.g. `last 6 months`, `this year`, `since May`. Optional; defaults to the last 2 months.

## Configuration — resolve before Step 0

Resolve the GitHub handle and orgs in this order; never hardcode either:

1. **Arguments** — orgs passed to the skill win.
2. **The project's `AGENTS.md`** — look for a **DevRel** section listing the GitHub handle and the orgs to monitor.
3. **Ask once** — if neither source has a value, ask the user for their GitHub handle and the org(s) to triage, then proceed. Suggest they add a DevRel section to `AGENTS.md` so future runs don't ask.

Call the resolved values `HANDLE` and the org list `ORGS` below.

## Guardrails — read first

- **Read-only.** This skill only searches and reports. It never comments, labels, merges, closes, or edits anything — a "triage" request is not permission to act on the items found.
- **Report exactly what the searches return.** Never invent items, authors, or dates; if a search fails, say so rather than filling the gap.
- **Renamed orgs 404 in `gh search`** — always use an org's current name. If a search 404s, ask the user whether the org was renamed.

## Step 0 — Time window (default last 2 months)

Filter on the **last-updated** date, not the opened date — stale items nobody has touched are excluded. Compute the cutoff:

```bash
date -v-2m +%Y-%m-%d 2>/dev/null || date -d '2 months ago' +%Y-%m-%d   # BSD/macOS form, GNU/Linux fallback
```

Call this `CUTOFF` and apply `--updated ">=CUTOFF"` to every search in Steps 2 and 3. If the user gave a window argument (e.g. "last 6 months", "since May"), compute the matching cutoff (or an explicit `--updated "START..END"` range) instead, and name the window you used in the summary line. Only widen or narrow the window when the user asks; otherwise keep the 2-month default.

## Step 1 — Fetch org members dynamically

For each org in `ORGS`, run these in parallel:

```bash
gh api orgs/ORG/members --paginate --jq '[.[].login | ascii_downcase]'
```

Combine the arrays into a single deduplicated set of known internal members. Always include `HANDLE` (lowercased) in this set — the user's own activity is not external.

## Step 2 — Fetch issues and PRs active in the window

For each org, run both searches; run all of them in parallel (substitute `CUTOFF` from Step 0):

```bash
gh search issues --owner ORG --state open --updated ">=CUTOFF" --limit 100 --json number,title,author,repository,url,createdAt,updatedAt,labels,isPullRequest
gh search prs --owner ORG --state open --updated ">=CUTOFF" --limit 100 --json number,title,author,repository,url,createdAt,updatedAt,labels
```

## Step 3 — Fetch mentions in the window

For each org, find open issues/PRs where the user has been mentioned (note the gotcha — the flag is `--mentions`, not `--mention`):

```bash
gh search issues --mentions HANDLE --owner ORG --state open --updated ">=CUTOFF" --limit 50 --json number,title,author,repository,url,createdAt,updatedAt
```

Run these in parallel too.

## Step 4 — Filter and present

Using the combined internal member set from Step 1:

**Section A — External Contributions.** List every open issue and PR where `author.login` (lowercased) is NOT in the internal member set and NOT a bot (any login ending in `[bot]`, e.g. `dependabot[bot]`, `renovate[bot]`, `github-actions[bot]`). Group by repo, newest activity first. Each item:

- `[#number](url) — title` · **author** · last active `updatedAt` · labels (if any)

Then separately list **bot PRs** (dependabot, renovate, etc.), grouped by repo and collapsed to a count + list, so the user can batch-merge them.

**Section B — You've Been Tagged.** List every item from Step 3 where the user is mentioned but is NOT the author:

- `[#number](url) — title` · opened by **author** · repo · last active `updatedAt`

If a section is empty, say "Nothing here." — never omit the section.

## Output

Printed to chat, nothing written to disk. Start with a one-line summary count that names the window (e.g. "5 external · 2 dependabot · 1 mention — active since 2026-04-23"), then the two sections. No extra prose beyond the summary line and the sections.

## Boundaries

- Never acts on the items it finds — no comments, labels, merges, or closes; it reports and stops.
- Preparing the user's own standup from their activity → `daily-standup`.
- Handle/orgs live in the project's `AGENTS.md` DevRel section (scaffolded by `scaffold-agents-md`), or come in as arguments.
