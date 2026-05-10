# Prusax0 Archive Storage Format

## Why
Make archive retention auditable and reversible with a simple file layout and cleanup policy.

## What
- Define an `memory/archive/` directory layout.
- Preserve provenance in archived filenames or headers.
- Set a straightforward cleanup policy for retained drafts.
- Keep archive separate from `_insights/`, `short_term/`, and `long_term/`.

## Execution model
Each step maps to one sub-plan in `plans/doing/`. Execute a sub-plan with `/execute-autopilot`.

## Sub-plans
| # | Slug | Summary | Depends on |
|---|------|---------|------------|
| 1 | archive-storage-format | N/A | - |

## Constraints / non-goals
- Do not make archive part of recall.
- Do not make archive a second long-term memory store.
- Do not add hooks, daemons, timers, or persistent state.

## Archive storage format
- `memory/archive/` uses a flat direct-child `.md` file layout. The directory marker is `memory/archive/.gitignore`, which ignores retained drafts by default while keeping the marker trackable.
- Preserve provenance in archived filenames: `YYYYMMDD_HHMMSSZ__{original-short-term-filename}`. The timestamp is the UTC archive time; the suffix is the original short-term basename.
- Archive contents are retained drafts, not a long-term store and not a long-term memory source. Keep `archive/` separate from `short_term/`, `long_term/`, and `_insights/`.
- Manual cleanup only: delete or reorganize retained drafts only after an explicit user request. No runtime auto-archiving, auto-expiry, hooks, daemons, timers, or persistent cleanup state.

## Progress
- [x] Step 1: Sub-plan — archive-storage-format (flat archive layout, provenance-preserving filenames, manual cleanup only)
