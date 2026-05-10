# Patterns

Code patterns, conventions, architecture knowledge, and design decisions discovered through work.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.

---

## Insights Flow Should Stay Prompt-Driven Unless Runtime Is Explicitly Added

> **Added**: 2026-05-10
> **Updated**:
> **Tags**: pi, insights, memory, prompts, workflow

The `/insights` work can be safely split into prompt/template surfaces before any runtime command exists. In this case, the plan completed with:
- `prompts/insights.md` defining read-only analysis and optional `write`
- `prompts/checkpoint.md` adding append-only unconfirmed retro drafts
- `prompts/save.md` explicitly ignoring `memory/_insights/`
- `memory/_insights/.gitignore` keeping reports out of git
- `AGENTS.md` carrying the soft in-session nudge rule

That is useful when rollback needs to be simple and the runtime command can wait for a later step.

---
