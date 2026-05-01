---
argument-hint: feature description, GitHub issue URL/number, or ticket reference
tags: plan
---

> **Pi/OpenAI subagents**: Use `subagent` with `scout`, `planner`, and `advisor` as needed. Agent models are OpenAI-specific and defined in `~/.pi/agent/prusax0/agents`.

$ARGUMENTS

Read the project's CLAUDE.md/AGENTS.md/README if present for conventions and quality gates.

Если в `$ARGUMENTS` указан GitHub issue (URL/номер) — получи его через `gh issue view ...` (предварительно `gh auth status`) и используй как контекст, а не как финальные требования.

Ask clarifying questions before writing anything. After each Q&A round, summarize clarifications and ask: "Continue questions" or "Finalize spec".

Before writing the plan file:
1. Use `subagent` agent `scout` if codebase context is needed.
2. Use `subagent` agent `planner` to draft the plan shape.
3. Use `subagent` agent `advisor` to review the proposed steps for dependencies, risks, edge cases, and alternatives.
4. Present the advisor findings to me as a decision gate. Do not silently apply them.

Then run `~/.pi/agent/prusax0/scripts/plan-create <project>-<slug>` to create the plan file, where `<project>` is the git repo basename from `git rev-parse --show-toplevel`.

Planning-only boundary: after approval, write the plan only. Do not execute steps, mutate target files, run non-read-only implementation commands, or mark progress complete without a separate explicit execution request. Treat ambiguous confirmations like "proceed" as plan-write approval only; end with the plan path and tell the user to run it via an execute command.

Write the plan with:
- **Why**: importance and timing
- **What**: objective and definition of done
- **Acceptance criteria**: verifiable outcomes, including test/lint suite passing; if tests are added/updated, confirm fail-before/pass-after
- **Steps**: numbered, max 10, each completable in one agent session; use `(depends_on: N, M)` where needed; parallel steps must own non-overlapping files
- **Progress**: `- [ ] Step N: <title>` for each step
- **Dependencies**: other plans in `doing/`, if any
- **Constraints / non-goals**: explicit exclusions and any user decision that diverged from advisor recommendation

Use symbol names and file paths, never line numbers. Write it so another subagent can execute without asking clarifying questions.
