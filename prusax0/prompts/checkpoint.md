---
description: Save a checkpoint of the current conversation to short-term memory NOW.
---

Save a checkpoint of the current conversation to short-term memory NOW.

Create a markdown file at `~/.pi/agent/prusax0/memory/short_term/` with filename format: `YYYY-MM-DD_HHMMSS.md` (use current UTC timestamp).

The file MUST contain ALL of the following sections:

# Session Snapshot — [date] [time]

## What Was Worked On
- List every task, bug, feature discussed in this session

## Key Decisions
- Every decision made and the reasoning behind it

## Code Changes
- Files modified/created/deleted with brief description of each change
- Branch name if relevant

## GitHub Issues / Tickets
- Every GitHub issue or ticket referenced (ID/URL + summary)
- Status changes made

## Patterns & Knowledge Discovered
- Any new patterns, conventions, or codebase knowledge learned
- Debugging insights
- Cross-service interactions discovered

## Open Questions & Blockers
- Anything unresolved
- Next steps

## Important Context
- Anything else that would be lost if this conversation were compressed
- Error messages, stack traces, or specific details that matter

After saving, confirm the file path and a brief summary of what was captured. Do not promote anything to long-term memory from `/checkpoint`; use `/save` or explicit user confirmation for milestone-based long-term saves.
