---
argument-hint: feature description, GitHub issue URL/number, or ticket reference
tags: plan, orchestrate
---

> **Pi/OpenAI subagents**: This workflow creates plans for the installed `architect → coder → refactorer → reviewer` subagent pipeline. Agents use OpenAI-specific model strings in `~/.pi/agent/prusax0/agents`.

$ARGUMENTS

Read the project's CLAUDE.md/AGENTS.md/README if present.

Если в `$ARGUMENTS` есть GitHub issue (URL/номер) — забери его через `gh issue view ...` (сначала `gh auth status`) и используй как контекст.

Before asking questions, rely on automatic memory recall. Use manual `/memory recall` or `rg ~/.pi/agent/prusax0/memory/long_term/*.md` only if prior history is clearly needed or recall seems insufficient; read only matching `## ... ---` blocks.

Ask clarifying questions before writing anything. For non-obvious design decisions, present options/trade-offs and ask whether to proceed with the recommendation. After each round, ask: "Continue questions" or "Finalize spec".

## Phase 1: Master plan

Use `subagent` agent `architect` to propose reviewable sub-plans and dependencies. Use `subagent` agent `advisor` to review the decomposition. Present the review as a decision gate before writing files.

Create the master via `~/.pi/agent/prusax0/scripts/plan-create <project>-<slug>`.

Planning-only boundary: after approval, write plan files only. Do not execute sub-plan roles, mutate target files, run non-read-only implementation commands, or mark progress complete without a separate explicit execution request. Treat ambiguous confirmations like "proceed" as plan-write approval only; end with plan paths and tell the user to run them via an execute command.

Write:

```markdown
# <Title>

## Why
...

## What
...

## Execution model
Each step maps to one sub-plan in `plans/doing/`. Execute a sub-plan with `/execute-autopilot`.

## Sub-plans
| # | Slug | Summary | Depends on |
|---|------|---------|------------|

## Constraints / non-goals
...

## Progress
- [ ] Step 1: Sub-plan — <slug>
```

Keep total sub-plans ≤8.

## Phase 2: Sub-plans

For each sub-plan, create a self-contained pipeline plan with:
- Why / What
- Acceptance criteria including tests/lint and fail-before/pass-after for new/updated tests
- Implementation context with files/symbols/behaviors/edge cases
- Prior knowledge references
- Pipeline roles:
  1. Architect (`architect`): returns an architecture brief; **the parent/orchestrator appends it** as `## Architecture brief`; architect does not edit files.
  2. Coder (`coder`): implements brief with TDD; reports fail-before/pass-after.
  3. Refactorer (`refactorer`): simplifies without behavior changes.
  4. Reviewer (`reviewer`): PASS/FAIL; on FAIL, one repair pass by `coder`, then re-review.
- Steps with `(depends_on)` annotations for those four roles
- Progress checkboxes
- Constraints / non-goals

Use symbol names and file paths, never line numbers. Sub-plans must be executable by `/execute-autopilot` without additional clarification.
