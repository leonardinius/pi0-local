---
description: Review short-term memory and manually promote milestone knowledge.
---

Review short-term memory drafts and promote only completed, verified, reusable knowledge to long-term memory.

## Process

### 1. Read Short-Term Files
Read `.md` files in `~/.pi/agent/prusax0/memory/short_term/`.

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
Update `_index.md` if entries changed. Delete promoted short-term files; keep unpromoted drafts if they still need review.

### 6. Report
Briefly tell the user how many short-term files were reviewed and what was promoted or skipped.
