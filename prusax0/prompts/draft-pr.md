---
description: Creates draft PR
argument-hint: GitHub issue URL/number or context
---

Commit changes and open a DRAFT PR.

# Context

Extra context: $ARGUMENTS
If a GitHub issue URL/number/reference is provided, use it for branch naming, commit message context, PR title/body, and issue linking.

# Preconditions

- Use `git`/`gh` directly, or `rtk git` / `rtk gh` when compact output is useful.
- Before reading issues or creating a PR, run `gh auth status`. If GitHub CLI is not authenticated, stop and tell the user to run `gh auth login`.
- If the repository cannot be inferred from the current git remote, ask the user for `owner/name` or a full GitHub issue URL.
- Omit AI-agent references in commits and PRs.

# GitHub issue handling

If an issue is provided and `gh` is authenticated, fetch it with:

```bash
gh issue view <issue-or-url> --json number,title,body,state,labels,assignees,comments,url
```

Use `issue-number-short-title` for branch naming when sensible (for example `123-fix-login-timeout`). Include `Closes #123` or `Fixes #123` in the PR body only when the PR fully resolves the issue; otherwise use `Refs #123`.

# Commit Message Guidelines

- Focus on WHY, not implementation detail.
- Be concise.
- Start with high-level purpose.
- If tied to a GitHub issue, prefer `[#123] Title` or the repo's existing convention.

# Steps

1. Check current branch. If no issue-style identifier appears in the branch and the user supplied an issue, create/rename to `<issue-number>-<short-description>` (max ~50 chars).
2. Inspect the diff and stage only intended files with `git add`.
3. Commit with a concise message following the guidelines above.
4. Check for `.github/pull_request_template.md` and use it if present.
5. Run `gh auth status`; if authenticated, open a draft PR with `gh pr create --draft`, including the issue link/reference in the body.
