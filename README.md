# North Tech Procurement

The unified workspace over South Africa's fragmented tender landscape — eTenders
plus SOE/municipal sources in one interface. Cloudflare Worker (Hono) + D1 + React
front end, deployed by GitHub Actions on push to `main`.

Legacy context and the full build plan:
`../analytics/procurement-screener/projects/11-oed-procurement-tool/docs/superpowers/plans/2026-09-24-procurement-workspace.md`

## Stack

- **Worker:** Hono, D1, cron triggers, Resend for email — mirroring `business-suite/`.
- **Front end:** React + Vite + Tailwind, reusing the North Tech design system.
- **Deploy:** GitHub Actions (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

## Development

```
npm install
npm run cf:dev      # Worker on :8787 (uses .dev.vars)
npm run dev         # Vite on :4200, proxies /api and /login to :8787
npm run typecheck
npm test
npm run build
```

## Status

Phase 0 — application shell only. No ingestion, no data, no billing yet. Pages are
placeholders; navigation and the design system are real.
