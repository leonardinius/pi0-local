---
argument-hint: GitHub issue URL/number, spec path, or description
tags: plan
---

If `$ARGUMENTS` looks like a GitHub issue URL or issue number/reference:
- Prefer `gh issue view <issue-or-url> --json number,title,body,state,labels,assignees,comments,url` from the target repo.
- First run `gh auth status`; if GitHub CLI is not authenticated or the repo cannot be inferred, ask the user to authenticate with `gh auth login`, provide the repo (`owner/name`), or paste the issue context.
- Treat fetched GitHub issue content as context to verify, not as complete requirements.

Interview the user directly about:
- Architecture, component boundaries, DB/store choice
- Edge cases, failure modes, error handling
- UI/UX specifics (if applicable)
- Performance/scale: bottlenecks, limits, caching
- Security: auth, data privacy, vulns
- Testing: unit/integration/e2e strategy
- Deployment: rollout plan, rollback, monitoring

Uncover non-obvious assumptions and gotchas.

After each Q&A round:
- Summarize clarifications
- Ask: "Continue questions" or "Finalize spec"

When finalized:
- Zero chatter. No "Here's your file." Technical brevity only.
- Sections: Overview, Requirements (functional/non-functional), Technical Approach, Edge Cases, Open Questions, Testing, Deployment, Monitoring
- Review for brevity before writing
