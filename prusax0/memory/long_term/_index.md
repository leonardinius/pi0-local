# Knowledge Cache Index

> **Last updated**: 2026-04-26
> **Total entries**: 7

## Category Files

| File | Entries | Last Updated | Description |
|------|---------|--------------|-------------|
| `queries.md` | 0 | — | Working SQL, BigQuery, PromQL, JQL, CQL queries |
| `runbooks.md` | 0 | — | Incident resolution, debugging procedures, operational workflows |
| `investigations.md` | 1 | 2026-04-26 | Research results, deep-dive findings, codebase explorations |
| `patterns.md` | 1 | 2026-04-26 | Code patterns, conventions, architecture decisions |
| `services.md` | 0 | — | Per-service gotchas, configs, quirks |
| `tools.md` | 5 | 2026-04-26 | CLI commands, deployment workflows, useful shortcuts |

## Tag Cloud

autocomplete, backup, config, extension, git, hooks, memory, openai, pi, plan, prompts, rg, rtk, subagents, token-savings, workflow, zsh

## Quick Lookup

| Looking for... | Check file | Tags to grep |
|----------------|-----------|--------------|
| A query I used before | `queries.md` | sql, bigquery, jql, promql |
| How to fix/debug X | `runbooks.md` | incident, debugging, fix |
| What I learned about X | `investigations.md` | research, exploration |
| How code pattern X works | `patterns.md` | pattern, convention |
| Service-specific behavior | `services.md` | payments-service, frontier, nexus |
| A command or tool trick | `tools.md` | cli, deploy, utopia, anu |

## How to Search

1. **Don't read this index first** — go straight to Grep
2. Grep for tags: `Grep pattern="Tags:.*keyword" path="/Users/leo/.pi/agent/prusax0/memory/long_term/"`
3. Grep returns file + line number — read only the matched `## ... ---` block
4. For broad exploration, read this index to discover category coverage

## Scaling

- Each category file holds up to **50 entries** before splitting
- When split, sub-files follow the pattern: `{category}_{tag}.md` (e.g. `investigations_frontier.md`)
- The original file becomes a routing index listing sub-files
- Grep still searches all files: `Grep pattern="Tags:.*keyword" path="/Users/leo/.pi/agent/prusax0/memory/long_term/"` — works regardless of splits
- Splitting is managed by `/save` only — proactive saves always append to the main file
