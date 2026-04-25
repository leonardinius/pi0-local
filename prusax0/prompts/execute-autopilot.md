---
argument-hint: plan filename (optional)
tags: plan, execute
---

> **Pi/OpenAI subagents**: Use `subagent` with role routing. Agents live in `~/.pi/agent/prusax0/agents` and use OpenAI model strings.

Read plan from `/Users/leo/.pi/agent/prusax0/plans/doing/` (pick most relevant if no filename is given).

$ARGUMENTS

Runs unattended. Make judgment calls and document them, but stop on test failures, reviewer FAIL, cycles, bad dependencies, or unresolvable conflicts.

## Dependency parsing

Steps may declare `(depends_on: N, M)`. Without it, assume a step depends on the previous step unless the plan clearly says otherwise. Build waves and abort if there is a cycle, self-dependency, nonexistent dependency, or unreachable orphan. Print computed waves before executing.

## Role routing

Route each step by title:

| Step title contains | Agent | Notes |
|---|---|---|
| `Architect` | `architect` | Returns an architecture brief; parent appends it. |
| `Coder` | `coder` | Implements code/tests. |
| `Refactorer` | `refactorer` | Simplifies changed code without behavior changes. |
| `Reviewer` | `reviewer` | Reviews current diff and returns PASS/FAIL. |
| anything else | `coder` | Normal implementation step. |

Use `advisor` for ambiguous/risky decisions before continuing.

## Execution

The orchestrator (this session) owns `## Progress`; subagents must not edit progress.

This setup does **not** create git worktrees. Execute mutation-capable steps sequentially in dependency order. Do not run parallel coders/refactorers in the same worktree. Parallel subagents are allowed only for read-only analysis steps when their outputs do not mutate files.

For each step in dependency order:
1. Mark the step `[>]` before launch.
2. Launch the routed subagent with: full plan, step number/title, relevant context, TDD fail-before/pass-after requirements, test/lint expectations, and instruction not to edit `## Progress`.
3. For `architect`, append returned architecture/design brief to the plan yourself.
4. For `reviewer`, if verdict is FAIL, stop unless exactly one safe repair pass by `coder` is obvious; then re-review once.
5. Run tests/lint in the main worktree after mutation steps. Use `RTK_DISABLE=1` for commands where exact raw output/behavior matters.
6. Mark successful step `[x]` with a summary and commit as `[step N] <title>`.

All done: add summary to the plan and run `/Users/leo/.pi/agent/prusax0/scripts/plan-done <slug>`.

Do not push, open PRs, or continue after a failure. Report steps executed, decisions, tests, commits, and risks.
