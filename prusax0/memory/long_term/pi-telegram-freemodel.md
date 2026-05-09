## Pi Free Models Extension

> **Added**: 2026-05-06
> **Updated**: 2026-05-09
> **Tags**: pi, extension, freemodel, cache, summary

`~/.pi/agent/extensions/free-models/index.ts` no longer registers `/freemodel`.

Behavior before removal:
- fetched `https://shir-man.com/api/free-llm/top-models`
- cached JSON at `~/.pi/agent/prusax0/cache/free-models.json`
- showed a short summary and recommendations in the editor widget
- used the normal Pi extension command flow; no Telegram bridge menu/callbacks

---

