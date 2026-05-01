# Services

Per-service gotchas, configurations, quirks, and operational knowledge.

Entry format: use a level-2 heading (for example, `## Descriptive Title`), metadata lines for Added/Updated/Tags, concise content, and a closing `---`.
```

---

## cloudflared Service 503 Without Ingress Rules

> **Added**: 2026-05-01
> **Tags**: cloudflare, cloudflared, caddy, ingress, troubleshooting

If public app URL returns `503` and cloudflared logs include `No ingress rules were defined`, the service lacks ingress config. Fix by defining host ingress in `/etc/cloudflared/config.yml` and routing to local Caddy (usually `http://127.0.0.1:80`).

Quick verify:
- local: `curl http://127.0.0.1:80/` (Caddy alive)
- public: `curl -I https://<app>-<base>/`

---
