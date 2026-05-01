# Patterns

Code patterns, conventions, architecture knowledge, and design decisions discovered through work.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.
```

---

## Pi Memory Management Should Use a Hybrid Hook Model

> **Added**: 2026-04-26
> **Tags**: pi, memory, hooks, workflow

For Pi, keep semantic long-term memory extraction instruction-driven/manual, but move mechanical triggers into an extension. Implemented at `~/.pi/agent/prusax0/extensions/memory/index.ts` and enabled in `~/.pi/agent/settings.json`. Hooks: `before_agent_start` for bounded memory recall from `long_term`, `session_compact` for short-term auto-checkpoints, and `session_shutdown` for save reminders. Env toggles: `PI_MEMORY_RECALL=0`, `PI_MEMORY_COMPACTION_CHECKPOINT=0`, `PI_MEMORY_RECALL_BLOCKS`, `PI_MEMORY_RECALL_CHARS`. Avoid fully automatic long-term writes from hooks unless gated by review because they create low-signal/duplicated memory and need semantic judgement.

---

## User Prefers Compact Low-Height Responses

> **Added**: 2026-04-28
> **Updated**: 2026-04-28
> **Tags**: response-style, formatting, thinking-mode, pi

User prefers concise Russian responses with compact rendering, but still wants visible thinking-mode structure when useful. Keep reasoning/plan/checks brief, use short bullets and inline commands where possible, and avoid unnecessarily tall code blocks or long paragraphs.

---

## Telegram bridge ACK behavior (code-level)

> **Added**: 2026-05-01
> **Tags**: telegram, bridge, ack, pi-telegram

`pi-telegram` может отправлять быстрый текстовый ACK на уровне бриджа до LLM-обработки. Это не поведение модели и не должно храниться как пользовательский preference-паттерн.

Текущее место в коде: ` /home/agent/work/pi-telegram/index.ts ` — вызов `sendTextReply(..., "🫡 Принял, работаем.")` перед enqueue.

---
