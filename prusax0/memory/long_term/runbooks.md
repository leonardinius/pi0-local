# Runbooks

Step-by-step procedures for recurring tasks — incident resolution, debugging procedures, operational workflows.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.
```

---

## Pi Config Permissions Without Breaking Scripts

> **Added**: 2026-04-26
> **Tags**: pi, permissions, secrets, deployment

Do not blanket `chmod 600 ~/.pi` because it removes execute bits from workflow scripts. Use targeted permissions:
```bash
chmod 700 ~/.pi ~/.pi/agent
chmod 600 ~/.pi/agent/auth.json ~/.pi/agent/telegram.json 2>/dev/null || true
find ~/work -type f \( -name '.env' -o -name '.env.*' \) -exec chmod 600 {} \;
chmod 700 ~/.pi/agent/prusax0/scripts/* 2>/dev/null || true
```
Verify with `find ~/.pi/agent/prusax0/scripts -maxdepth 1 -type f -perm -111 -print`.

---

## Work-Pi Sudo MVP Risk Decision

> **Added**: 2026-04-26
> **Tags**: sudo, security, deployment, ssh

Decision for personal MVP: `agent` may have sudo. Install `sudo`, add `agent` to sudo group, and rely on SSH key-only access plus disabled root/password login:
```bash
apt install -y sudo
usermod -aG sudo agent
```
Risk: Telegram-controlled Pi + sudo-capable `agent` is host-admin power. Accept only for personal MVP; keep `PasswordAuthentication no`, `PermitRootLogin no`, and protect Telegram ownership.

---

## Project .env and Gitignore Baseline

> **Added**: 2026-04-26
> **Tags**: gitignore, env, deployment, project

For new Work-Pi projects, ignore real env files but keep examples committed:
```gitignore
.env
.env.*
!.env.example
node_modules/
dist/
build/
```
Set `chmod 600 .env` after creation. Do not ignore `.env.example`; it documents required variables without secrets.

---

## Work-Pi Logs and Health Checks

> **Added**: 2026-04-26
> **Tags**: pi, logs, health, systemd, tmux

Use the right signal for each layer:
- systemd/wrapper: `systemctl status work-pi`, `journalctl -u work-pi -f`
- tmux/Pi TUI: `tmux attach -t work-pi`, `tmux capture-pane -pt work-pi -S -200`
- optional pane stream from wrapper: `tail -f ~/.local/state/work-pi/pane.log`
- Telegram bridge: Telegram `/status`, Pi `/telegram-status`
- Docker apps: `docker ps`, `docker logs -f <container>`
`/ping` is not built into `@llblab/pi-telegram`; use `/status` unless a ping command is added.

---

## Work-Pi Docker MVP Risk Decision

> **Added**: 2026-04-26
> **Tags**: docker, security, deployment, pi

Decision for personal MVP: add `agent` to Docker group and accept root-equivalent risk.
```bash
# after official Docker install
usermod -aG docker agent
reboot
su - agent
docker run hello-world
```
Record this as an explicit risk: Telegram-controlled Pi can run Docker, and Docker group can effectively root the host. Do not use this unchanged for production/secrets-heavy servers.

---

## Pi Telegram Bridge First Setup Order

> **Added**: 2026-04-26
> **Tags**: pi, telegram, deployment, setup

For a systemd/tmux Pi Telegram agent, do setup before enabling auto-start:
1. As `agent`, install config/Pi package, then run `pi` interactively in SSH/tmux.
2. Run `/telegram-setup`, paste bot token, then `/telegram-connect` and `/telegram-status`.
3. Immediately DM the bot `/start`; first user becomes the exclusive owner (`allowedUserId` in `~/.pi/agent/telegram.json`).
4. Stop that manual session cleanly, then enable systemd wrapper that starts `pi '/telegram-connect'`.
5. Do not run two Pi sessions connected to the same bot token; polling is session-local.

---

## Locally Patch Installed pi-telegram Package

> **Added**: 2026-04-28
> **Updated**:
> **Tags**: pi, telegram, extension, deployment

For a no-install local patch to the active npm-installed `@llblab/pi-telegram`, patch files under:
`/home/agent/.npm-global/lib/node_modules/@llblab/pi-telegram`.

Safe workflow used for Syabro fork changes:
1. Clone source to `/tmp`, compare against installed `0.3.0`/upstream commit `f12cd80`.
2. Adapt changes in a temp worktree; do not run `npm install`.
3. Backup installed package first:
   `tar -C ~/.npm-global/lib/node_modules/@llblab -czf ~/.pi/agent/tmp/pi-telegram-0.3.0-backup-$(date +%Y%m%d%H%M%S).tgz pi-telegram`
4. Copy changed source files into the installed package and run `node --experimental-strip-types --check` on them.
5. Running Pi processes keep old extension code until extension reload/session restart; Telegram messages cannot trigger Pi `/reload` unless the bridge explicitly implements it.

---

## Fix pi-telegram /tgreload Handler Wiring

> **Added**: 2026-04-28
> **Updated**:
> **Tags**: pi, telegram, extension, debugging

Symptom after sending Telegram `/tgreload`: Pi status shows `telegram error skipping Telegram update ... after 3 failures: Cannot...`.

Cause: `createTelegramAutoReloadCommandHandler` expects `sendTextReply(message, text)`, but `index.ts` accidentally passed the rendered reply runtime directly, whose signature is `sendTextReply(chatId, replyToMessageId, text)`. That makes `text` undefined at runtime.

Fix in `/home/agent/.npm-global/lib/node_modules/@llblab/pi-telegram/index.ts`:
```ts
sendTextReply: (message, text) =>
  sendTextReply(message.chat.id, message.message_id, text),
```
After patching, reload/restart Pi because running extension code is already loaded.

---

## Work-Pi Docker Project Harness

> **Added**: 2026-04-29
> **Updated**:
> **Tags**: docker, project, env, compose, deployment

Server harness lives at `/home/agent/work/agent/bin/project`; source is tracked as `prusax0/scripts/project` in the Pi config repo. Projects live under `/home/agent/work/projects/<name>` or symlink there via `project init`.

Key commands: `project new NAME [static|node] [PORT]`, `project init NAME [static|node|auto] [PORT] [PATH]`, `project up/down/logs/ps/status/health NAME`. `.env` is chmod `600`, `.env.example` is committed, and generated Compose ports bind to `127.0.0.1` by default.

---

## Pi Telegram Autostart and Smoke Tests

> **Added**: 2026-04-28
> **Tags**: pi, telegram, autostart, env, debugging

Observed behavior and cause
- The Telegram bridge autostarts polling on session start if a bot token is present and PI_TELEGRAM_AUTOSTART is not an explicit "false" value.
- Current logic (index.ts): enabled unless PI_TELEGRAM_AUTOSTART is one of "0", "false", "no" (case-insensitive). PI_OFFLINE is not considered.
- Result: even a quick check like `pi --no-session --offline -p ping` can start Telegram polling in that transient process and interfere with the main bot session (deleteWebhook, polling ownership), unless env is overridden.

Safe ways to run smoke tests/secondary pi invocations
- Always disable Telegram autostart for auxiliary runs: `PI_TELEGRAM_AUTOSTART=0 pi --no-session --offline -p ping`.
- The built-in `/tgreload` smoke test already forces a safe env when it shell-execs Pi: it sets PI_TELEGRAM_AUTOSTART=0 and PI_OFFLINE=1.

Verification
- Main process: `PI_TELEGRAM_AUTOSTART=1 pi` (or set in systemd env) — should own polling.
- Quick test: `PI_TELEGRAM_AUTOSTART=0 pi --no-session --offline -p ping` — should not touch Telegram state.

---

## pi-telegram /tgreload — Debug & Troubleshooting

> **Added**: 2026-04-28
> **Tags**: pi, telegram, debugging, troubleshooting, tgreload

Symptoms
- `/tgreload` отвечает ошибкой или ничего не делает
- В статусе/логах: `telegram error ... skipping Telegram update ...`, `Cannot ...`, или зависание > 15с

Fast checks
- Вручную запусти smoke: `PI_TELEGRAM_AUTOSTART=0 PI_OFFLINE=1 pi --no-session --offline -p ping` — должен дать `Pong. How can I help?`
- Убедись, что в `index.ts` правильно проброшен `sendTextReply(message, text)` для автоперезагрузки
- Проверь, что только один процесс Pi владеет polling этим токеном бота

Common causes
- Неправильная передача аргументов в `sendTextReply` (текст undefined)
- Автоподъём polling во вспомогательном процессе во время smoke → конфликт с основным процессом
- Медленный старт/IO → smoke таймаут 15с не успевает
- Сетевая блокировка до `api.telegram.org` или нестабильный DNS

Logs & signals
- `journalctl -u work-pi -f` или `tmux capture-pane -pt work-pi -S -200`
- `/status` в Telegram; ищи "telegram error"
- `curl https://api.telegram.org/bot$BOT_TOKEN/getMe`

---

## pi-telegram /tgreload tmux Fallback Controls

> **Added**: 2026-05-01
> **Tags**: pi, telegram, tgreload, tmux, env

When reload routing is flaky, use/keep tmux fallback enabled in `pi-telegram`: after smoke test it sends reload via `tmux send-keys`.
- Target override: `PI_TELEGRAM_TMUX_TARGET` (default `work-pi:0.0`)
- Command override: `PI_TELEGRAM_TMUX_RELOAD_CMD` (default `/telegram-tgreload-now`)
- Expected Telegram signal: `tgreload: tmux reload ok` (or `failed` with error)

Quick checks: verify target pane exists (`tmux ls`), and confirm single active polling owner before testing `/tgreload`.

---

## Pi Telegram Projects Publish Model (Shared Tunnel)

> **Added**: 2026-05-01
> **Tags**: telegram, projects, publish, env, cloudflare, caddy

Current model uses shared tunnel + per-app hostnames.
- Base domain source: `PI_PROJECTS_PUBLIC_BASE_URL` or `~/.pi/agent/projects.json` (`publicBaseUrl`)
- Publish state: `<project>/.expose.yml` (`enabled: true|false`)
- URL format: `https://<app>-<base>/`
- App auth/source vars in `.env`: `APP_PUBLIC_URL` (optional override), `APP_BASIC_AUTH_USER`, `APP_BASIC_AUTH_PASS`

Validation pattern for published apps: `no auth -> 401`, `with auth -> 200` on public URL.

---

## pi-telegram /quit — Handler Wiring and Fail Feedback

> **Added**: 2026-05-01
> **Tags**: pi, telegram, quit, tmux, debugging

Symptom: Telegram `/quit` looked ignored (no shutdown message, no session kill).

Root cause: command action `quit` existed, but `handleQuit` was not passed into `createTelegramCommandHandler(...)` inside `createTelegramCommandHandlerTargetRuntime`, so runtime had no quit handler bound.

Fix:
- In `lib/commands.ts`, wire `handleQuit: deps.handleQuit` in command handler construction.
- Keep user-visible ack before shutdown attempt: `Принял йаду ☠️ Умираю красиво...`.
- Add failure feedback on kill error: `Не смог умереть с первого раза: <error>`.

Operational note: after patching extension files, reload the active Pi runtime process; service wrapper restart alone may not replace already-running tmux Pi process code.

---
