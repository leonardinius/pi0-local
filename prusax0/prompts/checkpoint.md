---
description: Save a lightweight checkpoint of the current conversation to short-term memory.
---

Save a compact checkpoint to `~/.pi/agent/prusax0/memory/short_term/` with filename `YYYY-MM-DD_HHMMSS.md` using the current UTC timestamp.

Include only sections that have content:

# Session Snapshot — [date] [time]

## Active Task
- What we are trying to accomplish now.

## Key Decisions
- Important decisions and why they matter.

## Files Touched / Read
- Modified files and notable files inspected.

## Useful Findings
- Reusable insights worth preserving for `/save` review.

## Blockers / Next Step
- Open issues and the immediate next action.

Keep it concise. Do not promote anything to long-term memory from `/checkpoint`; use `/save` or explicit user confirmation for milestone-based long-term saves. After saving, report the file path and one-line summary.
