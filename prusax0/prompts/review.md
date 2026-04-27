---
argument-hint: PR number, branch, or file path
tags: review
---

Review code like a senior engineer reviewing a junior's work. Look for real problems — things that will cause bugs, confuse future readers, or make the codebase harder to change safely.

## Getting the code to review

Run `~/.pi/agent/prusax0/scripts/review-diff $ARGUMENTS` to get the list of changed files and the diff.

**Default** (no arguments): reviews working tree changes.
Other modes: `branch <name>`, `merge`, `last <N>`, `files <file1> [file2...]`.

After running the script:
1. Read the **full content** of every changed file listed — not just the diff. You need surrounding context to judge correctness.
2. For each changed file, also read closely related files (interfaces, callers, tests) where relevant.

## What to look for

Think about these questions for each changed file. Only report genuine findings — if everything looks fine, say so.

### 1. "I don't understand this code"

The most important check. If you read a function and cannot confidently explain what it does and why, that is a finding. Flag: functions whose purpose is unclear, misleading names, logic that requires mental gymnastics to follow, control flow that obscures intent.

### 2. "What are the rules here?"

Look for implicit invariants — assumptions the code makes but doesn't document or enforce.

- "This method assumes X has already been called"
- "This field must be updated whenever that field changes"
- "The caller is responsible for Y"

If an invariant is critical and not obvious, it should be documented, enforced, or structurally impossible to violate. Flag cases where it's none of these.

### 3. "What happens when this fails?"

Trace the unhappy paths:

- If this fails partway through, is the caller's state consistent?
- Are error codes/exceptions checked and meaningful, or silently swallowed?
- On the error path, are all resources/locks/transactions cleaned up?

### 4. "This is going to bite us"

Look for fragile coupling and ticking time bombs:

- A module reaching into the internals of another
- Two data structures that must stay in sync with no mechanism ensuring it
- Code that works today but will silently break when a new case is added
- Hardcoded limits with no enforcement

### 5. "This doesn't match the pattern"

Every codebase has conventions. When changed code breaks from an established pattern, flag it — either it's a bug or it's creating an inconsistency that will cause bugs later.

## What to ignore

Do NOT report:

- Formatting and style (linters handle this)
- "I would have written it differently" (preference, not a bug)
- Performance unless obviously pathological on a hot path
- Test code quality — tests are allowed to be repetitive
- Missing documentation for self-evident code
- Suggestions to add features, refactor for extensibility, or improve abstractions. Only flag what's broken or fragile NOW.

## Output format

Organize findings by severity:

### Bugs
Things that are wrong today — incorrect behavior, data corruption, crashes.

### Risks
Things that aren't broken yet but are likely to break — implicit invariants, fragile coupling, time bombs.

### Clarity
Code that works but will mislead the next person who reads it.

For each finding:
- **File and location** (e.g., `app/workers/payment_processor.rb:process`)
- **What you found** — one sentence
- **Why it matters** — one sentence explaining the consequence
- **Suggested fix** — brief, concrete

If a category has no findings, omit it. If you find nothing worth reporting, say "No issues found" and stop. Do NOT pad the review with low-value observations.