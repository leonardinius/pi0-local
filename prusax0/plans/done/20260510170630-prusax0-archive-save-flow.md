# Prusax0 Archive Save Flow

## Why
Update `/save` cleanup so reviewed-but-not-promoted short-term drafts are archived instead of deleted, while keeping verified knowledge promotion unchanged.

## What
- Preserve existing long-term promotion logic.
- Move skipped/rejected short-term drafts to `memory/archive/` after review.
- Keep `/save` from scanning `archive/` as input.
- Keep `/save` behavior explicit and easy to revert.

## Execution model
Each step maps to one sub-plan in `plans/doing/`. Execute a sub-plan with `/execute-autopilot`.

## Sub-plans
| # | Slug | Summary | Depends on |
|---|------|---------|------------|
| 1 | archive-save-flow | N/A | - |

## Constraints / non-goals
- Do not change promotion criteria.
- Do not archive anything without an explicit review outcome.
- Do not add hooks, daemons, timers, or persistent state.

## Progress
- [x] Step 1: Sub-plan — archive-save-flow (reviewed skipped drafts archive; unreviewed leftovers remain in short_term)
