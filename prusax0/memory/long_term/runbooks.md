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
