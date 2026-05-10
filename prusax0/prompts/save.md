---
description: Review short-term memory and manually promote milestone knowledge.
---

Review short-term memory drafts and promote only completed, verified, reusable knowledge to long-term memory.

## Process

### 1. Read Short-Term Files
Read direct-child `.md` files in `~/.pi/agent/prusax0/memory/short_term/` only.

Explicitly ignore `~/.pi/agent/prusax0/memory/archive/`: do not read, promote, delete, move, summarize, or index archived material as `/save` input.

Explicitly ignore `~/.pi/agent/prusax0/memory/_insights/`. `/insights write` reports are non-archival and separate from `/save`; do not read, promote, delete, move, summarize, or index them.

### 2. Decide What Is Worth Keeping
Promote only stable knowledge that is likely useful later. Skip greetings, transient session details, failed attempts, and meta-conversation.

### 3. Dedup Before Writing
Use rg/Grep before reading whole files:
- title keywords from the proposed entry
- a unique fingerprint like an error message, file path, command, or identifier

If an existing entry matches, read only that `## ... ---` block and skip/update/append as appropriate.

### 4. Write Concise Long-Term Entries
Append/update the most suitable existing long-term file under `~/.pi/agent/prusax0/memory/long_term/`. Keep entries concise and use the standard format:

```markdown
## Title

> **Added**: YYYY-MM-DD
> **Updated**:
> **Tags**: tag1, tag2

Content.

---
```

### 5. Update Index and Clean Up
Update `_index.md` if entries changed.

For each short-term source file, choose one explicit outcome:
- Promoted: remove the reviewed source file from `short_term/` after the long-term entry and `_index.md` updates are complete.
- Reviewed and explicitly skipped/rejected: Move reviewed and explicitly skipped short-term drafts to `~/.pi/agent/prusax0/memory/archive/` using a flat direct-child layout and the filename shape `YYYYMMDD_HHMMSSZ__{original-short-term-filename}` to preserve provenance. The timestamp is the UTC archive time; the suffix is the original short-term basename. Preserve the source file contents unchanged. If a timestamp collision occurs, add a simple suffix such as `_1` before `.md`. This is an output-only cleanup step; it does not make archive material `/save` input.
- Not reviewed: Leave unreviewed short-term files in `short_term/`.

Do not auto-archive files that were not reviewed or did not receive an explicit skipped/rejected outcome. Archive cleanup is manual cleanup only: delete or reorganize archived drafts only after an explicit user request. Do not clean up or modify `_insights/` reports.

### 6. Report
Briefly tell the user how many short-term files were reviewed, what was promoted, what was archived as explicitly skipped/rejected, and any unreviewed files left in `short_term/`.
