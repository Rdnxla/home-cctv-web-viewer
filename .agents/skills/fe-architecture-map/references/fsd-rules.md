# FSD Rules (benchmark for audit and development)

> Commit: `8014d73` + незакоммиченная страница архива · Date: 2026-10-18 · Generic FSD rules + project-specific placement (section "Project placement"), agreed with the owner on 2026-10-17.

Consult the up-to-date documentation at https://feature-sliced.design whenever in doubt (this is the source of truth for the rules). This file defines the criteria used for audits.

## Layers (top to bottom)

`app` > `pages` > `widgets` > `features` > `entities` > `shared`

The `processes` layer is deprecated: flag its presence as an issue and migrate its contents to `pages`, `features`, or `app`.

- `app` and `shared` are not divided into slices; they contain segments directly, and segments may import one another.
- `pages`, `widgets`, `features`, and `entities` are divided into slices (a folder per domain/concept), with segments located inside each slice.

## Import Rules

1. A slice module imports only from layers STRICTLY below it. Importing upwards or into a different slice within the same layer is prohibited.
2. Slices within the same layer are isolated: `features/a` is unaware of `features/b`. Exception: `entities` may reference each other via a special Public API `@x` (e.g., `entities/song/@x/artist.ts`)—and *only* via this mechanism. Frequent coupling indicates incorrect boundaries; consider merging the slices or moving the composition up a layer (`widgets`/`pages`).
3. External imports into a slice must go through its Public API (the root `index`). Deep imports (e.g., `@/features/auth/ui/Form`) violate this rule. Relative imports are permitted within a slice.
4. For `shared`, a Public API at the segment level is recommended (e.g., `shared/ui/index`, `shared/api/index`); deep imports into `shared` are less critical, but consistency is desirable.
5. Circular dependencies between slices are not allowed.

## Segments

Named by purpose rather than technical nature:

| Segment | Contents |
|---|---|
| `ui` | components, styles, display formatting |
| `api` | backend requests, DTOs, mappers, (in our case) query hooks specific to the project's implementation |
| `model` | business logic, state, schemas, domain types |
| `lib` | helper code specific to this slice |
| `config` | constants, flags |

Names to avoid: `components`, `hooks`, `types`, `utils`, `helpers`, `common`, `misc`. These group items by technical nature and tend to turn into dumping grounds. Custom segments are permissible if named according to their purpose.

## Layer Roles

- `shared`: reusable base with no business knowledge (UI kit, HTTP client, utilities, config). No domain logic or references to specific features.
- `entities`: business entities (user, product, order), including their models, UI representations, and API interfaces. No user scenarios.
- `features`: reusable user scenarios that deliver business value (add to cart, log in). Not every action needs to be a feature; if it is used in only one place, keep it in `pages` or `widgets`.
- `widgets`: large, self-contained interface blocks composed of features and entities (header, feed). If a block is needed on only one page, it belongs on that page.
- `pages`: screens/routes; a lightweight composition of widgets and features. Page-specific logic (data, forms) is acceptable, but not reusable business logic.
- `app`: initialization: providers, router, global styles, MSW setup. No business logic.

## Finding Severity Scale

| What | Seriousness |
|---|---|
| Import up through layers, loop between slices | high |
| Import between slices of the same layer (except `@x`) | high |
| Business logic in `shared`, layer `processes` | medium-high |
| Import by Public API; slice without `index` | medium |
| Segments `components/hooks/types/utils`, dumps | medium |
| Too small/large slices, lack of uniformity | low-medium |
| Cosmetics naming | low |

## What the `fsd-imports.mjs` script can and cannot do

Can do: edges between slices, `layer-upward`, `cross-slice`, `non-public-api`, `deprecated-layer`, slices without `index`, loops, third-party layer packages. Doesn't know how to: evaluate the contents of `shared`, boundaries of entities and features, size of slices, names of segments by meaning, dynamic imports with variables, aliases from `vite.config` (reads only `paths` from tsconfig). These are manual phase 2 checks.

Project-specific behaviour:
- Folders outside FSD layers (`src/api`, `src/mocks`, `src/router`) appear as `?api`, `?mocks`, `?router` with rank −1. Imports *from* them into any layer are reported as `layer-upward` (false positives); imports *into* them from layers are NOT reported. Check `entities|features|widgets|pages → ?mocks|?api` edges manually in `imports.json`.
- Root files `src/main.tsx`, `src/testSetup.ts`, `src/TestUtils.tsx` are not part of the graph.
- Only JS/TS is scanned; SCSS `@use` dependencies are invisible.

For automatic control in CI, you can consider Steiger (the official FSD linter). Installation requires a separate decision from the owner.

## Project placement (agreed with the owner, 2026-10-17)

| What | Where (target) | Legacy location still in use |
|---|---|---|
| Router config | `src/app/router/` | `src/router/routes.ts` |
| Providers (QueryClient, Theme) | `src/app/providers/` | `src/main.tsx`, both layouts |
| Session/auth API + types | `src/entities/session/{api,model}` | `src/api/auth/*` |
| User API + types | `src/entities/user/{api,model,ui}` | `src/api/user/*`, `src/entities/user-profile-card` |
| Camera types, WebRTC player, camera UI | `src/entities/camera/{model,lib,ui,api}` — **слайс создан**: `api/` (запросы), `ui/` (плеер, `CameraLiveView`, `StreamPlaceholder`, статус, сведения, плитка), `model/status.ts`, `lib/format.ts`, `index.ts` | ещё не перенесены (решение владельца 2026-10-17, M-2): определения типов — `src/mocks/data/nvrtypes.ts` (реэкспорт в `entities/camera/model/types.ts`), плеер — `src/mocks/handlers/webrtc.ts`. `src/entities/camera-card` — без потребителей с рефакторинга дашборда, удаление/слияние ждёт решения владельца (Q11) |
| Route paths for links below `app` | `src/shared/config/routes.ts` (`ROUTES`) — `pages`/`entities` не могут импортировать `app`, поэтому не `app/router/paths.ts` из M-6 | строки путей в `Auth.tsx:36`, `TheHeader.tsx:9-11` |
| Event log entity (types, catalog, query, badge) | `src/entities/event/{model,api,lib,ui}` + `index.ts` — **создан сразу в целевом виде**: типы определены в сущности, моки импортируют их из `@/entities/event` | — |
| Archive recordings, bookmarks | `src/entities/recording/{model,api,ui}` и `src/entities/bookmark/{model,api}` + `index.ts` — **созданы в целевом виде** (2026-10-18): типы в сущностях, моки (`mocks/{data,handlers}`) импортируют их оттуда. Воспроизведение архива — в `entities/camera` (`useCameraPlaybackQuery`, `PLAYBACK_SPEEDS`), потому что ему нужен плеер камеры | — |
| Archive page logic (URL, playback clock, timeline math) | `src/pages/archive/{model,lib}` — используется одной страницей, поэтому не в `features`/`shared`; доменно-нейтральные форматтеры, нужные шире, — `shared/lib` (`formatDuration`, `formatFileSize`, `useNow`) | — |
| Shared UI / helpers | `src/shared/ui` (создан: `inline-error/`, `load-error/`, `pagination/`, `search-field/`, `sortable-header-cell/` + `ui/index.ts`), `src/shared/lib` (создан: `useFullscreen`, `captureVideoFrame`, `downloadBlob`, `isOneOf`, `pluralize`, `formatRelativeTime`), `src/shared/api` (`pagination.ts`, `retry.ts`), `src/shared/config` (`routes.ts`, `layout.ts`) | `src/shared/components`, `src/shared/utils` |
| UI, нужный двум страницам | не в одной из страниц (cross-slice), а ниже: доменный — в `entities/<x>/ui` (пример: `StreamPlaceholder` перенесён из `pages/cam-page` в `entities/camera`), без домена — в `shared/ui` или `shared/config` (пример: `CONTENT_WITH_ASIDE_COLUMNS`) | — |
| Page-specific URL state, parsing | `src/pages/<page>/model/` (пример: `pages/event-list/model/eventListParams.ts`) — это не API-код, правило «no API code in `pages/*/model`» не нарушается | — |
| MSW (handlers, fixtures, in-memory db) | `src/mocks/**` — outside layers, dev/test-only; may import `entities/*` and `shared/*` (типы, каталоги, коды ошибок) | — |
| Reusable user scenarios | `src/features/` (empty placeholder) | — |

Accepted exceptions: `widgets/info` and `widgets/camera-control` stay widgets despite a single consumer (planned reuse). `entities/camera` и `entities/camera-card` импортируют `@/mocks/**` (legacy, решение владельца 2026-10-17 до M-2); новые потребители берут типы и плеер только из `@/entities/camera`, не из моков.
