# Prusax0 Archive Policy Boundary

## Why
Define a cold-storage boundary for `memory/archive/` so unpromoted short-term material can be retained without affecting recall or promotion paths.

## What
- Exclude `memory/archive/` from automatic recall.
- Exclude `memory/archive/` from `/save` and `/insights` input scanning.
- Keep `/checkpoint` and auto-compaction writing only to `short_term/`.
- Allow archive only as an explicit output target after review.

## Execution model
Each step maps to one sub-plan in `plans/doing/`. Execute a sub-plan with `/execute-autopilot`.

## Sub-plans
| # | Slug | Summary | Depends on |
|---|------|---------|------------|
| 1 | archive-policy-boundary | N/A | - |

## Constraints / non-goals
- Do not make archive part of recall.
- Do not let archive feed `/save` review input.
- Do not add hooks, daemons, timers, or persistent state.

## Progress
- [x] Step 1: Sub-plan — archive-policy-boundary (archive excluded from recall, /save, /insights; /checkpoint stays in short_term)
