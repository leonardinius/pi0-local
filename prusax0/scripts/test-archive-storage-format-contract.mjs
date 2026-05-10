#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(process.env.HOME, ".pi", "agent", "prusax0");
const failures = [];

function file(relPath) {
  const full = join(root, relPath);
  if (!existsSync(full)) {
    failures.push(`${relPath} is missing`);
    return "";
  }
  return readFileSync(full, "utf8");
}

function must(text, pattern, label) {
  if (!pattern.test(text)) failures.push(label);
}

const agents = file("../AGENTS.md");
const save = file("prompts/save.md");
const storagePlan = file("plans/doing/20260510165458-prusax0-archive-storage-format.md");
const archiveGitignore = file("memory/archive/.gitignore");

must(archiveGitignore, /^\*$/m, "archive must ignore retained drafts by default");
must(archiveGitignore, /^!\.gitignore$/m, "archive must keep only its ignore marker trackable");

for (const [name, text] of [["AGENTS.md", agents], ["save.md", save], ["archive storage plan", storagePlan]]) {
  must(text, /memory\/archive\//i, `${name} must document memory/archive/`);
  must(text, /flat|direct-child/i, `${name} must document a flat direct-child archive layout`);
  must(text, /YYYYMMDD_HHMMSSZ__\{original-short-term-filename\}/i, `${name} must document the provenance-preserving archive filename shape`);
  must(text, /preserve provenance/i, `${name} must explicitly preserve provenance`);
  must(text, /manual cleanup|explicit user request/i, `${name} must make archive cleanup manual/explicit`);
  must(text, /Do not auto-archive|no runtime auto-archiving/i, `${name} must forbid runtime auto-archiving`);
}

must(save, /preserve the source file contents unchanged/i, "save prompt must preserve archived source contents unchanged");
must(save, /timestamp collision/i, "save prompt must define timestamp collision handling");
must(agents, /separate from `short_term\/`, `long_term\/`, and `_insights\/`/i, "global docs must keep archive separate from other memory dirs");
must(storagePlan, /not a long-term store/i, "storage plan must say archive is not long-term memory");

if (failures.length) {
  console.error("archive storage format contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("archive storage format contract passed");
