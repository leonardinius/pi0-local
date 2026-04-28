# Tools

CLI commands, deployment workflows, useful shortcuts, and tool-specific knowledge.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.
```

---

## Pi OpenAI Subagent Extension Setup

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: pi, subagents, openai, workflow

Pi core has no built-in subagents, but the example extension is installed at `~/.pi/agent/prusax0/extensions/subagent` and loaded via `settings.json`:

```json
"extensions": ["prusax0/extensions/subagent"]
```

Agent definitions live in `~/.pi/agent/prusax0/agents/*.md`; `agents.ts` is patched to load that directory. OpenAI-specific agents use model strings like `openai-codex/gpt-5.5:low|medium|high|xhigh`. `index.ts` is patched to pass role prompt text to `--append-system-prompt` (not a temp-file path). Useful smoke tests:

```bash
pi --list-models openai-codex
pi --no-session --tools subagent -p 'Use subagent agent architect. Task: If your active instructions include "Do not edit files", answer ROLE_PROMPT_OK.'
pi --no-session --tools subagent -p 'Use the subagent tool in parallel mode with scout and advisor tasks.'
```

---

## Pi RTK Integration Extension

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: pi, rtk, token-savings, extension

RTK (`rtk-ai/rtk`) is installed via Homebrew at `/opt/homebrew/bin/rtk`. Pi auto-loads `~/.pi/agent/prusax0/extensions/rtk`, configured in `~/.pi/agent/settings.json`.

The extension intercepts Pi `bash` tool calls and user `!` bash via `rtk rewrite`, defaults rewritten RTK commands to `--ultra-compact`, and injects system guidance to prefer RTK for high-output inspection (`rtk read`, `rtk grep`, `rtk find`, `rtk git diff`, `rtk test`, `rtk err`). Opt out per command with `RTK_DISABLE=1` or `# rtk:off`; opt out of ultra-compact with `PI_RTK_ULTRA=0`.

RTK config is materialized at `~/Library/Application Support/rtk/config.toml` on macOS or `~/.config/rtk/config.toml` on Linux; tracking DB defaults to `~/.local/share/rtk/history.db`. Tracking is enabled, telemetry disabled. Check savings with `rtk gain` or Pi `/rtk gain`.

Ubuntu server install decision: use official RTK release artifacts, not cargo. On amd64 install pinned `.deb` (`rtk_0.37.2-1_amd64.deb`) to `/usr/bin/rtk`; on arm64 use the release tarball (`rtk-aarch64-unknown-linux-gnu.tar.gz`) into `~/.local/bin`. Run `rtk config --create` and `rtk telemetry disable`; do not rely on `rtk init` for Pi because the Pi RTK extension already injects guidance and rewrites bash through `rtk rewrite`. `rtk session`/`discover` inspect Claude Code history under `~/.claude/projects`; on Pi-only setups where that directory does not exist, their exit 1 warnings are expected and harmless.

---

## Pi Local Config Git Repository

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: pi, git, config, backup

Pi local config is versioned at `~/.pi/agent` with remote `git@github.com:leonardinius/pi0-local.git` on branch `main`. The repo includes global Pi config plus `prusax0` agents, extensions, prompts, hooks, scripts, and long-term memory. `.gitignore` excludes `auth.json`, `telegram.json`, `sessions/`, `bin/`, `tmp/`, Python caches, and short-term memory snapshots except `.gitkeep`.

---

## Work-Pi pi0-local GitHub Deploy Key

> **Added**: 2026-04-27
> **Tags**: git, github, deploy-key, pi, config

Server `agent` clones the Pi config repo via a repo-scoped GitHub deploy key alias:
```sshconfig
Host github.com-pi0-local
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_pi0_local
  IdentitiesOnly yes
```
Clone command:
```bash
git clone git@github.com-pi0-local:leonardinius/pi0-local.git ~/.pi/agent
```
Use read-only deploy key for `pi0-local`; use a machine-user SSH key or fine-grained PAT later if multiple repos need access.

---

## Pi GitHub Issue Context via gh

> **Added**: 2026-04-26
> **Tags**: pi, github, gh, workflow

Plan/spec/PR prompts now treat ticket references as GitHub issues rather than Jira. For GitHub issue URLs/numbers, use:

```bash
gh auth status
gh issue view <issue-or-url> --json number,title,body,state,labels,assignees,comments,url
```

This works only when `gh` is installed, authenticated, and can infer the repo from git remote (or the user provides `owner/name` / full URL). If not, ask the user to run `gh auth login`, provide the repo, or paste issue context.

---

## Pi Plan Prompts Are Planning-Only

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: pi, plan, workflow, prompts

`~/.pi/agent/prusax0/prompts/{plan,master-plan,ultra-plan}.md` are planning-only: after approval, write plan files only. Ambiguous “proceed” means plan-write approval, not execution. Do not mutate targets, run non-read-only implementation commands, or mark progress complete without a separate explicit execution request; end with plan path(s) and tell the user to run them via an execute command, which should run `plan-done` on completion.

---

## Systemd Monitoring for Pi Inside tmux

> **Added**: 2026-04-26
> **Tags**: pi, systemd, tmux, deployment

Keep tmux, but make Pi lifetime observable: systemd runs a foreground wrapper (`work-pi-run`), the wrapper starts detached tmux with `exec pi '/telegram-connect'`, then loops on `tmux has-session`. Because the pane command is `exec pi` and `remain-on-exit` is off, Pi exit closes the tmux session; wrapper exits non-zero; `Restart=always` restarts it. Do not use `Type=forking` + `RemainAfterExit=yes` for this.

---

## Zsh Autocomplete for Git, Ripgrep, and RTK

> **Added**: 2026-04-26
> **Updated**: 2026-04-26
> **Tags**: zsh, autocomplete, git, rg, rtk

Installed Homebrew `zsh-completions` and `zsh-autocomplete`. `~/.zshrc` prepends `~/.zsh/completions`, Homebrew `share/zsh/site-functions`, and `share/zsh-completions` to `fpath`, but `zsh-autocomplete` is commented out because its type-ahead suggestions were too aggressive; normal `compinit` is active. Custom RTK completion lives at `~/.zsh/completions/_rtk`; Git and ripgrep completions load as `_git` and `_rg`. If zsh reports insecure directories, run `compaudit`; `/opt/homebrew/share` was fixed with `chmod go-w /opt/homebrew/share`. Rebuild with `rm -f ~/.zcompdump*` and verify via `zsh -ic 'autoload -Uz +X _git _rg _rtk; whence -w _git _rg _rtk'`.

---

## Pi BTW Side-Chat Extension

> **Added**: 2026-04-28
> **Updated**: 2026-04-28
> **Tags**: pi, extension, btw, side-chat, tools

Install Armin Ronacher's `btw.ts` side-chat extension globally by downloading the raw file to `~/.pi/agent/extensions/btw.ts` (auto-discovered) and restart Pi or run `/reload`:

```bash
mkdir -p ~/.pi/agent/extensions
curl -fL https://raw.githubusercontent.com/mitsuhiko/agent-stuff/refs/heads/main/extensions/btw.ts -o ~/.pi/agent/extensions/btw.ts
```

`pi install https://raw.githubusercontent.com/.../btw.ts` may incorrectly try to `git clone` the raw URL and fail with GitHub 404. The extension registers `/btw`; source review shows it creates an in-memory side agent session using the current model/thinking level and `codingTools`, persists BTW entries via `pi.appendEntry`, and should be treated as trusted arbitrary-code extension.

Pi 0.70.5's `Agent` no longer has `replaceMessages`; if `/btw <text>` crashes with `TypeError: session.agent.replaceMessages is not a function`, patch the seed step in `~/.pi/agent/extensions/btw.ts` to `session.agent.state.messages = seedMessages as typeof session.state.messages;`.

---
