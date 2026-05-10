# Prusax0 Archive Short Term Memory

## Why
Add an `archive/` layer so short-term drafts that are not promoted can be retained instead of deleted, while keeping `long_term/` verified and `memory/_insights/` separate.

## What
- Introduce `memory/archive/` as a non-recall holding area for rejected or unpromoted short-term material.
- Keep `/save` responsible for promotion review, then move non-promoted sources out of `short_term/` into archive.
- Keep `/checkpoint` writing to `short_term/` only.
- Keep `/insights` and `/insights write` unchanged except for not treating archive as input.

## Execution model
Each step maps to one sub-plan in `plans/doing/`. Execute a sub-plan with `/execute-autopilot`.

## Sub-plans
| # | Slug | Summary | Depends on |
|---|------|---------|------------|
| 1 | archive-policy-boundary | Define what gets archived, what gets promoted, and explicit exclusion from recall/insights/save inputs. | - |
| 2 | archive-save-flow | Update `/save` flow and prompts so non-promoted short-term files are archived instead of deleted. | 1 |
| 3 | archive-storage-format | Add archive directory layout, file naming, and cleanup policy for retained drafts. | 1 |

## Constraints / non-goals
- Do not make archive part of recall.
- Do not change long-term promotion rules.
- Do not add hooks, daemons, timers, or persistent state.
- Do not touch Telegram bridge/runtime hooks or unrelated extensions.
- Keep rollback simple and limited to prompts/plan surfaces.

## Progress
- [x] Step 1: Sub-plan — archive-policy-boundary (archive cold-storage boundary and exclusions in prompts/contracts)
- [x] Step 2: Sub-plan — archive-save-flow (reviewed skipped drafts now route to archive; unreviewed stay in short_term)
- [x] Step 3: Sub-plan — archive-storage-format (flat provenance-preserving archive layout and manual cleanup policy)
