# Prusax0 Pi Workflow

These global instructions were initialized from `~/Downloads/claude` for Pi. Saved memories from that source were intentionally ignored; the memory cache under `~/.pi/agent/prusax0/memory` starts fresh.

**Pi adaptation:** This setup uses a Pi subagent extension at `~/.pi/agent/prusax0/extensions/subagent`. Workflow commands should use the `subagent` tool with agents from `~/.pi/agent/prusax0/agents` (`scout`, `architect`, `planner`, `coder`, `refactorer`, `reviewer`, `advisor`). These agents are OpenAI-specific and currently use `openai-codex/gpt-5.5:<thinking>`. Use manual `/checkpoint` and `/save`; no automatic Claude Code hooks are installed.

**Subagent execution rules:** Route pipeline steps by role name (`Architect` → `architect`, `Coder` → `coder`, `Refactorer` → `refactorer`, `Reviewer` → `reviewer`). The parent/orchestrator owns plan progress edits. Do not run mutation-capable subagents in parallel in the same worktree; this setup does not create git worktrees automatically.

**RTK note:** The RTK extension may rewrite `bash` commands for compact output. Use `RTK_DISABLE=1 <command>` or append `# rtk:off` when exact raw command behavior/output matters, especially while debugging test failures.

## Collaboration Approach

The goal is knowledge gathering — about GoCardless, its internal processes, and parsing through that knowledge together.

### Working principles
- Never assume without proof first
- Challenge the user if they appear to be wrong
- Investigate before concluding
- Evidence-first, always
- Verify every fact against the source before presenting

## Schema Cache — Database Table Lookups

When writing SQL, BigQuery, or database queries, **look up table schemas before guessing column names**.

### Schema files location
`/Users/leo/.pi/agent/prusax0/schemas/`

### How to look up a table

1. **Find which schema file has the table**:
   ```
   Grep pattern="^TABLE_NAME -> " path="/Users/leo/.pi/agent/prusax0/schemas/_tables.md"
   ```

2. **Read the table's columns**:
   ```
   Grep pattern="^## TABLE_NAME$" path="/Users/leo/.pi/agent/prusax0/schemas/SCHEMA_ID.md" -A 1
   ```

3. **For BigQuery queries** with dataset prefixes:
   - Grep `_tables.md` for the dataset prefix to find the schema file
   - Then look up the table name in that schema file

### When to look up schemas
- Before writing any SQL/BQ query that references specific columns
- When a query error mentions "column not found" or wrong column names
- When unsure about column types

### Refresh
Run `/schema-refresh` to re-extract from structure.sql files. If the cache has not been bootstrapped yet, run `/schema-refresh --discover /path/to/workspace` first.

## Memory Management — Knowledge Cache

### Architecture
2-tier memory system at `/Users/leo/.pi/agent/prusax0/memory`:
- **short_term/**: Session snapshots saved manually via `/checkpoint` (no automatic Pi hook is installed yet)
- **long_term/**: Knowledge cache — 6 category files + index, persisted across sessions

### Knowledge Cache Categories

| File | Stores |
|------|--------|
| `queries.md` | Working SQL, BigQuery, PromQL, JQL, CQL queries |
| `runbooks.md` | Incident resolution, debugging procedures, operational workflows |
| `investigations.md` | Research results, deep-dive findings, codebase explorations |
| `patterns.md` | Code patterns, conventions, architecture decisions |
| `services.md` | Per-service gotchas, configs, quirks |
| `tools.md` | CLI commands, deployment workflows, useful shortcuts |
| `_index.md` | Category table, tag cloud, quick lookup |

### Proactive Save Triggers
Save completed knowledge to the appropriate long-term file **as you work** — do not wait for `/checkpoint` or `/save`:

| When this happens... | Save to... |
|----------------------|------------|
| Working query found/built (SQL, JQL, BigQuery, etc.) | `queries.md` |
| Bug or incident resolved with clear steps | `runbooks.md` |
| Investigation completed with findings | `investigations.md` |
| Non-obvious code pattern or gotcha discovered | `patterns.md` or `services.md` |
| Useful CLI command or workflow discovered | `tools.md` |

### How to Proactive-Save
1. **Dedup check**: Run the Dedup Protocol (below) against the target file
2. **If new**: Append a new entry using the standard format (## Title, > Added, > Tags, content, ---)
3. **If exists**: Update the existing entry (refresh date, add new info)
4. **Update `_index.md`**: Increment entry count, add new tags to tag cloud
5. **Silent**: Do NOT announce saves to the user — just do it

### Task Lifecycle

**On task start** (new user request):
1. Extract 2-3 topic keywords from the request
2. Grep `long_term/*.md` for `Tags:.*keyword` (parallel greps for each keyword)
3. If no tag matches: broaden to `Grep pattern="keyword"` across `long_term/*.md`
4. If matches found: read only the matched `## ... ---` blocks (not the whole file). Use cached knowledge instead of re-investigating.
5. No matches at all? Proceed normally — no need to read any category files.

**On task complete** (request fulfilled):
1. Did this task produce a working query, resolution, finding, pattern, or useful command?
2. If yes: run the Dedup Protocol (below) against the target category file
3. Append new entry or update existing. Update `_index.md`.
4. Only cache completed, verified knowledge — not failed attempts or trivial lookups.

### Dedup Protocol (before every save)

Never read the entire category file for dedup — use rg or Grep only:

1. **Title grep**: Grep target file for 2-3 distinctive words from the new entry's title
2. **Content grep**: Grep for a unique fingerprint (table name, error message, file path, or command)
3. **No matches** → append as new entry
4. **Match found** → Read just the matched `## ... ---` block, then:
   - Same topic + same info → **skip** (already cached)
   - Same topic + new info → **update** (merge content, refresh date, add tags)
   - Different topic despite keyword overlap → **append** as new entry

### File Splitting (managed by /save)

- Threshold: **50 entries** per category file
- When `/save` detects a file exceeds 50 entries, split by most frequent primary tag
- Example: `investigations.md` → `investigations_payments-service.md` + `investigations_frontier.md` + `investigations_general.md`
- The original file becomes a routing index listing sub-files
- `_index.md` tracks all sub-files in the category table
- Grep still works across all files (`long_term/*.md`) regardless of splits

### New Category Creation

If knowledge doesn't fit any existing category AND no keyword matches across all `long_term/*.md`:
1. Create a new `{topic}.md` file in `long_term/` with the standard header
2. Add the entry using standard format
3. Update `_index.md` category table with the new file

### Standard Entry Format
```markdown
## [Descriptive Title]

> **Added**: YYYY-MM-DD
> **Updated**: YYYY-MM-DD
> **Tags**: tag1, tag2, tag3

[Content: description, code blocks, steps, file paths, etc.]

---
```

On create: set `Added` only, leave `Updated` blank. On update: keep original `Added`, set `Updated` to today. Purge (step 4.6 of `/save`) checks `Updated` first, then `Added` if no `Updated`.

### Entry Size
- Target: ≤ 30 lines per entry
- If larger, split into a concise entry (core query/command/pattern) + a detailed entry that references it

### Tag Conventions
- Lowercase, kebab-case: `payments-service`, `sepa`, `faster-payments`
- Canonical service names: `payments-service`, `frontier`, `nexus`, `open-banking-gateway`
- Scheme names: `sepa`, `ach`, `bacs`, `becs`, `pad`, `autogiro`, `betalingsservice`, `payto`
- Generic: `sql`, `debugging`, `deployment`, `grpc`, `pubsub`, `migration`
- Max 5 tags per entry — pick the most distinctive

### Mandatory Behaviors
1. **Before starting any task**: Run the "On task start" protocol above.
2. **During work**: Proactive-save completed artifacts immediately — only verified knowledge, not in-progress speculation.
3. **Before context compaction**: If context is getting long, run `/checkpoint` manually to save important session context to `short_term/`; no automatic PreCompact hook is installed in Pi yet.
4. **On /checkpoint**: Save a comprehensive session snapshot to `short_term/`, plus proactive-save any completed discoveries to the appropriate long-term category files.
5. **On /save**: Consolidate all `short_term/` files into long-term category files, rebuild `_index.md`, then clean `short_term/`.
