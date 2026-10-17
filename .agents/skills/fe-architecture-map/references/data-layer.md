# Data Layer: TanStack Query and MSW

> Commit: `9e5be8f` (measured at `e599d53`; `src/` identical) · Date: 2026-10-17 · Source: `docs/ai/reports/04-data-and-mocks.md`
> `UNVERIFIED`: library defaults (TanStack Query v5 `retry`/`staleTime`, MSW v2 `onUnhandledRequest`) are taken from version docs, not checked locally.
> Описывает, как слой данных устроен СЕЙЧАС и как вносить изменения. Находки и обоснования — только в отчёте.

## Versions and Configuration

- @tanstack/react-query: `5.95.2` (v5: `gcTime`, `isPending`, объектная сигнатура `useQuery({queryKey, queryFn})`)
- msw: `2.12.14` (v2: `http`, `HttpResponse`, `delay` из `msw`; `msw/browser`, `msw/node`)
- QueryClient: `src/main.tsx:10`, `new QueryClient()` без `defaultOptions` (дефолты v5: `retry: 3`, `staleTime: 0`). Тестовый клиент — `src/TestUtils.tsx:8` (`retry: false`).
- HTTP-клиент: `apiFetch<T>(url, init)` в `src/shared/api/http.ts`. URL относительные (`/api/...`), без `baseURL`, без заголовков. При `!res.ok` бросает `ApiError {status, code, data}`, где `code = body.error`. Проверка — `isApiError(err)`, коды — `ApiErrorCode` (`src/shared/api/authErrorCodes.ts`).
- MSW startup: browser — только при `import.meta.env.DEV`, `worker.start({quiet: true})` до рендера (`src/main.tsx:12-24`); node — `src/testSetup.ts` (`listen`/`resetHandlers`/`close`); worker — `public/mockServiceWorker.js` (git-ignored).

## Query Keys and Hooks

- Стратегия ключей: не сложилась, фабрики нет. Единственный ключ — литерал `['sidebar']` (`src/pages/client-dashboard/model/useClientDashboard.ts:7`).
- Расположение сейчас (legacy): API-функции — `src/api/<domain>/<domain>.ts`, типы — `src/api/<domain>/*types*.ts` и `src/mocks/data/nvrtypes.ts`, хуки — `src/pages/<page>/model/use*.ts`.
- Целевое расположение (согласовано владельцем 2026-10-17): `src/entities/<entity>/api/` (функции + хуки + ключи), `src/entities/<entity>/model/` (типы). Сущности: `session` (auth), `user`, `camera`. Новый код писать сразу туда.

## Queries and Mutations

| Hook | File | queryKey | API function | Method and path | Consumers |
|---|---|---|---|---|---|
| `useClientDashboard` | `src/pages/client-dashboard/model/useClientDashboard.ts` | `['sidebar']` | `getDashboard` (`src/api/user/user.ts`) | `GET /api/me/context` (мока нет) | нет (заготовка) |

| Mutation | File | What it invalidates | Error handling |
|---|---|---|---|
| `useLoginMutation` → `login` | `src/pages/auth/model/useAuth.ts` | ничего | `onError` в `mutate`, `src/pages/auth/Auth.tsx:53-89` |
| `useVerifyTwoFactorMutation` → `verifyTwoFactor` | `src/pages/auth/model/useAuth.ts` | ничего | `src/pages/auth/Auth.tsx:126-139` |

Вне TanStack Query: `useWebRtcPlayer` (`src/mocks/handlers/webrtc.ts`, целевое место — `entities/camera/lib`) делает прямой `fetch` на WHEP (`POST` SDP, `DELETE` сессии).

## MSW Mocks

| Method and path | Handler | Fixture/factory | API function | Hook |
|---|---|---|---|---|
| `POST /api/auth/login` | `src/mocks/handlers/auth.js:153` | `db.accounts` ← `data/accounts.json` | `login` | `useLoginMutation` |
| `POST /api/auth/login/2fa` | `auth.js:187` | `db.accounts`, in-memory `pendingTwoFactor` | `verifyTwoFactor` | `useVerifyTwoFactorMutation` |
| `POST /api/auth/refresh` | `auth.js:222` | — | — | — |
| `GET /api/auth/me` | `auth.js:241` | `activeSessions` (Bearer) | — | — |
| `POST /api/auth/logout` | `auth.js:259` | `activeSessions` | — | — |
| `GET /api/nvr` | `src/mocks/handlers/nvr.ts:34` | `getNvrInfo()` (`data/nvr.ts`) | — | — |
| `GET /api/nvr/ports` | `nvr.ts:39` | `poePorts` | — | — |
| `GET /api/cameras` | `nvr.ts:45` | `cameras` + `sortCameras` | — | — |
| `GET /api/cameras/:id` | `nvr.ts:50` | `cameras` | — | — |
| `GET /api/cameras/:id/stream` | `nvr.ts:60` | `cameras`, `whepUrl()` | — | — |
| `POST /api/webrtc/:id/whep` | `nvr.ts:80` | `createMockWhepSession` (`mockWhep.ts`) | `fetch` в плеере | `useWebRtcPlayer` |
| `DELETE /api/webrtc/:id/whep/:session` | `nvr.ts:106` | `closeMockWhepSession` | `fetch` в плеере | `useWebRtcPlayer` |

- Организация: по домену — `handlers/auth.js`, `handlers/nvr.ts` (+ `handlers/mockWhep.ts` — серверная сторона WHEP). `handlers/index.js` реэкспортирует массивы; `browser.js` и `server.js` перечисляют их явно (`...authHandlers, ...nvrHandlers`).
- Дубль `POST /api/auth/login` в `auth.js:253` (503) недостижим: срабатывает первый хендлер.
- Формат ошибок: auth — `{error, message, ...}` (совместим с `apiFetch`); nvr — `{code, message}` (`ApiErrorBody`, `apiFetch` его не распознаёт → `UNKNOWN_ERROR`). Новые хендлеры писать в формате `{error, message}`.
- Fixtures: статичные — `data/accounts.json` (7 аккаунтов, все `active`; 2FA у `olga@example.com`, `petr.client@example.com`; пароль `Password123!`; OTP `123456`), `data/nvr.ts` (4 камеры: `cam-1`, `cam-2` online, `cam-3` error, `cam-4` no_connection; 4 PoE-порта). `db.js` клонирует JSON при старте.
- Сценарные email (`auth.js`): `error500@example.com` → 500; `timeout@example.com` → бесконечная задержка; `ratelimited@example.com` → 429; 3 неверных пароля → 423.
- Задержки: nvr 200–400 мс, `cam-3` (error) — 3000 мс.
- In-memory состояние: `auth.js:8-11` (Maps/Set), `db.js`. Сброс: `resetMockState()` (`auth.js`), `resetDb()` (`db.js`); сейчас нигде не вызываются.
- `onUnhandledRequest`: не задан (дефолт v2 — `'warn'`).

## Recipes

1. **Новый query + мок** (пример: список камер):
   1. Типы — `src/entities/camera/model/types.ts` (пока типы камеры лежат в `src/mocks/data/nvrtypes.ts`; при первом касании перенести, моки импортируют из `@/entities/camera`).
   2. API-функция — `src/entities/camera/api/getCameras.ts`: `apiFetch<Camera[]>('/api/cameras')` из `@/shared/api/http`.
   3. Хук и ключ — там же: `useQuery({queryKey: ['cameras', 'list'], queryFn: getCameras})`. Ключ начинать с имени сущности, чтобы инвалидировать по префиксу.
   4. Public API — экспорт хука из `src/entities/camera/index.ts`.
   5. Мок — хендлер в `src/mocks/handlers/<domain>.ts` (`http.get('/api/...', () => HttpResponse.json(data))`). Если создан новый массив хендлеров — добавить его в `handlers/index.js`, `browser.js` и `server.js`.
   6. Фикстура — `src/mocks/data/<domain>.ts`, типизированная типами сущности. Ошибки отдавать как `{error: '<ApiErrorCode>', message}`; новый код добавить в `src/shared/api/authErrorCodes.ts`.
   7. Проверка: `yarn exec tsc --noEmit`, `yarn exec biome check <файлы>`, ручной прогон в `yarn dev` (MSW активен в DEV).
2. **Мутация с инвалидацией** (примеров в проекте нет): в `src/entities/<entity>/api/` — `useMutation({mutationFn, onSuccess: () => queryClient.invalidateQueries({queryKey: ['<entity>']})})`, где `queryClient = useQueryClient()`. Обработку ошибок формы оставлять в UI через `isApiError(err)` + `ApiErrorCode`.
3. **Переопределение хендлера в тесте**: `import {server} from '@/mocks/server'`; в тесте `server.use(http.post('/api/auth/login', () => HttpResponse.json({error: 'SERVICE_UNAVAILABLE', message: '…'}, {status: 503})))`. Хендлеры сбрасывает `afterEach` в `src/testSetup.ts`; in-memory состояние — вручную через `resetMockState()`/`resetDb()`. Рендер — `render` из `src/TestUtils.tsx` (QueryClient + BrowserRouter). Тестов пока нет: решение владельца, тесты будут позже.
4. **Переключение на реальный бэкенд**: production-сборка MSW не запускает. Для DEV против бэкенда сейчас нужна правка кода. Шаги: (1) флаг в `enableMocking` (`src/main.tsx:12-20`), например `VITE_API_MOCKS`; (2) `server.proxy['/api']` в `vite.config.ts` или base URL в `apiFetch`; (3) `Content-Type: application/json` и `Authorization: Bearer <accessToken>` в `apiFetch`; (4) сверить формат ошибок с `{error, message}`; (5) `StreamInfo`/ICE — из `GET /api/cameras/:id/stream`.

## Known Issues

Факты, которые нужно учитывать при работе (полный список и обоснования — `docs/ai/reports/04-data-and-mocks.md`, план — `docs/ai/reports/06-roadmap.md`):

- Ошибки nvr/cameras приходят как `{code, message}` и в клиенте превращаются в `UNKNOWN_ERROR`. Не полагаться на `err.code` для этих эндпоинтов.
- Чтобы получить 503 для `POST /api/auth/login`, используйте `server.use(...)`: хендлер в `auth.js:253` не срабатывает.
- У `GET /api/me/context` нет мока. Прежде чем включать `useClientDashboard`, добавьте хендлер.
- `apiFetch` возвращает `{}`, если успешный ответ не JSON, и не отправляет `Authorization` и `Content-Type`.
- Видео в DEV идёт через `mockWhep.ts` по обычному пути WHEP; ветка `window.__MSW_ACTIVE__` в плеере не выполняется.
