# Security Policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the [Security tab](https://github.com/Timonwa/timonwa-skills/security) and click **Report a vulnerability**, or go directly to [github.com/Timonwa/timonwa-skills/security/advisories/new](https://github.com/Timonwa/timonwa-skills/security/advisories/new). This keeps the report private until a fix ships — please don't open a public issue for a security concern.

Include what the skill/file does wrong, the concrete scenario where it causes harm, and (if you have one) a fix. Expect an initial response within a few days.

## Scope

This repo publishes **Claude Code skills and commands** — instructions and reference material an agent loads into context, some with tool access (`allowed-tools`) and some that read/write files or run shell commands. That shapes what "security issue" means here, different from a typical application:

**In scope:**

- A skill that **instructs an insecure pattern** a reader would ship into their own codebase — a weak CSP, broken auth flow, wrong OWASP mapping, insecure default, etc.
- A skill whose **scope quietly exceeds what its description promises** — `allowed-tools` broader than the documented steps need, or an action (commit, push, delete, network call) that isn't gated by the skill's own explicit approval steps.
- **Prompt-injection surface** — content designed (or exploitable) to make an installed skill act outside the user's intent, e.g. via untrusted input a skill reads (a repo file, a fetched URL, a tool result).
- **Supply-chain issues** — a compromised or tampered dependency in `scripts/`, or drift between a vendored skill and its real upstream that misrepresents what it does.
- **Secrets or credentials** accidentally committed anywhere in the repo's history.

**Out of scope (open a normal issue instead):**

- Advice that's merely **stale or non-optimal** but not exploitable — that's a correctness bug, not a security report. (`/conventions-audit` and the rest of the [audits](.claude/commands/) exist for exactly this class of finding.)
- Issues in a **vendored skill's own upstream** that aren't specific to how this repo packages it — report those to that project.
- Issues in **Claude Code itself** (the runtime that loads these skills) — report those to Anthropic, not here.

## Supported scope

This is a living content repo, not a versioned release train — only the content on `main` is maintained. There's no backport policy for older commits.
