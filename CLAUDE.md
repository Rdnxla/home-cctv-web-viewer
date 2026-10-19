# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

A React SPA for an NVR (network video recorder): a camera dashboard with live WebRTC video, a camera detail page, an event log, archive playback with a timeline and bookmarks, and login with 2FA. UI text is Russian and hard-coded in JSX (no i18n). There is no backend: in DEV, MSW (`src/mocks`) answers every `/api/*` request. Production builds don't start MSW, and nothing proxies `/api`.

## Stack

- Package manager: Yarn 4.18.0 (`nodeLinker: node-modules`); run binaries via `yarn exec <bin>`.
- Core: React / React DOM 19.2.4, React Router 7.13.2 (`createBrowserRouter`, data router), Vite 8.0.3, `@vitejs/plugin-react` 6.0.1, TypeScript 6.0.2. The `@/*` → `src/*` alias is configured in `tsconfig.app.json` and `vite.config.ts`.
- Data and validation: TanStack React Query 5.95.2 (v5 API, `gcTime`, devtools), Valibot 1.3.1.
- Mocks: MSW 2.12.14 (v2 API: `http` / `HttpResponse`); configured with `msw.workerDirectory: ["public"]`. Files are in `src/mocks/{browser.js,server.js,db.js,handlers/,data/}`; worker is `public/mockServiceWorker.js` (git-ignored).
- UI and styling: `@radix-ui/themes` ^3.3.0, `radix-ui` ^1.6.7, `@radix-ui/react-icons` ^1.3.2, Tailwind CSS 4.2.2 (`@tailwindcss/vite`), Sass ^1.104.1, SCSS Modules.
- Error handling: `react-error-boundary` 6.1.1.
- Linting and formatting: Biome 2.4.9 (`biome.json`); ESLint and Prettier are not installed.
- Testing: Vitest 4.1.2, `@vitest/coverage-v8` 4.1.2, happy-dom 20.8.9, Testing Library (`dom` 10.4.1, `react` 16.3.2, `jest-dom` 6.9.1, `user-event` 14.6.1). Configuration/utilities: `src/testSetup.ts`, `src/TestUtils.tsx`.
- E2E: Playwright 1.58.2; tests in `./tests`. No test files exist yet.
- No dedicated state manager was found in `package.json`.

### Yarn scripts

- `dev`: `vite --open`
- `test`: `vitest`
- `test:e2e`: `playwright test --ui`
- `test:ci`: `vitest run`
- `test:e2e:ci`: `playwright test`
- `lint:tsc`: `tsc -b`
- `lint:biome`: `biome check --write --unsafe`
- `lint`: `yarn lint:tsc && yarn lint:biome`
- `format`: `biome format --write`
- `check`: `biome check --write`
- `validate`: `yarn lint && yarn test:ci && yarn test:e2e:ci`
- `build`: `vite build`
- `preview`: `vite preview`

Do not run scripts/commands that write or format files (`yarn lint`, `yarn lint:biome`, `yarn check`, `yarn format`, or Biome `--write`/`--unsafe`) unless the user explicitly asks.

## Work protocols and roles

Use the specialized agents in `.claude/agents/` when useful:
- `architect`: inspect and design a solution; return a plan before implementation.
- `developer`: implement only the approved feature/fix, with minimal necessary changes.
- `tester`: write only the requested unit/component tests or E2E tests for the specified target/flow.

The user may specify a role at the start of a task. Follow that role's boundaries. If no role is specified, clarify only when the task genuinely needs a role choice; otherwise perform the task directly and do not unnecessarily block simple work. Roles are instructions, not a security sandbox: obey repository access boundaries regardless of role.

## Core rules

1. **FSD import direction:** imports go only downwards: `app > pages > widgets > features > entities > shared`. Preserve the current zero cross-slice imports and zero cycles.
2. **Same-layer slices:** slices in the same layer must not import each other; entities may communicate only through the established `@x` mechanism.
3. **Public APIs:** outside a slice, import only its `index.ts`. Existing public APIs: `pages/archive`, `pages/cam-page`, `pages/client-dashboard`, `pages/event-list`, `widgets/camera-control`, `widgets/info`, `entities/bookmark`, `entities/camera`, `entities/event`, `entities/recording`, and `@/shared/ui`. When touching a slice without `index.ts` (`pages/auth`, `widgets/the-header`, `entities/camera-card` (unused), `entities/user-profile-card`), add one with explicit named re-exports and `export type` for types; never use `export *`. Inside a slice, use relative imports and never import through its own `index.ts`. Biome's `noBarrelFile` is disabled for the relevant FSD indexes.
4. **Segment names:** use `ui`, `api`, `model`, `lib`, `config`. Do not create `components`, `utils`, `hooks`, `types`, or `helpers`; existing `shared/components` and `shared/utils` are legacy.
5. **API and domain types:** new API functions and query hooks belong in `src/entities/<entity>/api/`; domain types belong in `src/entities/<entity>/model/` (planned targets include `session`, `user`, `camera`). Do not add API files to `src/api/` or query hooks to `src/pages/*/model/`. Page-specific URL state (filters, sorting, pagination) may live in `pages/*/model/`.
6. **Reuse existing data APIs:** camera: `cameraKeys`, `useCamerasQuery`, `useCameraQuery`, `useCameraStreamQuery`, `useCameraPlaybackQuery` from `@/entities/camera`; events: `eventKeys`, `useEventsQuery`, `useEventsInRangeQuery` from `@/entities/event`; recordings: `useRecordingsQuery` from `@/entities/recording`; bookmarks: `useBookmarksQuery`, `useCreateBookmarkMutation`, `useDeleteBookmarkMutation` from `@/entities/bookmark`. Bookmark mutations are the reference pattern. Optional queries accept `params | null` and use `skipToken`. Reuse `retryUnlessClientError` from `@/shared/api/retry` for new queries.
7. **UI placement:** split UI by role, even if there is one consumer. Entity representation belongs in `entities/*/ui`, user actions in `features`, and self-contained composed blocks in `widgets`. Use `shared/ui` only for domain-independent components and `shared/lib` only for generic helpers. A component needed by another page must not be imported from the first page; move it to the appropriate lower layer. Check existing UI before creating another version.
8. **Pages and layouts:** export `function Component()` because React Router lazy routes rely on it (`src/app/routes.ts`). Routes currently live in `src/app/routes.ts`; agreed target location is `src/app/router/`. `EmptyLayout` is used for `/` (login); `MainLayout` (header and toast provider) wraps `/dashboard`, `/:id/detail`, `/events`, `/archive`. Pages are lazy-loaded. There is no `errorElement` or route guard. Paths are duplicated in `ROUTES` (`src/shared/config/routes.ts`), `widgets/the-header`, and `pages/auth`; change related paths together.
9. **HTTP and errors:** use only `apiFetch<T>` from `@/shared/api/http`. Check errors with `isApiError(err)` and `ApiErrorCode` from `@/shared/api/authErrorCodes`. New MSW error bodies must use `{ error: '<CODE>', message }`; do not add `{ code, message }`.
10. **TanStack Query:** use v5 object syntax. Query keys start with the entity name (e.g. `['cameras', 'list']`) for prefix invalidation.
11. **MSW v2:** use `http`, `HttpResponse`, and `delay`. Register each new handler array in `src/mocks/handlers/index.js`, `src/mocks/browser.js`, and `src/mocks/server.js`. Current handler groups include `authHandlers`, `nvrHandlers`, `eventHandlers`, and `archiveHandlers`.
12. **Mocks boundary:** `src/mocks` is dev/test-only. Only `src/main.tsx`, `src/app/**`, and test infrastructure may import it; production code must not import `@/mocks/**`. Existing legacy exceptions: `entities/camera-card` and `entities/camera` (`model/types.ts`, `ui/CameraPlayer.tsx`) still re-export camera types/player dependencies from mocks until the owner-approved migration. Consumers must import from `@/entities/camera`. Mocks may import domain types, catalogs, and error codes from `@/entities/**` and `@/shared/**`, never the reverse. Do not move production hooks or domain types into mocks.
13. **Code conventions:** named exports only; components use `export function Name()`; props use `interface NameProps`; `.tsx` files PascalCase, other files camelCase, directories kebab-case. Use `@/` for cross-folder imports and `./` for same-folder imports. Put `import type` on its own line.
14. **Styles:** one `Name.module.scss` per component, BEM class names (`block__element`). `src/assets/scss/variables.scss` is auto-injected; do not import it. No JSX `style={...}`; use classes or SVG attributes for data-driven positions.
15. **Do not delete scaffolding or code just because it appears unused.** This is an explicit owner decision.
16. **Biome:** all rule groups, including `nursery`, run at error level. Sort imports, JSX attributes, object keys, and CSS properties as configured. No static JSX `id` (use `useId()`); regexes must be top-level, use `u` or `v`, and named capture groups; keep exports after non-exported declarations (`useExportsLast`); decorative SVGs need `aria-hidden="true"`; buttons should contain only inline elements. With `exactOptionalPropertyTypes`, do not pass `undefined` to optional props; use separate render branches. Every `biome-ignore` must name a specific rule and explain why.
17. **No inline-style suppressions:** do not add `biome-ignore` for `noInlineStyles`; use classes or SVG attributes instead.

## Access boundaries

- Stay inside the repository root. Never read or write home directories, neighboring projects, or global configuration.
- Source and configuration are read-only by default: `src/**`, `public/**`, `biome.json`, `package.json`, `tsconfig*`, `vite.config.*`, and similar files. Do not edit, rename, format, or install/update dependencies unless the user explicitly grants permission for the specific task.
- Writable locations are limited to `.claude/agents/**` and this `CLAUDE.md`. Do not assume any previously used `docs/ai/**` or audit files exist.
- Do not read `node_modules`, `dist`, `build`, `coverage`, `.env*`, or whole lockfiles. Do not inspect `.git` except for the explicitly listed read-only freshness commands.
- No network access. If a task requires a package installation or network access, stop and ask the user.

## Validation

Run only non-mutating checks unless the user explicitly authorizes write-mode commands.

- For changed source files: `yarn exec biome check <changed-files>` (without `--write` or `--unsafe`).
- TypeScript: use `yarn exec tsc --noEmit -p tsconfig.app.json` when appropriate; the repo also has `yarn lint:tsc` (`tsc -b`).
- Unit tests: `yarn test:ci` or a narrower Vitest invocation based on `package.json`.
- E2E: `yarn test:e2e:ci` or a narrower Playwright invocation.
- Build: `yarn build` when relevant.
- Do not run all validation automatically if it is disproportionate to the task. Report exact commands and outcomes. Check `package.json` before assuming scripts or commands exist.

## Architecture and runtime notes

### Bootstrap and state
In DEV, `src/main.tsx` dynamically imports `src/mocks/browser.js` and waits for `worker.start()` before rendering `StrictMode > QueryClientProvider > ReactQueryDevtools + RouterProvider`. The `QueryClient` (`src/main.tsx:10`) uses library defaults. There is no global store; server state lives in TanStack Query.

### FSD structure
- `pages`: `auth`, `client-dashboard`, `cam-page`, `event-list`, `archive` (thin archive composition; URL state is in `model/`).
- `widgets`: `the-header`, `info` (dashboard overview), `camera-control` (camera detail side panel), `archive-player`, `archive-timeline`, `archive-sidebar`.
- `features`: `archive-playback` (`usePlayback`, archive player and controls), `add-bookmark`, `delete-bookmark`.
- `entities`: `camera`, `event`, `recording`, `bookmark`. `entities/event` is the reference structure (`model/`, `api/`, `lib/`, `ui/`, `index.ts`). `camera-card` and `user-profile-card` are unused scaffolding; preserve them.
- `shared`: `api/` (`apiFetch`, `ApiErrorCode`, `retryUnlessClientError`, `PaginatedResponse`), `config/` (`ROUTES`, layout constants), `lib/` (generic helpers such as `time.ts` and `formatDate.ts`), `ui/` (`@/shared/ui`). `shared/components/callout` and `shared/utils` are legacy names.
- Outside FSD layers: `src/router`, `src/api/{auth,user}` (legacy API; target `entities/{session,user}`), `src/mocks` (dev/test only), and `src/assets`.
- `src/app/routes.ts` currently sits outside the FSD layers; the agreed target is `src/app/router/`.

### Data flow
Components call entity hooks, which call entity API functions and then `apiFetch<T>` (`src/shared/api/http.ts`) using relative `/api/...` URLs. Requests currently send no auth header and no default `Content-Type`. Non-2xx responses throw `ApiError { status, code, data }`, where `code` is read from `body.error`. Optional queries accept `params | null` and use `skipToken`; paginated lists use `keepPreviousData`. Event filters and archive camera/day/playback moment live in the URL under `pages/{event-list,archive}/model`.

### Video
Live view and archive playback use WHEP (WebRTC over HTTP). `entities/camera` owns the only player, `CameraPlayer`. `CameraLiveView` wraps it for live view; `features/archive-playback` reuses it through props. `useWebRtcPlayer` and some camera types remain in mocks as a legacy exception until the owner-approved migration. Import them from `@/entities/camera`, which re-exports them. WHEP has no native pause, seek, or speed control; archive seek, resume, or speed changes open a new session via the player's `key`.

### Auth and notifications
Login with optional 2FA is in `pages/auth` and legacy `src/api/auth`. Tokens are saved to `localStorage` but are not sent with requests. Check request failures using `isApiError` and `ApiErrorCode`. Main content uses `LoadError`; secondary blocks use `InlineError` (both from `@/shared/ui`). Toasts use `useCalloutMessage`, with a provider wrapping both layouts.

## MSW fixtures and scenarios

- Handler groups are in `src/mocks/handlers/`: `auth.js`, `nvr.ts` (including `mockWhep.ts`, which draws a canvas video stream), `events.ts`, `archive.ts`. Register new arrays in `handlers/index.js`, `browser.js`, and `server.js`.
- Legacy `nvr.ts` handlers return `{ code, message }`; the client reads `body.error`, so these become `UNKNOWN_ERROR`. For those existing endpoints, branch on `err.status` when needed. New handlers must use `{ error: '<ApiErrorCode>', message }`.
- Camera fixtures in `src/mocks/data/nvr.ts`: `cam-1` and `cam-2` are online, `cam-3` is in error (stream request returns 504 after 3 seconds), and `cam-4` has never connected. Events (30 days) and recordings (14 days) are generated deterministically. `GET /api/me/context` has no mock.
- All seven accounts in `src/mocks/data/accounts.json` use `Password123!`. `olga@example.com` and `petr.client@example.com` require OTP `123456`. `error500@example.com`, `timeout@example.com`, and `ratelimited@example.com` trigger error scenarios. Searching the event log for `error500` returns 500.
- Archive bookmarks persist under the `localStorage` key `mock-archive-bookmarks`.
- Detailed query/key/handler recipes are no longer assumed to exist outside this file. Use the existing source and `package.json` as the source of truth; ask before inventing missing project documentation.

## Map and audit context

When you identify issues during your work, document them in the corresponding report under `/docs/`:

- `/docs/arch-errors-report.md` — architecture issues (Architect).
- `/docs/dev-errors-report.md` — implementation issues (Developer).
- `/docs/test-errors-report.md` — testing issues (Tester).

**Reporting rules:**
- If the report file already exists, append new findings or update relevant entries without overwriting or deleting existing content.
- If the report file does not exist, create it.
- Include enough context for each finding to make it actionable: describe the issue, its location, and the potential impact.
- Do not modify application code solely to document an issue unless explicitly requested.