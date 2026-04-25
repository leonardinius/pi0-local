# Investigations

Research results, deep-dive findings, codebase explorations, and analysis outcomes.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.
```

---

## Pi OpenAI Subagent Configuration Review Gaps

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: pi, subagents, openai, workflow

Review/fix findings for `~/.pi/agent/prusax0` subagent setup:
- Critical bug fixed: copied subagent extension passed a temp file path to `--append-system-prompt`; patched it to pass prompt text so agents can see role instructions.
- `/execute` and `/execute-autopilot` now route by role title (`Architect`, `Coder`, `Refactorer`, `Reviewer`) instead of always using `coder`.
- `/execute-autopilot` now runs mutation-capable steps sequentially because this setup has no worktree isolation; parallel is read-only only.
- `coder`/`refactorer` now have explicit tool allowlists: `read,grep,find,ls,bash,edit,write`, preventing recursive `subagent` access.
- Schema cache bootstrapped with empty `schemas.json`/`schemas/_tables.md`; `schema_extract.py` now writes an empty index instead of exiting when no sources are configured.
- Removed remaining Claude-specific prompt/template artifacts found in active commands (`allowed-tools`, `MCP`, `AskUserQuestion`) and cleaned memory template headings that looked like real entries.

---
