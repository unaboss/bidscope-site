# Frontend structure

- `main.tsx` is the Vite entry. It selects the real app or lazily loads the public preview.
- `app/` owns application composition: routing, workspace layouts, and preview router/provider composition.
- `features/` groups pages, components, and domain helpers by ownership: auth, billing, bookmarks, buyers, calendar, compliance, dashboard, marketing, preview demo data/API, profile, and tenders. Tender discovery, detail, feed, and map code live together under `tenders/`.
- `shared/ui/` contains reusable presentation primitives. `shared/lib/` contains cross-feature helpers, `shared/runtime/` contains plan and preview contexts used across features, and `shared/api.ts` / `shared/types.ts` define the browser API client and response contracts.
- `styles/` contains the global base and redesign stylesheets. Component-specific styles and assets stay beside their component, such as the tender map.

## Type and colour

`public/theme.css` sets one root scale — `html { font-size: calc(16px * var(--ui-scale)) }` — and steps it down as the viewport widens or the display gets denser. Author every `font-size`, `line-height` and `letter-spacing` in `rem` so it follows that scale; `tests/type-scale.test.ts` fails on a stray `px`. Breakpoints stay in `px`. Colour comes from the shared tokens (`cream`, `panel`, `line`, `ink`, `navy`, `wax`) rather than hex, which is what lets a page follow the light/dark switch; the exceptions are documented next to the rules that need them.

## Building pages incrementally

Follow [the page rollout guide](../docs/specs/frontend-page-rollout.md) for the
public-site, onboarding, workspace and account sequence. Public informational
pages belong in `features/marketing/pages` and should reuse that feature's page
layout and navigation. Add routes in `app/router.tsx`, and verify direct entry,
mobile navigation, keyboard interaction and real loading/error states before
moving on to the next group.

## Dependency rules

`app` composes features and shared modules. Features may use shared modules and explicitly import another feature's reusable components or helpers, but must not import application routing or layouts. Keep domain-owned helpers with their feature rather than moving them into shared solely because another feature uses them. Shared modules must not import features or app modules. Use direct imports instead of introducing barrels for every directory; `@/` resolves to `src/`.

Plan and preview contexts stay in shared runtime so reusable code does not depend on demo screens or application composition. The preview's router remains in `app/preview.tsx`, while its stand-in API and fixtures live in `features/preview/`; preserve this lazy-loading boundary.

The browser-safe `shared/lib/sources.ts` is also consumed by the Worker. Preview fixtures deliberately reuse browser-safe Worker domain modules; preserve those boundaries rather than importing server-only runtime code. Backend implementation remains in the root `worker/` directory, outside this frontend structure. Static public files, including standalone authentication assets, remain in root `public/`.
