#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(process.env.HOME, ".pi", "agent", "prusax0");
const failures = [];

function file(relPath) {
  const full = relPath.startsWith("../") ? join(root, relPath) : join(root, relPath);
  if (!existsSync(full)) {
    failures.push(`${relPath} is missing`);
    return "";
  }
  return readFileSync(full, "utf8");
}

function must(text, pattern, label) {
  if (!pattern.test(text)) failures.push(label);
}

function mustNot(text, pattern, label) {
  if (pattern.test(text)) failures.push(label);
}

const agents = file("../AGENTS.md");
const save = file("prompts/save.md");
const insights = file("prompts/insights.md");
const checkpoint = file("prompts/checkpoint.md");
const memory = file("extensions/memory/index.ts");

must(agents, /archive\//i, "global memory docs must mention archive/");
must(agents, /cold-storage|cold storage/i, "global memory docs must define archive as cold storage");
must(agents, /not .*recall/i, "global memory docs must say archive is not recall input");
must(agents, /not .*\/save/i, "global memory docs must say archive is not /save input");
must(agents, /not .*\/insights/i, "global memory docs must say archive is not /insights input");
must(agents, /\/checkpoint[\s\S]*short_term\//i, "global memory docs must keep /checkpoint writing to short_term");
must(agents, /session_compact[\s\S]*short_term\/auto_compact_\*\.md/i, "global memory docs must keep auto compaction writing to short_term");
must(agents, /Do not auto-archive/i, "global memory docs must forbid auto-archive behavior");

must(save, /Read direct-child `\.md` files in `~\/\.pi\/agent\/prusax0\/memory\/short_term\/` only/i, "save prompt must restrict input to direct-child short_term md files");
must(save, /Explicitly ignore `~\/\.pi\/agent\/prusax0\/memory\/archive\/`/i, "save prompt must explicitly ignore archive input");
must(save, /do not read, promote, delete, move, summarize, or index/i, "save prompt must forbid acting on archive as input");
must(save, /Move reviewed and explicitly skipped short-term drafts to `~\/\.pi\/agent\/prusax0\/memory\/archive\/`/i, "save prompt must archive reviewed skipped drafts");
must(save, /Leave unreviewed short-term files in `short_term\/`/i, "save prompt must leave unreviewed leftovers in short_term");
must(save, /Do not auto-archive/i, "save prompt must forbid auto-archive behavior");

must(insights, /Read direct-child `\*\.md` files from `~\/\.pi\/agent\/prusax0\/memory\/short_term\/` only/i, "insights prompt must restrict input to direct-child short_term md files");
must(insights, /`archive\/`/i, "insights prompt must explicitly exclude archive/");
must(insights, /Do not write to `short_term\/`, `long_term\/`, `long_term\/_index\.md`, or `archive\/`/i, "insights write mode must not write to archive");
must(insights, /not input to `\/save`, recall, or future `archive\/` processing/i, "insights reports must stay outside save, recall, and archive processing");

must(checkpoint, /Save a compact checkpoint to `~\/\.pi\/agent\/prusax0\/memory\/short_term\/`/i, "checkpoint prompt must write to short_term");
must(checkpoint, /Do not write to `~\/\.pi\/agent\/prusax0\/memory\/archive\/`/i, "checkpoint prompt must not write to archive");

must(memory, /const LONG_TERM_DIR = path\.join\(ROOT, "memory", "long_term"\);/, "memory extension must define long_term recall root");
must(memory, /const SHORT_TERM_DIR = path\.join\(ROOT, "memory", "short_term"\);/, "memory extension must define short_term checkpoint root");
must(memory, /readdirSync\(LONG_TERM_DIR\)[\s\S]*name\.endsWith\("\.md"\) && name !== "_index\.md"[\s\S]*path\.join\(LONG_TERM_DIR, name\)/m, "memory recall must enumerate direct-child long_term md files only");
must(memory, /fs\.mkdirSync\(SHORT_TERM_DIR, \{ recursive: true \}\);[\s\S]*path\.join\(SHORT_TERM_DIR, `auto_compact_\$\{timestamp\(\)\}\.md`\)/m, "auto-compaction must write only to short_term");
mustNot(memory, /archive/i, "memory extension must not introduce archive read/write behavior yet");

if (failures.length) {
  console.error("archive boundary contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("archive boundary contract passed");
