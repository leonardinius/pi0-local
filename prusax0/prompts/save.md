---
description: Consolidate short-term memory into long-term knowledge cache. This is the end-of-day memory save.
---

Consolidate short-term memory into long-term knowledge cache. This is the end-of-day memory save.

## Process

### 1. Read All Short-Term Files
Read every `.md` file in `/Users/leo/.pi/agent/prusax0/memory/short_term/`.

### 2. Read Long-Term State
Read `/Users/leo/.pi/agent/prusax0/memory/long_term/_index.md` for entry counts and tag cloud overview. Do NOT read category files -- the dedup protocol in step 4 handles per-entry checking via Grep.

### 3. Extract & Route Knowledge

For each short-term file, extract ALL reusable knowledge and route it to the correct category file:

| Knowledge Type | Target File |
|---|---|
| Working queries (SQL, BigQuery, PromQL, JQL, CQL) | `queries.md` |
| Debugging solutions, incident resolutions, step-by-step fixes | `runbooks.md` |
| Research results, codebase explorations, investigation findings | `investigations.md` |
| Code patterns, conventions, architecture decisions | `patterns.md` |
| Service-specific quirks, configs, gotchas, undocumented behavior | `services.md` |
| CLI commands, deployment tricks, tool workflows | `tools.md` |

### CRITICAL RULES for extraction:
- **PRESERVE specific details**: resource IDs, table names, file paths, error messages, exact commands, query text, stack traces. These are the VALUE -- stripping them makes entries useless.
- **DO NOT discard "session-specific context"** if it contains reusable knowledge. A query used to investigate today's incident is still a working query tomorrow.
- Skip only: greetings, meta-conversation about the session itself, truly one-time context with no reuse value.
- Information already in existing long-term entries should be used to UPDATE those entries, not duplicated.

### 4. Write to Category Files (with Dedup)

For each piece of knowledge, run the **3-step dedup protocol** before writing:

1. **Title grep**: Grep target file for 2-3 distinctive words from the new entry's title
2. **Content grep**: Grep target file for a unique fingerprint (table name, error message, file path, or command)
3. **Decision**:
   - **No matches** -> Append using the standard entry format:
     ```markdown
     ## [Descriptive Title]

     > **Added**: YYYY-MM-DD
     > **Tags**: tag1, tag2, tag3

     [Content: description, code blocks, steps, file paths, etc.]

     ---
     ```
   - **Match found** -> Read just the matched `## ... ---` block, then:
     - Same topic + same info -> **skip** (already cached)
     - Same topic + new info -> **update** (merge content, refresh date, add tags)
     - Different topic despite keyword overlap -> **append** as new entry

**Important**: Never read the entire category file for dedup -- use Grep only.

### 4.5. Split Oversized Files

For each category file, count entries (count `## ` headings at depth 2):
- If <= 50 -> no action
- If > 50 -> split:
  1. Identify the most frequent primary tag across entries
  2. Create sub-files: `{category}_{tag}.md` for each major tag group
  3. Move entries to their sub-files
  4. Replace the original file content with a routing index listing sub-files
  5. Entries that don't fit a clear tag go to `{category}_general.md`
  6. Update `_index.md` category table to include sub-files

### 4.6. Purge Stale Entries

For entries older than 6 months with no updates:
- If the entry references specific file paths, check if those paths still exist
- If paths are gone and the knowledge is likely outdated -> remove the entry
- If unsure -> keep it (conservative)

### 5. Rebuild Index

Completely rewrite `/Users/leo/.pi/agent/prusax0/memory/long_term/_index.md`:
- Update "Last updated" date and "Total entries" count
- Update the category table with current entry counts and last-updated dates per file
- Rebuild the tag cloud: collect all `Tags:` values across all category files, alphabetize, deduplicate
- Update the quick lookup table if new common patterns emerge

### 6. Clean Short-Term
Delete ALL `.md` files from `/Users/leo/.pi/agent/prusax0/memory/short_term/` (keep `.gitkeep`).

### 7. Report
Tell the user:
- How many short-term files processed
- How many entries created/updated per category file
- New tags added to the tag cloud
- Total entry count across all categories
