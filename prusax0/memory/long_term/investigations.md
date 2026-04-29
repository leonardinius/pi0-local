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
- Removed remaining Claude-specific prompt/template artifacts found in active commands (`allowed-tools`, `MCP`, `AskUserQuestion`) and cleaned memory template headings that looked like real entries.

---

## Work-Pi Telegram Agent Deployment Plan Review

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: pi, telegram, systemd, tmux, deployment

Key preflight findings for deploying the local Pi workflow as a Telegram bot on Ubuntu:
- Decision: install Pi core user-local as `agent` via npm prefix `~/.npm-global` (`/home/agent/.npm-global/bin/pi`); systemd must set PATH explicitly. Install Pi before `pi install`; pin `@llblab/pi-telegram`.
- Portable config patch applied: prompts/AGENTS use `~/.pi/agent/prusax0`, plan scripts derive root from script location, `.gitignore` excludes `telegram.json` and `tmp/`.
- `pi-telegram` is session-local: `/telegram-connect` starts polling only in the current Pi session; service startup should send `/telegram-connect` after setup, and only one session should poll a bot token.
- The current `work-pi.service` shape (`tmux new-session -d` + `RemainAfterExit=yes`) does not monitor Pi/tmux death; use a foreground supervisor loop that starts detached tmux and exits when `tmux has-session` fails.
- Blanket `chmod 600 ~/.pi` breaks executable scripts under `~/.pi/agent/prusax0/scripts`; chmod only secret files (`auth.json`, `telegram.json`, `.env`) or restore script execute bits.
- First Telegram user to `/start` becomes owner, so pair immediately or pre-seed `allowedUserId`.
- Docker group is root-equivalent; adding `agent` to `docker` means Telegram-controlled Pi can effectively root the host. Accept only for a personal MVP box or use rootless/isolated runner.
- `/ping` is not a built-in pi-telegram command; use `/status`, `/telegram-status`, or implement a ping command.

---

## pi-telegram /tgreload — Root Cause and Final Fix

> **Added**: 2026-04-29
> **Tags**: pi, telegram, tgreload, troubleshooting, patch, spawn, timeout

Symptom: `/tgreload` часто падал с `Command failed: ... pi --no-session --offline -p ping`, иногда `killed=true signal=SIGTERM`.

Findings:
- Разные окружения (systemd vs bash) → PATH/WorkingDirectory расходились; иногда pi не тот.
- Smoke вызывался через `execFile` с таймаутом; внутри активной Pi-сессии дочерний процесс стабильно не успевал выйти и получал SIGTERM, хотя «pong» появлялся мгновенно при ручном запуске.

Fix:
- Нормализовали env: фиксированный PATH, абсолютный pi (`~/.npm-global/bin/pi`), `PI_TELEGRAM_AUTOSTART=0`, `PI_OFFLINE=1`, `RTK_DISABLE=1`, `PI_TUI=0`, `PI_MEMORY_RECALL=0`.
- Таймаут smoke → 60s, fallback `cwd` на `$HOME`.
- Критичный шаг: переписали smoke на `spawn` со стримингом и ранним успехом по появлению `pong` в stdout (не ждём полного выхода процесса).

Result: `/tgreload` стабильно проходит: `smoke test passed; reloading`.

Paths: `~/.npm-global/lib/node_modules/@llblab/pi-telegram/lib/runtime.ts` (runPiPingSmokeTest).

---
