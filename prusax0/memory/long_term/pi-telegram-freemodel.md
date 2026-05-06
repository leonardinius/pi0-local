## Pi Free Models Extension

> **Added**: 2026-05-06
> **Tags**: pi, extension, freemodel, cache, summary

`~/.pi/agent/extensions/free-models/index.ts` registers `/freemodel` as a standard Pi extension.

Behavior:
- fetches `https://shir-man.com/api/free-llm/top-models`
- caches JSON at `~/.pi/agent/prusax0/cache/free-models.json`
- shows a short summary and recommendations in the editor widget
- uses the normal Pi extension command flow; no Telegram bridge menu/callbacks

---

