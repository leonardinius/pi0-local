# Work Pi Telegram Agent Deployment

## Why

Set up a personal Ubuntu server that runs the existing Pi workflow through Telegram, with the same local agents, prompts, RTK integration, and tmux-based observability. The MVP should work first, but avoid known footguns around path portability, systemd/tmux monitoring, permissions, Telegram pairing, and Docker/sudo risk.

## What

Deploy a single-user `agent` account on Ubuntu with:
- user-local Pi core at `/home/agent/.npm-global/bin/pi`
- portable Pi config cloned to `~/.pi/agent`
- `@llblab/pi-telegram@0.3.0`
- RTK `0.37.2` installed from official release artifact
- systemd wrapper that monitors Pi lifetime while keeping tmux
- Telegram bridge paired to one owner
- Docker and sudo enabled for MVP with explicit accepted risk
- logs/health checks for systemd, tmux, Telegram, and Docker

## Decisions / Risk Acceptance

- `agent` has sudo for MVP. Risk: Telegram-controlled Pi can become host admin.
- `agent` is in Docker group for MVP. Risk: Docker group is root-equivalent.
- This plan is for a personal single-user MVP server, not a production/secrets-heavy host.
- Only one Pi session may poll one Telegram bot token.
- No blanket `chmod 600 ~/.pi`; secret files only.
- No `rtk init` for Pi; the Pi RTK extension already injects guidance and rewrites bash via `rtk rewrite`.

## Acceptance Criteria

- `ssh agent@SERVER_IP` works with key auth before root/password SSH is disabled.
- `pi --version` as `agent` returns `0.70.2` from `/home/agent/.npm-global/bin/pi`.
- `~/.pi/agent` is cloned from `git@github.com:leonardinius/pi0-local.git` and contains portable config.
- `pi --list-models openai-codex` works and includes `gpt-5.5`.
- `rtk --version` returns `rtk 0.37.2`; `rtk gain` runs as `agent`.
- `/telegram-setup`, `/telegram-connect`, `/telegram-status`, and Telegram `/status` work.
- `~/.pi/agent/telegram.json` exists with `0600` permissions and correct owner pairing.
- `systemctl is-active work-pi` is active and `tmux has-session -t work-pi` succeeds.
- Killing/quitting Pi inside tmux causes systemd to restart the service.
- `docker run hello-world` works as `agent` after Docker setup/reboot.
- Health/log commands documented in this plan return useful output.

## Steps

1. Bootstrap Ubuntu user and base packages.
2. Configure SSH key access for `agent`; verify login before SSH hardening.
3. Configure optional swap for low-memory host.
4. Install Node 22 and user-local Pi core under `agent`.
5. Clone portable Pi config repo to `~/.pi/agent` and verify OpenAI Codex auth/model access.
6. Install RTK v0.37.2 from official release artifact and configure telemetry off.
7. Install pinned Telegram Pi package.
8. Manually run Telegram setup/pairing before enabling systemd.
9. Apply targeted secret permissions without breaking workflow scripts.
10. Configure tmux extended keys/history.
11. Add `work-pi-run` wrapper and `work-pi.service`; verify systemd monitors tmux/Pi lifetime.
12. Configure firewall.
13. Install Docker, add `agent` to docker group, reboot, and verify.
14. Record project `.gitignore` / `.env` baseline.
15. Verify logs and health checks.

## Implementation Details

### 0. Local preflight

```bash
cd ~/.pi/agent
git status
git diff
git add .
git commit -m "Make Pi config portable for work-pi server"
git push
```

### 1. Bootstrap

```bash
apt update
apt install -y tmux git curl ca-certificates gnupg ufw sudo
adduser agent
usermod -aG sudo agent
```

### 2. SSH setup and hardening

```bash
mkdir -p /home/agent/.ssh
cp /root/.ssh/authorized_keys /home/agent/.ssh/
chown -R agent:agent /home/agent/.ssh
chmod 700 /home/agent/.ssh
chmod 600 /home/agent/.ssh/authorized_keys
```

Verify first:

```bash
ssh agent@SERVER_IP
```

Then set:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Apply:

```bash
sshd -t
systemctl restart ssh
```

### 3. Swap for small hosts

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
free -h
swapon --show
```

### 4. Node and Pi core

As root:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
apt install -y nodejs
node -v
npm -v
which node
```

As `agent`:

```bash
su - agent
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
cat >> ~/.profile <<'EOF'

# user-local npm globals
export PATH="$HOME/.npm-global/bin:$PATH"
EOF
. ~/.profile
npm install -g @mariozechner/pi-coding-agent@0.70.2
which pi
pi --version
```

Expected:

```text
/home/agent/.npm-global/bin/pi
0.70.2
```

### 5. Clone Pi config

```bash
su - agent
ssh -T git@github.com
mkdir -p ~/.pi
git clone git@github.com:leonardinius/pi0-local.git ~/.pi/agent
pi --version
pi --list-models openai-codex
```

If auth is missing:

```bash
pi
/login
```

### 6. RTK

Check CPU architecture first. Prefer tarballs because the `.deb` can require `libc6 >= 2.39` and fail on older Ubuntu releases.

For x86_64/amd64:

```bash
cd /tmp
curl -fLO https://github.com/rtk-ai/rtk/releases/download/v0.37.2/rtk-x86_64-unknown-linux-musl.tar.gz
tar -xzf rtk-x86_64-unknown-linux-musl.tar.gz
sudo install -m 0755 rtk /usr/local/bin/rtk
rtk --version
which rtk
```

For arm64/aarch64:

```bash
cd /tmp
curl -fLO https://github.com/rtk-ai/rtk/releases/download/v0.37.2/rtk-aarch64-unknown-linux-gnu.tar.gz
tar -xzf rtk-aarch64-unknown-linux-gnu.tar.gz
sudo install -m 0755 rtk /usr/local/bin/rtk
rtk --version
which rtk
```

As `agent`:

```bash
rtk config --create
rtk telemetry disable
rtk gain
```

### 7. Telegram package

```bash
su - agent
. ~/.profile
pi install npm:@llblab/pi-telegram@0.3.0
pi list
```

If `settings.json` changed and should be tracked:

```bash
cd ~/.pi/agent
git status
git add settings.json
git commit -m "Install pi telegram package"
git push
```

### 8. Manual Telegram setup and pairing

```bash
su - agent
cd ~/work
pi
```

Inside Pi:

```text
/telegram-setup
/telegram-connect
/telegram-status
```

Immediately DM bot:

```text
/start
/status
```

Check:

```bash
ls -l ~/.pi/agent/telegram.json
```

Expected:

```text
-rw------- agent agent ...
```

Before enabling systemd:

```text
/telegram-disconnect
/quit
```

### 9. Secret permissions

```bash
chmod 700 ~/.pi ~/.pi/agent
chmod 600 ~/.pi/agent/auth.json 2>/dev/null || true
chmod 600 ~/.pi/agent/telegram.json 2>/dev/null || true
find ~/work -type f \( -name '.env' -o -name '.env.*' \) -exec chmod 600 {} \;
chmod 700 ~/.pi/agent/prusax0/scripts/* 2>/dev/null || true
find ~/.pi/agent/prusax0/scripts -maxdepth 1 -type f -perm -111 -print
```

### 10. tmux config

```bash
cat > ~/.tmux.conf <<'EOF'
set -g extended-keys on
set -g extended-keys-format csi-u
set -g history-limit 100000
EOF

tmux -V
```

### 11. systemd + tmux monitor

Create wrapper:

```bash
sudo -u agent mkdir -p /home/agent/work/agent/bin
nano /home/agent/work/agent/bin/work-pi-run
```

```bash
#!/usr/bin/env bash
set -euo pipefail

SESSION=work-pi
WORKDIR=/home/agent/work
STATE_DIR=/home/agent/.local/state/work-pi

export HOME=/home/agent
export PATH=/home/agent/.npm-global/bin:/usr/local/bin:/usr/bin:/bin
export LANG=C.UTF-8
export LC_ALL=C.UTF-8
export TERM=xterm-256color

mkdir -p "$WORKDIR" "$STATE_DIR"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "killing stale tmux session: $SESSION"
  tmux kill-session -t "$SESSION"
fi

echo "starting pi in tmux: $SESSION"

tmux new-session -d -s "$SESSION" -c "$WORKDIR" \
  "exec pi '/telegram-connect'"

tmux set-window-option -t "$SESSION":0 remain-on-exit off || true
tmux pipe-pane -t "$SESSION" -o "cat >> $STATE_DIR/pane.log" || true

while tmux has-session -t "$SESSION" 2>/dev/null; do
  sleep 2
done

echo "tmux session ended; systemd should restart"
exit 1
```

Permissions:

```bash
chmod 755 /home/agent/work/agent/bin/work-pi-run
chown agent:agent /home/agent/work/agent/bin/work-pi-run
```

Unit file:

```bash
nano /etc/systemd/system/work-pi.service
```

```ini
[Unit]
Description=Work Pi Telegram Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=agent
Group=agent
WorkingDirectory=/home/agent/work

Environment=HOME=/home/agent
Environment=PATH=/home/agent/.npm-global/bin:/usr/local/bin:/usr/bin:/bin
Environment=LANG=C.UTF-8
Environment=LC_ALL=C.UTF-8
Environment=TERM=xterm-256color
Environment=XDG_CONFIG_HOME=/home/agent/.config
Environment=XDG_DATA_HOME=/home/agent/.local/share

ExecStart=/home/agent/work/agent/bin/work-pi-run
ExecStop=-/usr/bin/tmux kill-session -t work-pi

Restart=always
RestartSec=5
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
systemctl daemon-reload
systemctl enable --now work-pi
```

### 12. Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw enable
ufw status
```

### 13. Docker

Install Docker using official Docker instructions, then:

```bash
usermod -aG docker agent
reboot
su - agent
docker run hello-world
docker ps
```

Compose rule:

```yaml
restart: unless-stopped
```

### 14. New project baseline

```bash
git init
```

`.gitignore`:

```gitignore
.env
.env.*
!.env.example

node_modules/
dist/
build/
```

```bash
chmod 600 .env
```

Commit `.env.example`, never real `.env`.

### 15. Logs

systemd/wrapper:

```bash
systemctl status work-pi
journalctl -u work-pi -f
```

tmux/Pi:

```bash
tmux attach -t work-pi
tmux capture-pane -pt work-pi -S -200
tail -f ~/.local/state/work-pi/pane.log
```

Docker:

```bash
docker ps
docker logs -f <container>
```

journald limit:

```ini
SystemMaxUse=200M
```

### 16. Health

Server:

```bash
systemctl is-active work-pi
tmux has-session -t work-pi
tmux list-panes -t work-pi -F '#{pane_id} dead=#{pane_dead} cmd=#{pane_current_command}'
docker ps
```

Pi side:

```text
/telegram-status
```

Telegram DM:

```text
/status
```

Optional alias:

```bash
cat >> ~/.bashrc <<'EOF'

health() {
  echo "== systemd =="
  systemctl --no-pager --full status work-pi | sed -n '1,12p'
  echo
  echo "== tmux =="
  tmux has-session -t work-pi && tmux list-panes -t work-pi -F '#{pane_id} dead=#{pane_dead} cmd=#{pane_current_command}'
  echo
  echo "== docker =="
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
}
EOF
```

## Progress

- [ ] Step 1: Local preflight and push portable Pi config
- [ ] Step 2: Bootstrap server, user, SSH, and sudo
- [ ] Step 3: Configure swap if needed
- [ ] Step 4: Install Node and user-local Pi core
- [x] Step 5: Clone Pi config and verify model auth
- [x] Step 6: Install and configure RTK
- [x] Step 7: Install Telegram package
- [ ] Step 8: Run manual Telegram setup and owner pairing
- [ ] Step 9: Apply secret permissions and tmux config
- [ ] Step 10: Install systemd/tmux monitor and verify restart behavior
- [ ] Step 11: Configure firewall
- [ ] Step 12: Install Docker and accept MVP risk
- [ ] Step 13: Verify logs and health checks

## Dependencies

No other plans in `doing/` are dependencies for this deployment plan.

## Constraints / Non-goals

- Do not remove tmux.
- Do not use webhook mode for Telegram in MVP.
- Do not add Caddy, Cloudflared, wildcard domains, uptime monitoring, or update automation in MVP.
- Do not apply this sudo/Docker security model unchanged to production or secrets-heavy hosts.
- Do not run multiple Pi sessions connected to the same Telegram bot token.
