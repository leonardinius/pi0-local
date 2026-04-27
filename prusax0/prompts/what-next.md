---
description: Show what's done and what's next in the plan queue
tags: plan
---

Read every file in `~/.pi/agent/prusax0/plans/done/` (just the objective/summary, not the full step-by-step) to understand what has already been completed. Then read every file in `~/.pi/agent/prusax0/plans/doing/` to understand what is currently in the work queue.

Read the project's CLAUDE.md and README (if present) to understand the current state of the project and its goals.

Now help me figure out what to build next:

- Suggest 3–5 concrete ideas, ordered by what you think would have the highest impact.
- For each idea: a one-sentence description and a brief rationale (why now, what it unlocks).
- Factor in what's already queued in `doing/` — don't duplicate those.
- Keep it conversational. This is a brainstorm, not a spec.

After presenting the ideas, ask me which ones interest me (or if I have something else in mind) so we can narrow down. We may go back and forth a few times. Once we agree on what to build, tell me to start a new conversation and use `/plan` to write the task file.