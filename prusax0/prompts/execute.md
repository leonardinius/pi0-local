---
argument-hint: plan filename (optional)
tags: plan, execute
---

> **Pi/OpenAI subagents**: Use `subagent` with role routing. Agents live in `~/.pi/agent/prusax0/agents` and use OpenAI model strings.

If a plan file was provided, read it from `~/.pi/agent/prusax0/plans/doing/`. Otherwise list that directory and pick the most relevant task.

$ARGUMENTS

Read the project's CLAUDE.md/AGENTS.md/README for conventions and quality gates. If the selected step is ambiguous, stop and ask before editing.

Implement only one incomplete step per invocation.

## Role routing

Route by the selected progress step title:

| Step title contains | Agent | Notes |
|---|---|---|
| `Architect` | `architect` | Returns an architecture brief; the parent session appends it to the plan. |
| `Coder` | `coder` | Implements code/tests from the architecture brief or step text. |
| `Refactorer` | `refactorer` | Simplifies changed code without behavior changes. |
| `Reviewer` | `reviewer` | Reviews current diff and returns PASS/FAIL. |
| anything else | `coder` | Normal implementation step. |

Use `advisor` before asking the user when a decision is ambiguous or risky.

## Process

1. Find the next `[ ]` item in `## Progress` and mark it `[>]`.
2. Launch the routed subagent with the full plan, selected step number/title, relevant files/context, and instruction **not** to edit `## Progress`.
3. For `architect`, append the returned `## Architecture brief` yourself; the architect must not edit files.
4. For `coder`/`refactorer`, re-read changed files after the subagent returns.
5. For risky/non-trivial code changes, run `reviewer`; on FAIL, stop unless the fix is obvious and safe to send once back to `coder`.
6. Run project tests/lint from local docs. Use `RTK_DISABLE=1` for commands where exact raw output/behavior matters.
7. If successful, mark the step `[x]` with a one-line summary and commit as `[step N] <title>`.
8. If all steps are complete, add a short summary and run `~/.pi/agent/prusax0/scripts/plan-done <slug>`.
9. If steps remain, stop and report what was completed and what is next.

Never trust stale line numbers; search for symbols and paths. Stop on failing tests, unresolved ambiguity, or reviewer FAIL.
