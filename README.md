# North Tech Procurement

The unified workspace over South Africa's fragmented tender landscape — eTenders
plus SOE/municipal sources in one interface. Cloudflare Worker (Hono) + D1 + React
front end, deployed by Cloudflare Workers Builds on push to `main`.

Legacy context and the full build plan:
`../analytics/procurement-screener/projects/11-oed-procurement-tool/docs/superpowers/plans/2026-09-24-procurement-workspace.md`

## Stack

- **Worker:** Hono, D1, cron triggers, Resend for email — mirroring `business-suite/`.
- **Front end:** React + Vite + Tailwind, reusing the North Tech design system.
- **Deploy:** Cloudflare Workers Builds on push to `main`: `npm run build` (typecheck,
  tests, then the Vite build, so a failing test stops the deploy), then D1 migrations and
  `wrangler deploy`. GitHub Actions CI is manual only, to stay inside the free minutes;
  run `npm run typecheck`, `npm test` and `npm run build` before opening a pull request.

## Development

See [docs/LOCAL-DEV.md](docs/LOCAL-DEV.md) to run it on your laptop, and
[CONTRIBUTING.md](CONTRIBUTING.md) for how changes get in.

```
npm install
npm run dev:setup   # once: local database with sample tenders
npm run dev:worker  # Worker on :8787 (uses .dev.vars)
npm run dev         # Vite on :4200, proxies /api and /login to :8787
npm run typecheck
npm test
npm run build
```

## Status

Live at [bidscope.co.za](https://bidscope.co.za). Planned work is specified in
`docs/specs/`.
