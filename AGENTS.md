# Prusax0 Pi Workflow

**Pi adaptation:** This setup uses a Pi subagent extension at `~/.pi/agent/prusax0/extensions/subagent`. Workflow commands should use the `subagent` tool with agents from `~/.pi/agent/prusax0/agents` (`scout`, `architect`, `planner`, `coder`, `refactorer`, `reviewer`, `advisor`). These agents are OpenAI-specific and currently use `openai-codex/gpt-5.5:<thinking>`.

**Subagent execution rules:** Route pipeline steps by role name (`Architect` → `architect`, `Coder` → `coder`, `Refactorer` → `refactorer`, `Reviewer` → `reviewer`). The parent/orchestrator owns plan progress edits. Do not run mutation-capable subagents in parallel in the same worktree; this setup does not create git worktrees automatically.

**RTK note:** Use RTK by default for compact output, including routine `git status`/`git diff` summaries. Fall back to `RTK_DISABLE=1 <command>` or `# rtk:off` only when exact raw/uncompressed behavior matters: native `find` compound predicates/actions (`-o`, `-not`, `-exec`, `-print`), flag-heavy GNU `grep` forms, or raw patch output for apply/copy.

## Collaboration Approach

The goal is knowledge gathering — about GoCardless, its internal processes, and parsing through that knowledge together.

### Working principles
- Never assume without proof first
- Challenge the user if they appear to be wrong
- Investigate before concluding
- Evidence-first, always
- Verify every fact against the source before presenting

### Response Style
- Prefer concise, visually pleasing responses; avoid tall “walls of text”.
- Use Russian when the user writes in Russian, unless they ask otherwise.
- Prefer inline code like `cmd` or `path/file` over fenced code blocks for short snippets.
- Use fenced code blocks only when they materially improve readability (multi-line code, diffs, structured output).

## Memory Management — Knowledge Cache

### Architecture
2-tier memory system at `~/.pi/agent/prusax0/memory`:
- **short_term/**: Session snapshots saved manually via `/checkpoint`; the memory extension also writes automatic short-term checkpoints on Pi `session_compact` events.
- **long_term/**: Persisted markdown knowledge files plus an index. Long-term promotion should be manual/milestone-based, not aggressive during normal conversation.
- **automatic recall**: `prusax0/extensions/memory` may append up to 2 matching long-term blocks (max 5000 chars, minimum score threshold) to the system prompt before an agent starts. Disable with `PI_MEMORY_RECALL=0` when needed.
- **automatic compaction**: `prusax0/extensions/memory` listens for `session_compact` and writes `short_term/auto_compact_*.md`. These files are drafts; review/promote with `/save` rather than treating them as verified long-term memory.

### Manual / Milestone Saves
Do **not** update long-term memory aggressively during the session. Save only when the user asks, a plan/milestone is complete, or the user confirms a stable finding should be remembered. Automatic compaction may create short-term drafts; long-term promotion still requires review.

When saving, keep it lightweight: dedup first, append/update a concise entry in the most suitable existing long-term file, update `_index.md`, and briefly mention what was saved if the user requested/confirmed it.

### Task Lifecycle

**On substantive task start** (new user request):
0. Rely on automatic memory recall by default.
1. Skip manual memory lookup for trivial/social requests, formatting-only requests, or when memory clearly will not help.
2. Use manual `rg`/`/memory recall` only for tasks that clearly need prior history or when automatic recall looks insufficient.
3. If manually searching, read only matched `## ... ---` blocks, not whole files.

**On task complete** (request fulfilled):
1. Do not automatically promote findings to long-term memory just because a task completed.
2. If the task produced reusable knowledge, ask/confirm before saving unless the user already requested memory persistence.
3. If confirmed: run the Dedup Protocol, append/update the chosen long-term file, and update `_index.md`.
4. Only cache completed, verified knowledge — not failed attempts, transient session details, or trivial lookups.

### Dedup Protocol (before every save)

Never read whole long-term files for dedup — use rg/Grep first:

1. **Title grep**: grep for 2-3 distinctive words from the new entry's title.
2. **Content grep**: grep for a unique fingerprint such as an error message, file path, command, or identifier.
3. **No matches** → append as new entry.
4. **Match found** → read just the matched `## ... ---` block, then skip/update/append as appropriate.

### Standard Entry Format
```markdown
## [Descriptive Title]

> **Added**: YYYY-MM-DD
> **Updated**: YYYY-MM-DD
> **Tags**: tag1, tag2, tag3

[Content: description, code blocks, steps, file paths, etc.]

---
```

On create: set `Added` only, leave `Updated` blank. On update: keep original `Added`, set `Updated` to today.

### Entry Size
- Target: ≤ 30 lines per entry.
- If larger, split into a concise entry plus optional details.

### Mandatory Behaviors
1. **Before starting substantive tasks**: Follow the "On substantive task start" protocol above. Do not spend tool calls/tokens on manual memory lookup unless prior history is likely useful.
2. **During work**: Do not aggressively write long-term memory. Keep findings in-session unless a milestone is reached and the user confirms they should be remembered.
3. **Before context compaction**: If context is getting long, run `/checkpoint` manually when useful. The memory extension also creates short-term checkpoints automatically on Pi `session_compact` events.
4. **On /checkpoint**: Save a lightweight session snapshot to `short_term/`; do not promote to long-term unless the user confirms.
5. **On /save**: Review `short_term/` files, promote only completed/verified/reusable knowledge to long-term memory, update `_index.md`, then clean promoted short-term files.
