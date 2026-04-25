---
description: Creates draft PR
argument-hint: JIRA ticket or context
---

Commit changes and open a DRAFT PR.

# Context

Extra context: $ARGUMENTS
If a Jira ticket is provided (for example `ABC-123`), use it for branch naming and PR title formatting.

# Preconditions

- Use `git`/`gh` directly, or `rtk git` / `rtk gh` when compact output is useful.
- Before PR creation, run `gh auth status`. If GitHub CLI is not authenticated, stop and tell the user to run `gh auth login`.
- Omit AI-agent references in commits and PRs.

# Commit Message Guidelines

- Focus on WHY, not implementation detail.
- Be concise.
- Start with high-level purpose.
- If Jira ticket provided: `[ABC-123] Title`.

# Steps

1. Check current branch. If no `ABC-123`-style ticket appears in the branch and the user supplied one, create/rename to `ABC-123-description` (max ~50 chars).
2. Inspect the diff and stage only intended files with `git add`.
3. Commit with a concise message following the guidelines above.
4. Check for `.github/pull_request_template.md` and use it if present.
5. Run `gh auth status`; if authenticated, open a draft PR with `gh pr create --draft` using the commit message for title/body.
