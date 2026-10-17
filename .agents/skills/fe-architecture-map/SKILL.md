---
name: fe-architecture-map
description: Architecture map and conventions for this frontend project (React, Feature-Sliced Design, TanStack Query, MSW, Biome). You MUST use this skill BEFORE any work in the repository, including adding or moving code, creating a feature, widget, page, entity, query, mutation, or MSW mock, refactoring, code review, answering questions such as "where is something located", "what depends on what", "where should a file go", "what will this change affect", as well as auditing the project structure, code style, and linting. It provides layers, slices, import rules, code style, and data-layer paths so you don't have to read the entire codebase or ask the user for context.
---

# fe-architecture-map

Freshness metadata:
- Map commit: `a630f2c` + uncommitted work in the working tree: camera page (new `entities/camera`, `shared/{config,lib}`; `pages/cam-page` and `widgets/camera-control` moved to `ui/` + `index.ts`) and event log (new `entities/event`, `shared/ui`, `shared/api/{pagination,retry}.ts`, `shared/lib/{isOneOf,pluralize}.ts`, `mocks/{data,handlers}/events.ts`; `pages/event-list` moved to `ui/` + `model/` + `index.ts`) and dashboard (`pages/client-dashboard` and `widgets/info` moved to `ui/` + `index.ts` and rewritten on real data; new `entities/camera/ui/{CameraLiveView,StreamPlaceholder}.tsx` (the latter moved from `pages/cam-page`), `shared/ui/{load-error,inline-error}`, `shared/config/layout.ts`, `shared/lib/formatRelativeTime.ts`). After that work is committed, replace `a630f2c` below with the new commit hash.
- Date: 2026-10-17
- Versions: react `19.2.4`, react-router `7.13.2`, @tanstack/react-query `5.95.2`, msw `2.12.14`, @biomejs/biome `2.4.9`, vite `8.0.3`, typescript `6.0.2`, @radix-ui/themes `3.3.0`

## Freshness check (do this first)

```bash
git rev-list --count a630f2c..HEAD
git diff --name-status a630f2c HEAD -- src | rg '^(A|D|R)'
git status --short -- src
```

- While that work is uncommitted, `git status --short -- src` lists exactly the files described in `references/interaction-map.md` (cards `pages/cam-page`, `pages/client-dashboard`, `pages/event-list`, `widgets/camera-control`, `widgets/info`, `entities/camera`, `entities/event`, `shared`, `?mocks`) plus `src/router/routes.ts` and `src/entities/camera-card/CameraCard.tsx`; that is expected, not drift.
- If there are no added, deleted, or renamed files in `src`, the map can be trusted (changes within existing files do not affect the structure).
- If there are A/D/R changes in slice directories, `index.*` files, or MSW handlers, the map is outdated in those areas. Regenerate the graph using `node docs/ai/scripts/fsd-imports.mjs`, inspect the changed slices, and inform the user that the map needs to be updated (see the procedure in `docs/ai/README.md`, section "Updating the Map").

## Project at a glance

- Client SPA for a video surveillance NVR: list of IP cameras with live WebRTC (WHEP) video, camera detail page, event log (alarms, warnings, detections; server-side filtering, sorting, pagination), login with 2FA. Backend is not connected yet — all `/api/*` traffic is served by MSW in DEV.
- Stack: React 19 + react-router 7 (data router, lazy routes), TanStack Query v5, MSW v2, Radix Themes + radix-ui, SCSS Modules (+ Tailwind 4 plugin), valibot (installed, unused), Vite 8, TypeScript 6 (strict, `exactOptionalPropertyTypes`).
- Package manager: yarn 4 (`yarn exec <bin>`; never `npx`). Alias: `@/*` → `src/*`.
- Layout: FSD layers `src/{app,pages,widgets,features,entities,shared}`; `features/` is an empty placeholder. Outside layers (legacy): `src/router`, `src/api`, `src/mocks` (dev-only), `src/assets`. Entry: `src/main.tsx` (providers + MSW start).
- No tests yet (owner decision: tests come after the components are ready).

## Core rules

1. Imports go only to strictly lower layers: `app > pages > widgets > features > entities > shared`. Today there are 0 cross-slice imports and 0 cycles — keep it that way.
2. Slices of the same layer never import each other (`entities` only via `@x`).
3. Outside a slice, import only its Public API `index.ts`. Have one: `pages/cam-page`, `pages/client-dashboard`, `pages/event-list`, `widgets/camera-control`, `widgets/info`, `entities/camera`, `entities/event` (7 of 11), plus the `shared/ui` segment (`@/shared/ui`). Still without: `pages/auth`, `widgets/the-header`, `entities/camera-card` (unused), `entities/user-profile-card`. When you touch another slice, add `index.ts` with explicit named re-exports and `export type` for types (no `export *`). `noBarrelFile` is already off for `src/{pages,widgets,features,entities}/*/index.ts` and `src/shared/*/index.ts` (`biome.json`). Inside a slice use relative imports, never the slice's own `index.ts`.
4. Segments are named by purpose: `ui`, `api`, `model`, `lib`, `config`. Never create `components`, `utils`, `hooks`, `types`, `helpers` (existing `shared/components`, `shared/utils` are legacy).
5. New API functions and query hooks go to `src/entities/<entity>/api/`, domain types to `src/entities/<entity>/model/` (agreed target: `session`, `user`, `camera`). Do not add files to `src/api` or `src/pages/*/model` for API code. Camera queries already exist: `cameraKeys`, `useCamerasQuery`, `useCameraQuery`, `useCameraStreamQuery` from `@/entities/camera`; event log — `eventKeys`, `useEventsQuery` from `@/entities/event`. Reuse them, and `retryUnlessClientError` (`@/shared/api/retry`) for new queries. Live video of one camera anywhere — `CameraLiveView` from `@/entities/camera` (stream query + player + placeholder; put `key={camera.id}` on it). Page-specific URL state (filters, sorting, page) may live in `src/pages/*/model` — it is not API code.
6. `src/mocks` is dev/test-only: only `src/main.tsx`, `src/app/**` and test infrastructure may import it. Production code never imports `@/mocks/**`. Known legacy exceptions: `entities/camera-card` and `entities/camera` (`model/types.ts`, `ui/CameraPlayer.tsx`; owner decision 2026-10-17, until M-2). Need camera types or the player elsewhere? Import them from `@/entities/camera`, never from `@/mocks`. The opposite direction is fine: mocks import types, catalogs and error codes from `@/entities/*` and `@/shared/*` (as `mocks/{data,handlers}/events.ts` do) — define domain types in the entity, not in `src/mocks`.
7. Pages and layouts export `function Component()` — react-router `lazy` relies on it (`src/router/routes.ts`). Router target location is `src/app/router/`.
8. HTTP only via `apiFetch<T>` from `@/shared/api/http`; check errors with `isApiError(err)` and `ApiErrorCode` (`@/shared/api/authErrorCodes`). Mock error bodies must be `{error: '<CODE>', message}`.
9. TanStack Query v5 object syntax; query keys start with the entity name (`['cameras', 'list']`) so they can be invalidated by prefix.
10. MSW v2 (`http`, `HttpResponse`, `delay`). A new handler array must be added to `src/mocks/handlers/index.js`, `src/mocks/browser.js` and `src/mocks/server.js`.
11. Code style: named exports only; components as `export function Name()`; props as `interface NameProps`; `.tsx` files PascalCase, other files camelCase, directories kebab-case; cross-folder imports via `@/`, same-folder via `./`; `import type` on its own line.
12. Styles: one `Name.module.scss` per component, classes `block__element`; `@/assets/scss/variables.scss` is auto-injected — do not import it.
13. Do not run `--write`/`--unsafe` Biome commands or the `yarn lint`/`check`/`format` scripts (they modify files) unless the user asks.
14. Do not delete scaffolding or "unused" code (owner decision, see "What not to do").

## Where to look next

| Task | Read |
|---|---|
| Where to put a file, whether X can be imported from Y, assessing violations | `references/fsd-rules.md` |
| Dependencies, impact analysis ("if changing X, check Y"), scenario flows, routes | `references/interaction-map.md` |
| Code style, naming, formatting, Biome rules | `references/conventions.md` |
| A new query or mutation, query keys, a new MSW handler, fixtures, test accounts | `references/data-layer.md` |
| Why something is the way it is, findings and the improvement plan | `docs/ai/reports/02..04`, `docs/ai/reports/06-roadmap.md` |
| Owner decisions and open questions | `docs/ai/audit-plan.md` |

## How to add common items

- **Page**: `src/pages/<kebab-name>/ui/<Name>.tsx` exporting `function Component()` + `<Name>.module.scss`; `src/pages/<kebab-name>/index.ts` re-exporting `Component`; route in `src/router/routes.ts` (`lazy: () => import('@/pages/<kebab-name>')`, inside the `MainLayout` or empty-layout branch). Example: `src/pages/cam-page/`. Links below `app` use `ROUTES` from `@/shared/config/routes` (add the path there too); other hardcoded paths — `references/interaction-map.md`, section 7, rule 5.
- **Feature** (only for a user scenario reused in ≥ 2 places, otherwise keep it in the page/widget): `src/features/<verb-noun>/{ui,model,api}/` + `index.ts`; may import `entities/*` and `shared/*` only.
- **Entity**: `src/entities/<noun>/{model/types.ts, api/<fn>.ts, ui/<Name>.tsx}` + `index.ts`. Best example: `src/entities/event/` (types defined in the entity; `model/catalog.ts` `as const` arrays + derived unions, `model/meta.ts` labels/colors as `Record<Union, …>`; `api/` fetcher + key factory + hook). `src/entities/camera/` has the same shape but still re-exports types from mocks.
- **Query + mock**: follow `references/data-layer.md`, recipe 1 (types → API function → hook → index → MSW handler → fixture → checks). Paginated list with filters: copy `entities/event` + `mocks/handlers/events.ts` (validation → 400 `VALIDATION_ERROR`, `PaginatedResponse<T>`) + `pages/event-list/model/` (URL state).
- **Shared UI component**: `src/shared/ui/<kebab-name>/<Name>.tsx` + a named re-export in `src/shared/ui/index.ts`; no domain knowledge, no imports from upper layers. Existing: `InlineError`, `LoadError`, `Pagination`, `SearchField`, `SortableHeaderCell`. Layout constant for "content + 320 px side panel": `CONTENT_WITH_ASIDE_COLUMNS` (`@/shared/config/layout`). Note: the existing callout lives in legacy `src/shared/components/callout/`.
- **Reuse before writing**: a component needed by a second page cannot be imported from the first page (cross-slice) — move it down: domain UI to `entities/<x>/ui`, domain-free UI to `shared/ui`. Check `references/interaction-map.md` (cards `entities/camera`, `entities/event`, `shared`) for what already exists.

Before finishing any task:
1. `yarn exec biome check <changed files>`
2. `yarn exec tsc --noEmit -p tsconfig.app.json` — baseline is 2 known errors (`src/main.tsx:16`, `src/testSetup.ts:3`; `docs/ai/reports/generated/tsc-app.txt`, refreshed after the dashboard refactor — was 5); do not add new ones.
3. For new or moved files: `node docs/ai/scripts/fsd-imports.mjs` and check `docs/ai/reports/generated/slices.md` (note: folders outside FSD layers get rank −1 — imports *from* them are reported as `layer-upward`, imports *into* them are not checked).

## What not to do

- Import `@/mocks/**` from production code (anything except `src/main.tsx`, `src/app/**`, test setup); put production logic (hooks, domain types) into `src/mocks`.
- Deep-import another slice's internals once it has an `index.ts`; use `export *` in a Public API.
- Add API code to `src/api/` or query hooks to `pages/*/model/` (legacy locations).
- Return `{code, message}` error bodies from new mocks (the client reads `error`).
- Use relative imports that leave the slice (`../../../api/...`).
- `biome-ignore` without a specific rule and a reason.

Accepted exceptions (owner decision, 2026-10-17):
- `widgets/info` and `widgets/camera-control` stay in `widgets` although each has one consumer — they will be reused.
- Do not remove: `entities/user-profile-card`, `pages/client-dashboard/model/useClientDashboard.ts`, `api/user/types.user.ts` (`User`), `useCalloutMessage`, commented-out blocks in `pages/client-dashboard/ui/ClientDashboard.tsx` (kept verbatim through the refactor, only the import path in the comment was adjusted to `../model/…`). `entities/camera-card` has no consumers since the dashboard refactor — do not delete it without the owner's decision (Q11 in `docs/ai/audit-plan.md`). (Completed at the owner's request on 2026-10-17, not deleted: the `CameraControls.tsx` placeholder became the real panel; the commented-out "load data + toast on error" sketch in `EventList.tsx` became the working query + `useCalloutMessage` toast.)
- `entities/camera` re-exports camera types from `src/mocks/data/nvrtypes.ts` and uses `useWebRtcPlayer` from `src/mocks/handlers/webrtc.ts` (owner chose not to move them yet; M-2 will).
- `src/features/` is an intentional empty placeholder.
- `src/mocks` stays outside FSD layers as dev-only infrastructure.
- No tests and no coverage for now; `public/mockServiceWorker.js` being git-ignored is not an issue to raise.
- `docs/ai/**` is excluded from Biome (`biome.json`, last override).
