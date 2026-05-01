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
- Перед issue/PR: `gh auth status`; если не авторизован — попроси `gh auth login`.
- Если repo не определяется по remote — попроси `owner/name` или полный URL issue.
- Omit AI-agent references in commits and PRs.

# GitHub issue handling

Если передан issue и `gh` авторизован — получи контекст через `gh issue view <issue-or-url> --json number,title,body,state,labels,assignees,comments,url`.
Для ветки используй формат `issue-number-short-title` (напр. `123-fix-login-timeout`).
В PR: `Closes/Fixes #123` только при полном закрытии, иначе `Refs #123`.

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
