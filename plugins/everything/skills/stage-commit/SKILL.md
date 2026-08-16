---
name: stage-commit
description: Stage files created or modified in this conversation and commit them as small Conventional Commits, one review-gated commit at a time. Use when the user asks to commit their changes, stage a commit, or "group the changes and commit in stages". Splits large changesets into logical groups, proposes a message per group, and waits for explicit per-commit approval. Never auto-commits, never pushes.
argument-hint: "[grouping guidance, e.g. one commit per feature]"
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git diff:*)
metadata:
  version: 1.0.0
  author: Timonwa
  source: https://github.com/Timonwa/timonwa-skills
---

# Stage & commit (review-gated)

Stage the work from this session and commit it as small, well-described Conventional Commits — but only ever one approved commit at a time. The user stays in control: you propose, they review, they approve, you commit that one group, then you stop and repeat.

## Core rule — approval is per-commit and one-time

- **Never run `git commit` for anything the user has not just explicitly approved.** Show the staged files and the proposed message, then wait.
- **Approving one commit authorizes that commit only.** It is not standing permission — the next group needs its own review and its own approval.
- **"Group the changes and commit in stages" is not permission to auto-commit.** It authorizes the _grouping + staging workflow_, not unattended committing. You still stop and wait at every single commit.
- **Never `git push`, never `git commit` unattended, never batch multiple groups into one approval.**
- **Never bypass or rewrite the gates:** no `--no-verify` (it skips the husky/commitlint hooks the repo installed on purpose), no `--amend`/rebase of an already-approved commit (a changed commit needs a fresh approval), no `git add -A`/`git add .` (stage explicit paths only — a catch-all stages files you never touched).
- **If a pre-commit hook fails:** fix the underlying issue (or ask), re-stage, and re-present for approval — never work around the hook.

## Steps

1. Identify which files you created, wrote to, or edited **in this conversation**. Run `git status` to confirm they show as changed/untracked.
2. Run `git log --oneline -10` to learn the repo's scopes and tone — but always write Conventional Commits (below), even if the repo's history is inconsistent.
3. Never stage secrets — `.env*`, credentials, keys, tokens. Never stage files that were already modified before this conversation unless you explicitly changed them.
4. Decide the mode. If `$ARGUMENTS` is provided, treat it as the user's grouping instruction (e.g. "one commit per feature", or a path/scope to limit to) and follow it.
   - **Single commit** (default, small changeset): stage this session's files, propose one message, present, wait for approval.
   - **Staged / grouped** (many files, or the user asked to commit in stages): group the changed files into cohesive, logical units (e.g. by feature, layer, or concern), so the history reads as several small meaningful commits instead of one large one.
5. **For each group, in turn:** a. Stage **only** that group's files (`git add <paths>`). b. Draft its Conventional Commits message (format below). c. Present the staged file list + proposed message to the user. d. **Wait for explicit approval.** Only then run `git commit`. e. Move to the next group and repeat from (a) — a fresh review and a fresh approval.
6. After the last approved commit, stop. Report what was committed and what (if anything) remains unstaged. Do not push.

## Conventional Commits format — the library standard

Conventional Commits everywhere, regardless of a repo's local drift.

- Subject: `type(scope): description` — e.g. `feat(auth): add firebase login`.
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Add `!` after the type/scope for a breaking change (`feat(api)!: …`) and/or a `BREAKING CHANGE:` body footer.
- **Description MUST start lowercase** — commitlint's `subject-case` rule rejects a capitalized start (`feat(auth): firebase…`, not `feat(auth): Firebase…`). Keep proper nouns lowercased at the start; capitalize them only mid-sentence in the body. No trailing period on the subject.
- **Length:** every line (subject and body) ≤ 100 chars; whole message ≤ 5 lines total including the blank separator (so ≤ 3 body lines). If it doesn't fit, cut detail — drop filler ("now", "this commit", "we"), collapse lists into comma-separated phrases, and let the staged file list carry the specifics.
- Body (optional, after one blank line) explains the **why**, not a file-by-file recap.
