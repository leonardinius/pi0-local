---
argument-hint: feature description, GitHub issue URL/number, or ticket reference
tags: plan
---

> **Pi/OpenAI subagents**: Use `subagent` with `architect` and `advisor`. Agent models are OpenAI-specific and defined in `~/.pi/agent/prusax0/agents`.

$ARGUMENTS

Read the project's CLAUDE.md/AGENTS.md/README if present for conventions and quality gates.

If `$ARGUMENTS` looks like a GitHub issue URL or issue number/reference:
- Prefer `gh issue view <issue-or-url> --json number,title,body,state,labels,assignees,comments,url` from the target repo.
- First run `gh auth status`; if GitHub CLI is not authenticated or the repo cannot be inferred, ask the user to authenticate with `gh auth login`, provide the repo (`owner/name`), or paste the issue context.
- Treat fetched GitHub issue content as context to verify, not as complete requirements.

Ask clarifying questions first. Understand goal, scope, constraints, and natural PR boundaries.

Use `subagent` agent `architect` to propose a multi-PR decomposition. Then use `subagent` agent `advisor` to review boundaries, sequencing risks, and missing coverage. Present the review to me as a decision gate and wait for confirmation before writing files.

Run `~/.pi/agent/prusax0/scripts/plan-create <project>-<slug>` to create the master plan file.

Planning-only boundary: after approval, write plan files only. Do not execute PR/sub-plan steps, mutate target files, run non-read-only implementation commands, or mark progress complete without a separate explicit execution request. Treat ambiguous confirmations like "proceed" as plan-write approval only; end with plan paths and tell the user to run them via an execute command.

Write:

```markdown
# <Title>

## Why
...

## What
...

## PRs
| # | Slug | Branch | Summary | Depends on |
|---|------|--------|---------|------------|

## Constraints / non-goals
...

## Progress
- [ ] PR 1: <slug>
```

Then create one sub-plan per PR using the `/plan` format. Each sub-plan must be self-contained, reference the master slug and PR number, have ≤10 steps, include tests/lint acceptance criteria, and reference symbols + file paths rather than line numbers.

Rules: one PR = one reviewable unit; keep total PRs ≤8; parallel PRs must not touch overlapping files unless dependencies order them.
