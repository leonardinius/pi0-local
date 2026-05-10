#!/usr/bin/env node
import assert from "node:assert/strict";

function parseInsightsArgs(args) {
  const trimmed = args.trim();
  const optionalScopeMatch = trimmed.match(/Optional user scope\/question:\s*`([^`]*)`/s);
  const directWriteMatch = trimmed.match(/\/insights\s+write(?:\s+([^`\n]*))?/s);
  const bareWriteMatch = trimmed.match(/^write(?:\s+(.*))?$/s);
  const normalized = trimmed.replace(/^\/insights\s+/s, "");
  const parts = normalized.split(/\s+/).filter(Boolean);
  const [first, ...rest] = parts;
  const writeMode = Boolean(optionalScopeMatch) || Boolean(directWriteMatch) || Boolean(bareWriteMatch) || first === "write";
  const scope = writeMode
    ? (
        optionalScopeMatch?.[1]?.replace(/^write\s*/s, "") ??
        directWriteMatch?.[1] ??
        bareWriteMatch?.[1] ??
        rest.join(" ")
      )
        .replace(/\s+/g, " ")
        .trim()
    : trimmed;
  return { writeMode, scope };
}

assert.deepEqual(parseInsightsArgs(""), { writeMode: false, scope: "" });
assert.deepEqual(parseInsightsArgs("write"), { writeMode: true, scope: "" });
assert.deepEqual(parseInsightsArgs("write отчет"), { writeMode: true, scope: "отчет" });
assert.deepEqual(parseInsightsArgs("/insights write"), { writeMode: true, scope: "" });
assert.deepEqual(parseInsightsArgs("/insights write отчет"), { writeMode: true, scope: "отчет" });
assert.deepEqual(parseInsightsArgs("Run `/insights` ... Optional user scope/question: `write`."), { writeMode: true, scope: "" });
assert.deepEqual(parseInsightsArgs("Run `/insights` ... Optional user scope/question: `write отчет`."), { writeMode: true, scope: "отчет" });
assert.deepEqual(parseInsightsArgs("Run `/insights` ... `/insights write отчет` ..."), { writeMode: true, scope: "отчет" });
assert.deepEqual(parseInsightsArgs("/insights something"), { writeMode: false, scope: "/insights something" });
assert.deepEqual(parseInsightsArgs("  write   report  now  "), { writeMode: true, scope: "report now" });

console.log("insights command parsing passed");
