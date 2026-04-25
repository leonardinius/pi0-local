---
description: Save a checkpoint of the current conversation to short-term memory NOW.
---

Save a checkpoint of the current conversation to short-term memory NOW.

Create a markdown file at `/Users/leo/.pi/agent/prusax0/memory/short_term/` with filename format: `YYYY-MM-DD_HHMMSS.md` (use current UTC timestamp).

The file MUST contain ALL of the following sections:

# Session Snapshot — [date] [time]

## What Was Worked On
- List every task, bug, feature discussed in this session

## Key Decisions
- Every decision made and the reasoning behind it

## Code Changes
- Files modified/created/deleted with brief description of each change
- Branch name if relevant

## Jira Tickets
- Every ticket referenced (ID + summary)
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

After saving the short-term snapshot, also do the following:

## Proactive Long-Term Save

Check if any of these completed artifacts exist in this session and save them to the appropriate long-term category file at `/Users/leo/.pi/agent/prusax0/memory/long_term/`:

| Completed artifact | Save to |
|---|---|
| Working queries (SQL, BigQuery, JQL, etc.) | `queries.md` |
| Bug/incident resolved with clear steps | `runbooks.md` |
| Investigation completed with findings | `investigations.md` |
| Non-obvious code pattern or gotcha | `patterns.md` or `services.md` |
| Useful CLI command or workflow | `tools.md` |

For each: run the 3-step dedup protocol (Grep 2-3 title keywords + content fingerprint -> decide: skip/update/append). Use the standard entry format (## Title, > Added, > Updated, > Tags, content, ---), and update `_index.md` counts/tags.

After saving, confirm the file path and a brief summary of what was captured (both short-term snapshot and any long-term entries saved).
