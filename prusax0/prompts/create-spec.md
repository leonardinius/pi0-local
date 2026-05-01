---
argument-hint: GitHub issue URL/number, spec path, or description
tags: plan
---

Если в `$ARGUMENTS` есть GitHub issue (URL/номер) — подтяни его через `gh issue view ...` после `gh auth status` и используй как контекст.

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
