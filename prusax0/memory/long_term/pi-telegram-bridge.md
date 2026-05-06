## Pi-Telegram Bridge Project Structure

> **Added**: 2026-05-01
> **Updated**: 2026-05-01
> **Tags**: pi-telegram, bridge, project-structure, paths

`pi-telegram` is a **separate bridge project** (not part of `~/.pi/agent/prusax0/` workspace):
- **Repo location**: `/home/agent/work/pi-telegram/` (local worktree)
- **Purpose**: Telegram DM → pi session frontend (extensions, model controls, streaming, etc.)
- **Key files**: `index.ts` (entrypoint), `lib/*.ts` (domain modules), `AGENTS.md` (conventions)
- **Plans**: Should NOT live in repo; plans belong in `~/.pi/agent/prusax0/plans/`
- **Relation to prusax0**: The bridge is an installed pi extension, but developed independently

**Completed work**: `/freemodel` command (see `pi-telegram-freemodel.md` in plans/done)

---

