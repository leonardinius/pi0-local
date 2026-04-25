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

RTK config is materialized at `~/Library/Application Support/rtk/config.toml`; tracking is enabled, telemetry disabled. Check savings with `rtk gain` or Pi `/rtk gain`. `rtk session` and `rtk discover` inspect Claude Code history under `~/.claude/projects`; on Pi-only setups where that directory does not exist, their exit 1 warnings are expected and harmless. The Pi RTK extension no longer advertises those Claude Code history commands in its system guidance or `/rtk` command description.

---
