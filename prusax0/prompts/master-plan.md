---
argument-hint: feature description or Jira ID
tags: plan
---

> **Pi/OpenAI subagents**: Use `subagent` with `architect` and `advisor`. Agent models are OpenAI-specific and defined in `~/.pi/agent/prusax0/agents`.

$ARGUMENTS

Read the project's CLAUDE.md/AGENTS.md/README if present for conventions and quality gates.

Ask clarifying questions first. Understand goal, scope, constraints, and natural PR boundaries.

Use `subagent` agent `architect` to propose a multi-PR decomposition. Then use `subagent` agent `advisor` to review boundaries, sequencing risks, and missing coverage. Present the review to me as a decision gate and wait for confirmation before writing files.

Run `/Users/leo/.pi/agent/prusax0/scripts/plan-create <project>-<slug>` to create the master plan file. Write:

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
