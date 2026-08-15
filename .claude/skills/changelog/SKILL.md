---
name: changelog
description: >-
  Generate a changelog entry and community release notes from git history and changesets — detects whether the repo uses changesets or plain conventional-commit history, categorizes the changes, and drafts both the CHANGELOG entry and a developer-facing release summary for GitHub Releases, blog posts, or community channels. Use when the user asks for a changelog, release notes, a release summary, or a version announcement. Writes drafts only; never commits, tags, or publishes.
argument-hint: "[version | range]"
allowed-tools: Read, Grep, Glob, Write, Bash(git tag:*), Bash(git log:*), Bash(git diff:*), Bash(git describe:*), Bash(ls:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Changelog & release notes

Turns the raw change record — changesets and/or conventional commits — into two polished drafts: a CHANGELOG entry matching the repo's existing style, and community-facing release notes a developer would actually want to read.

## Arguments

- `[version]` — the version being released (e.g. `2.3.0`); used in headings and install commands.
- `[range]` — an explicit git range (e.g. `v2.2.0..HEAD`) to gather from. Omitted → last release tag to `HEAD`.
- Neither → gather since the last tag and ask for the version if it isn't determinable from pending changesets.

## Guardrails — read first

- **Drafts only.** Never edit an existing `CHANGELOG.md` in place, never `git tag`, never publish a release, never commit — the outputs are files the user reviews and uses (→ `stage-commit` if they want the drafts committed).
- **Never invent changes.** Every line traces to a commit, changeset, or diff; if intent is unclear from the message, read the diff or ask rather than guessing.
- **In a monorepo, confirm scope.** If it isn't obvious from the changesets which packages the release covers, ask before drafting.

## Step 0 — Orient

1. Detect the change record: a `.changeset/` directory → changesets-based; otherwise → plain conventional-commit history (the commit format this repo standardizes on — see `stage-commit`).
2. Find the last release tag: `git tag --sort=-version:refname | head -5` (or `git describe --tags --abbrev=0`).
3. Read the tail of the existing `CHANGELOG.md`(s) — the new entry matches the established format when it's a coherent one (changesets' generated shape, Keep a Changelog, or a consistent equivalent); if the existing entries are inconsistent or malformed, use the Step 3 shape and flag the inconsistency instead of copying it.
4. Read the project's `AGENTS.md` for the facts the notes need: product name, package npm names, docs URL, community links.

## Step 1 — Gather changes

1. `git log <last-tag>..HEAD --oneline --no-merges` (or the given range).
2. Changesets repos: read every `.changeset/*.md` except `README.md` — each carries package name(s), bump type (patch/minor/major), and a description.
3. For anything ambiguous, `git log` the individual commit or read its diff.

## Step 2 — Categorize

Group every change:

| Category             | What belongs here                               |
| -------------------- | ----------------------------------------------- |
| **Breaking changes** | API changes, removed features, changed behavior |
| **Features**         | New capabilities                                |
| **Bug fixes**        | Corrections to existing behavior                |
| **Documentation**    | Doc pages, READMEs, examples                    |
| **Internal**         | Refactoring, dependencies, CI/CD, tests         |

Conventional-commit history maps mechanically — `feat` → Features, `fix` → Bug fixes, `!`/`BREAKING CHANGE` → Breaking, `docs` → Documentation, `chore`/`refactor`/`ci`/`test`/`build` → Internal. Changesets map by bump type (major → Breaking, minor → Features, patch → Fixes) plus the description's content.

## Step 3 — Draft the changelog entry

Match the existing `CHANGELOG.md` style when it's coherent (see Step 0); otherwise use the shape below and note the deviation in the summary. Changesets repos use the Major/Minor/Patch section shape:

```markdown
## <VERSION>

### Major Changes

- <description of the breaking change> ([commit-hash])

### Minor Changes

- <description of the new feature> ([commit-hash])

### Patch Changes

- <description of the fix> ([commit-hash])
```

## Step 4 — Draft the community release notes

A developer-friendly summary suitable for a GitHub Release body, blog post, or community announcement — neutral example shape (swap in the project's real names/links from `AGENTS.md`):

```markdown
# <Product> <VERSION>

<1-2 sentences on the release theme — what this release is about, not a list.>

## Highlights

- **<Feature name>** — <what it enables for the user, one line>

## Breaking changes

<What changed and exactly how to migrate. Omit the section if none.>

## Bug fixes

- <fix, phrased as the user-visible behavior that's now correct>

## Full changelog

See the [full changelog](<link to CHANGELOG.md>).

---

**Get started:** `pnpm add @acme/toolkit@<VERSION>`

[Documentation](<docs-url>) | [Discussions](<discussions-url>) | [Community](<community-url>)
```

### Writing rules

- **One canonical product name** — write it exactly as the project brands it, every time; no bare abbreviations or casing drift.
- **The project's vocabulary, consistently** — use its established domain terms (its "agent" vs "bot", "tool" vs "function" distinctions), never synonyms that blur them.
- **Packages by npm name** (`@acme/toolkit`), not folder or nickname.
- **Specific, never vague** — "improved performance" is banned; say what got faster and where. Link the doc page when describing a new feature.
- **Write for the consumer of the release**, not the committer — user-visible behavior first, implementation details only when they matter to upgraders.

## Output

Two files, both shown in chat with their paths:

- `_reports/changelog-entry.md` — ready to replace or enhance the (often auto-generated) changelog entry.
- `_reports/release-notes.md` — ready for the GitHub Release body, blog, or community channels.

Note in the summary: where changesets auto-generate `CHANGELOG.md` and GitHub Releases, these drafts are the polished replacement/enhancement, not a parallel system.

## Boundaries

- **Never tags, publishes, or commits** — the release/publish pipeline → `devops`; committing → `stage-commit`.
- The input data quality is the commit format — Conventional Commits per `stage-commit`.
- Polishing the prose of the notes → `copy-editing`.
