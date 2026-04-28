# Runbooks

Step-by-step procedures for recurring tasks — incident resolution, debugging procedures, operational workflows.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.
```

---

## Work-Pi Node and User-Local Pi Install

> **Added**: 2026-04-28
> **Tags**: node, pi, npm, deployment, work-pi

On Ubuntu Work-Pi, install NodeSource Node 22 as root, then Pi core as `agent` with user-local npm prefix:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
sudo -u agent -H bash -lc 'mkdir -p ~/.npm-global && npm config set prefix ~/.npm-global'
sudo -u agent -H bash -lc 'grep -q "npm globals" ~/.profile || printf "\n# user-local npm globals\nexport PATH=\"$HOME/.npm-global/bin:$PATH\"\n" >> ~/.profile'
sudo -u agent -H bash -lc 'export PATH="$HOME/.npm-global/bin:$PATH"; npm install -g @mariozechner/pi-coding-agent@0.70.2'
```
Verify: `node -v`, `npm -v`, and as agent `which pi` -> `/home/agent/.npm-global/bin/pi`, `pi --version` -> `0.70.2`.

---

## Work-Pi 2G Swap Setup

> **Added**: 2026-04-27
> **Tags**: swap, ubuntu, deployment, work-pi

For ~4GB Ubuntu Work-Pi hosts with no swap:
```bash
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
grep -qE '^\s*/swapfile\s+' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
printf 'vm.swappiness=10\n' >/etc/sysctl.d/99-work-pi.conf
sysctl --system
```
Verify: `free -h` shows ~2Gi swap, `swapon --show` has `/swapfile`, `cat /proc/sys/vm/swappiness` is `10`.

---

## Work-Pi SSH Bootstrap and Hardening Checklist

> **Added**: 2026-04-27
> **Tags**: ssh, sudo, deployment, security

Safe order for Work-Pi SSH bootstrap:
1. Create `agent`, add sudo if accepted, and install `/etc/sudoers.d/90-agent-nopasswd`; validate with `visudo -c`.
2. Copy root `authorized_keys` to `/home/agent/.ssh/authorized_keys` with `700` dir and `600` file ownership `agent:agent`.
3. Before hardening, verify from a separate local terminal: `ssh -i ~/.ssh/id_ed25519_remote_pi -o IdentitiesOnly=yes agent@HOST 'whoami; groups; sudo -n true && echo sudo-ok'`.
4. Only then set `PermitRootLogin no`, `PasswordAuthentication no`, `PubkeyAuthentication yes`, run `sshd -t`, and `systemctl restart ssh`.
5. Confirm root fails with `BatchMode=yes` and agent still works. Keep the original root session open until both tests pass.

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

## RTK Deb Fails on Older Ubuntu Due to libc6 Dependency

> **Added**: 2026-04-28
> **Updated**: 2026-04-28
> **Tags**: rtk, ubuntu, libc6, arm64, deployment

If `sudo apt install ./rtk_0.37.2-1_amd64.deb` fails with `Depends: libc6:amd64 (>= 2.39)`, use a release tarball instead and match `uname -m`. For `x86_64`: `rtk-x86_64-unknown-linux-musl.tar.gz`. For `aarch64`/ARM64: `rtk-aarch64-unknown-linux-gnu.tar.gz`; using x86_64 on ARM causes `Exec format error`. Install with `tar -xzf ... && sudo install -m 0755 rtk /usr/local/bin/rtk`, then verify `rtk --version && which rtk`; continue `rtk config --create && rtk telemetry disable && rtk gain` as `agent`.

---
