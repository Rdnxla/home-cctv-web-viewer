# Data Layer: TanStack Query and MSW

> Commit: `8014d73` + незакоммиченная страница архива (рабочая копия; остальное measured at `e599d53`) · Date: 2026-10-18 · Source: `docs/ai/reports/04-data-and-mocks.md`, запросы — код `src/entities/{camera,event,recording,bookmark}/api/`, моки журнала и архива — `src/mocks/{data,handlers}/{events,archive,recordings,bookmarks}.ts`
> `UNVERIFIED`: library defaults (TanStack Query v5 `retry`/`staleTime`, MSW v2 `onUnhandledRequest`) are taken from version docs, not checked locally.
> Описывает, как слой данных устроен СЕЙЧАС и как вносить изменения. Находки и обоснования — только в отчёте.

## Versions and Configuration

- @tanstack/react-query: `5.95.2` (v5: `gcTime`, `isPending`, объектная сигнатура `useQuery({queryKey, queryFn})`)
- msw: `2.12.14` (v2: `http`, `HttpResponse`, `delay` из `msw`; `msw/browser`, `msw/node`)
- QueryClient: `src/main.tsx:10`, `new QueryClient()` без `defaultOptions` (дефолты v5: `retry: 3`, `staleTime: 0`). Тестовый клиент — `src/TestUtils.tsx:8` (`retry: false`).
- HTTP-клиент: `apiFetch<T>(url, init)` в `src/shared/api/http.ts`. URL относительные (`/api/...`), без `baseURL`, без заголовков. При `!res.ok` бросает `ApiError {status, code, data}`, где `code = body.error`. Проверка — `isApiError(err)`, коды — `ApiErrorCode` (`src/shared/api/authErrorCodes.ts`).
- MSW startup: browser — только при `import.meta.env.DEV`, `worker.start({quiet: true})` до рендера (`src/main.tsx:12-24`); node — `src/testSetup.ts` (`listen`/`resetHandlers`/`close`); worker — `public/mockServiceWorker.js` (git-ignored).

## Query Keys and Hooks

- Стратегия ключей: фабрика `cameraKeys` в `src/entities/camera/api/cameraQueries.ts` — `all: ['cameras']`, `list() → ['cameras','list']`, `detail(id) → ['cameras','detail',id]`, `stream(id) → ['cameras','stream',id]`; инвалидация по префиксу `cameraKeys.all`. Это образец для новых сущностей. Фабрика `eventKeys` (`src/entities/event/api/eventQueries.ts`): `all: ['events']`, `list(params) → ['events','list', EventListParams]` — объект параметров целиком в ключе; массивы `categories`/`types` нормализованы в порядке констант, поэтому одинаковые выборки дают одинаковый ключ. Архив: `cameraKeys.playback(id, params) → ['cameras','playback',id,{from,speed}]`; `eventKeys.range(params) → ['events','range',{cameraId,from,to}]`; `recordingKeys` (`src/entities/recording/api/recordingQueries.ts`): `all: ['recordings']`, `list(params) → ['recordings','list',{cameraId,from,to}]`; `bookmarkKeys` (`src/entities/bookmark/api/bookmarkQueries.ts`): `all: ['bookmarks']`, `list(cameraId) → ['bookmarks','list',cameraId]`. Хуки с необязательным запросом принимают `params | null` и используют `skipToken` (`useRecordingsQuery`, `useEventsInRangeQuery`, `useCameraPlaybackQuery`). Legacy-литерал — `['sidebar']` (`src/pages/client-dashboard/model/useClientDashboard.ts:7`).
- Имена хуков: query — `use<Noun>Query` (`useCamerasQuery`, `useCameraQuery`, `useCameraStreamQuery`, `useEventsQuery`), mutation — `use<Action>Mutation`.
- Списки с серверной пагинацией: ответ `PaginatedResponse<T>` (`src/shared/api/pagination.ts`: `{items, page, pageSize, total}`, `page` с 1), `placeholderData: keepPreviousData` — при смене страницы/фильтра таблица не пропадает. Образец — `useEventsQuery`.
- Повторы: `retryUnlessClientError` (`src/shared/api/retry.ts`) у запросов камер и событий — 4xx не повторяются, 5xx и сетевые ошибки — до 2 раз (глобальные `defaultOptions` — QW-10, не сделано).
- Расположение сейчас: камеры — целевое `src/entities/camera/api/` (функции `cameraApi.ts`, ключи и хуки `cameraQueries.ts`), но типы камеры по-прежнему в `src/mocks/data/nvrtypes.ts` (реэкспорт `src/entities/camera/model/types.ts`, решение владельца 2026-10-17). Legacy: API-функции — `src/api/<domain>/<domain>.ts`, типы — `src/api/<domain>/*types*.ts`, хуки — `src/pages/<page>/model/use*.ts`.
- Целевое расположение (согласовано владельцем 2026-10-17): `src/entities/<entity>/api/` (функции + хуки + ключи), `src/entities/<entity>/model/` (типы). Сущности: `session` (auth), `user`, `camera`. Новый код писать сразу туда.

## Queries and Mutations

| Hook | File | queryKey | API function | Method and path | Consumers |
|---|---|---|---|---|---|
| `useClientDashboard` | `src/pages/client-dashboard/model/useClientDashboard.ts` | `['sidebar']` | `getDashboard` (`src/api/user/user.ts`) | `GET /api/me/context` (мока нет) | нет (заготовка; вызов закомментирован в `pages/client-dashboard/ui/ClientDashboard.tsx`) |
| `useCamerasQuery` | `src/entities/camera/api/cameraQueries.ts` | `cameraKeys.list()` | `getCameras` (`src/entities/camera/api/cameraApi.ts`) | `GET /api/cameras` | `pages/cam-page/ui/OtherCameras.tsx`, `pages/client-dashboard/ui/{ClientDashboard,CameraGrid}.tsx`, `pages/event-list/ui/EventFilters.tsx`, `widgets/info/ui/CameraSummary.tsx` |
| `useCameraQuery(id)` | то же | `cameraKeys.detail(id)` | `getCamera` | `GET /api/cameras/:id` | `pages/cam-page/ui/CamPage.tsx`; `placeholderData` — камера из кеша `cameraKeys.list()` |
| `useCameraStreamQuery(id, enabled)` | то же | `cameraKeys.stream(id)` | `getCameraStream` | `GET /api/cameras/:id/stream` | `entities/camera/ui/CameraLiveView.tsx` (→ страница камеры и каждая ячейка сетки дашборда); `enabled` только при `status === 'online'`, `refetchOnWindowFocus: false` |
| `useEventsQuery(params)` | `src/entities/event/api/eventQueries.ts` | `eventKeys.list(params)` | `getEvents` (`src/entities/event/api/eventApi.ts`; период → `from` в момент запроса) | `GET /api/events` | `pages/event-list/ui/EventList.tsx` (параметры из URL); `widgets/info/ui/RecentEvents.tsx` (`RECENT_EVENTS_PARAMS`: `period: '24h'`, `pageSize: 10`, новые сверху); `keepPreviousData` |
| `useEventsInRangeQuery(params \| null)` | то же | `eventKeys.range(params)` | `getEventsInRange` (`source=<cameraId>`, `from`, `to`, `sort=occurredAt`, `order=asc`, `pageSize=100`) | `GET /api/events` | `pages/archive/ui/ArchiveViewer.tsx` (события камеры за день: шкала, список, переходы ⏮/⏭); больше 100 за день — в списке «Показаны первые 100 из N» |
| `useCameraPlaybackQuery(id, params \| null)` | `src/entities/camera/api/cameraQueries.ts` | `cameraKeys.playback(id, params)` | `getCameraPlayback` (`from` ISO, `speed` из `PLAYBACK_SPEEDS`) | `GET /api/cameras/:id/playback` | `pages/archive/model/usePlayback.ts`; ответ — `StreamInfo` с `whepUrl` сеанса воспроизведения; `refetchOnWindowFocus: false` |
| `useRecordingsQuery(params \| null)` | `src/entities/recording/api/recordingQueries.ts` | `recordingKeys.list(params)` | `getRecordings` (`recordingApi.ts`) | `GET /api/cameras/:id/recordings?from&to` | `pages/archive/ui/ArchivePage.tsx` (один запрос на камеру и день: шкала, файлы, границы архива для календаря); пока `to` в будущем — `refetchInterval` 60 с |
| `useBookmarksQuery(cameraId)` | `src/entities/bookmark/api/bookmarkQueries.ts` | `bookmarkKeys.list(cameraId)` | `getBookmarks` (`bookmarkApi.ts`) | `GET /api/bookmarks?cameraId` | `pages/archive/ui/ArchiveViewer.tsx` (шкала и вкладка «Закладки») |

| Mutation | File | What it invalidates | Error handling |
|---|---|---|---|
| `useLoginMutation` → `login` | `src/pages/auth/model/useAuth.ts` | ничего | `onError` в `mutate`, `src/pages/auth/Auth.tsx:53-89` |
| `useVerifyTwoFactorMutation` → `verifyTwoFactor` | `src/pages/auth/model/useAuth.ts` | ничего | `src/pages/auth/Auth.tsx:126-139` |
| `useCreateBookmarkMutation` → `createBookmark` (`POST`, `Content-Type: application/json`) | `src/entities/bookmark/api/bookmarkQueries.ts` | `bookmarkKeys.all` (в хуке, `onSuccess`) | текст ошибки в форме `pages/archive/ui/AddBookmarkButton.tsx`; успех — toast |
| `useDeleteBookmarkMutation` → `deleteBookmark` (`DELETE`, ответ 204) | то же | `bookmarkKeys.all` | toast в `pages/archive/ui/BookmarkList.tsx` (мутация в списке, а не в строке: строка размонтируется раньше колбэков `mutate`) |

Вне TanStack Query: `useWebRtcPlayer` (`src/mocks/handlers/webrtc.ts`, целевое место — `entities/camera/lib`) делает прямой `fetch` на WHEP (`POST` SDP, `DELETE` сессии). Потребители — `entities/camera/ui/CameraPlayer.tsx` (`StreamInfo` из `useCameraStreamQuery` через `CameraLiveView`) и неиспользуемый `entities/camera-card/CameraCard.tsx` (захардкоженный `cam-1`). На дашборде WHEP-сессий столько, сколько камер `online` (в фикстуре — 2).

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
| `GET /api/cameras` | `nvr.ts:45` | `cameras` + `sortCameras` | `getCameras` | `useCamerasQuery` |
| `GET /api/cameras/:id` | `nvr.ts:50` | `cameras` | `getCamera` | `useCameraQuery` |
| `GET /api/cameras/:id/stream` | `nvr.ts:60` | `cameras`, `whepUrl()` | `getCameraStream` | `useCameraStreamQuery` |
| `POST /api/webrtc/:id/whep` | `nvr.ts:80` | `createMockWhepSession` (`mockWhep.ts`) | `fetch` в плеере | `useWebRtcPlayer` |
| `DELETE /api/webrtc/:id/whep/:session` | `nvr.ts:106` | `closeMockWhepSession` | `fetch` в плеере | `useWebRtcPlayer` |
| `GET /api/events` | `src/mocks/handlers/events.ts` | `events` (`data/events.ts`, генератор) | `getEvents`, `getEventsInRange` | `useEventsQuery`, `useEventsInRangeQuery` |
| `GET /api/cameras/:id/recordings` | `src/mocks/handlers/archive.ts` | `getCameraRecordings` (`data/recordings.ts`) | `getRecordings` | `useRecordingsQuery` |
| `GET /api/cameras/:id/playback` | `archive.ts` | `hasRecordingAt` | `getCameraPlayback` | `useCameraPlaybackQuery` |
| `POST /api/playback/:id/whep` | `archive.ts` | `createMockWhepSession(offer, name, {from, speed})` | `fetch` в плеере | `useWebRtcPlayer` |
| `DELETE /api/playback/:id/whep/:session` | `archive.ts` | `closeMockWhepSession` | `fetch` в плеере | `useWebRtcPlayer` |
| `GET /api/bookmarks` | `archive.ts` | `listBookmarks` (`data/bookmarks.ts`) | `getBookmarks` | `useBookmarksQuery` |
| `POST /api/bookmarks` | `archive.ts` | `addBookmark` | `createBookmark` | `useCreateBookmarkMutation` |
| `DELETE /api/bookmarks/:id` | `archive.ts` | `removeBookmark` | `deleteBookmark` | `useDeleteBookmarkMutation` |

- Организация: по домену — `handlers/auth.js`, `handlers/nvr.ts` (+ `handlers/mockWhep.ts` — серверная сторона WHEP, живое видео и архив), `handlers/events.ts`, `handlers/archive.ts` (записи, воспроизведение, закладки). `handlers/index.js` реэкспортирует массивы; `browser.js` и `server.js` перечисляют их явно (`...authHandlers, ...nvrHandlers, ...eventHandlers, ...archiveHandlers`).
- Типы для новых моков: импортировать из сущности (`import type {NvrEvent} from '@/entities/event'`), не объявлять в `src/mocks` (так сделан журнал событий; камеры — legacy, типы пока в `data/nvrtypes.ts`).
- `GET /api/events` — параметры и поведение:
  - `page` (целое ≥ 1, по умолчанию 1), `pageSize` (10 | 25 | 50 | 100, по умолчанию 25), `sort` (`occurredAt` | `category` | `type` | `source`), `order` (`asc` | `desc`), `category` и `type` (повторяемые), `source` (id камеры или `device` — события самого NVR), `from` и `to` (ISO 8601, период `[from, to)`; `to` добавлен для архива), `q` (поиск без учёта регистра по описанию, названию типа и источнику).
  - Порядок обработки: валидация → фильтры, кроме категории → `categoryCounts` → фильтр категории → сортировка (`category` — по `rank`, `type`/`source` — по русской подписи через `Intl.Collator('ru')`; при равенстве — новые выше, затем `id`) → срез страницы. Ответ — `EventListResponse` = `PaginatedResponse<NvrEvent>` + `categoryCounts`.
  - Страница за пределами выборки → `items: []` с реальным `total` (UI сам переходит на последнюю страницу).
  - Ошибки: неверный параметр → 400 `{error: 'VALIDATION_ERROR', message}` (текст называет параметр); `q=error500` → 500 `{error: 'INTERNAL_ERROR', message}`.
- Архив (`handlers/archive.ts`):
  - `GET /api/cameras/:id/recordings?from&to` → `RecordingListResponse` = `{bounds: {from, to} | null, items: Recording[]}`: файлы, пересекающие `[from, to)`, по возрастанию; `bounds` — весь архив камеры (`null` — записей нет, `cam-4`). Файл, который пишется сейчас, — `endedAt: null`, растёт с каждым запросом. Ошибки: 404 `CAMERA_NOT_FOUND`; 400 `VALIDATION_ERROR` — нет/неверные даты, `to <= from` или период длиннее 48 ч.
  - `GET /api/cameras/:id/playback?from&speed` → `StreamInfo` с `whepUrl = /api/playback/:id/whep?from&speed`. Ошибки: 404 `CAMERA_NOT_FOUND`; 404 `RECORDING_NOT_FOUND` — в момент `from` записи нет (клиент сам сдвигает момент к ближайшей записи, `pages/archive/lib/coverage.ts`); 400 — `from` не дата, `speed` не в `(0, 16]`. Статус камеры не проверяется: архив `cam-3` (`error`) воспроизводится.
  - `POST /api/playback/:id/whep` — как живой WHEP, но холст рисует время записи (`from` + прошедшее × `speed`, отсчёт с ответа плееру) и метку «АРХИВ ×N». 415 `INVALID_BODY` без `Content-Type: application/sdp`.
  - `GET /api/bookmarks?cameraId` — закладки камеры (без параметра — всех), новые моменты сверху. `POST /api/bookmarks` `{cameraId, at, title}` → 201 `Bookmark`; 400 `VALIDATION_ERROR`: камеры нет, `at` не дата или в будущем, `title` после `trim` пуст или длиннее `BOOKMARK_TITLE_MAX_LENGTH` (80, `@/entities/bookmark`). `DELETE /api/bookmarks/:id` → 204; 404 `BOOKMARK_NOT_FOUND`.
- Дубль `POST /api/auth/login` в `auth.js:253` (503) недостижим: срабатывает первый хендлер.
- Формат ошибок: auth — `{error, message, ...}` (совместим с `apiFetch`); nvr — `{code, message}` (`ApiErrorBody`, `apiFetch` его не распознаёт → `UNKNOWN_ERROR`). Новые хендлеры писать в формате `{error, message}`.
- Fixtures: статичные — `data/accounts.json` (7 аккаунтов, все `active`; 2FA у `olga@example.com`, `petr.client@example.com`; пароль `Password123!`; OTP `123456`), `data/nvr.ts` (4 камеры: `cam-1`, `cam-2` online, `cam-3` error, `cam-4` no_connection; 4 PoE-порта). `db.js` клонирует JSON при старте. Генерируемая — `data/events.ts`: 640 событий за 30 дней + 1 `video_loss` для `cam-3` в момент её `lastSeen`; ГПСЧ Park–Miller с фиксированным зерном — набор одинаков при каждом запуске, время отсчитывается от загрузки модуля; события камер — только `cam-1`…`cam-3` и только до их `lastSeen` (`cam-4` не подключалась), `disk_*`, `power_failure`, `login_failed` — без камеры; id `evt-00001` — самое старое. Генерируемая — `data/recordings.ts`: архив глубиной 14 дней (журнал — 30), согласован с журналом и фикстурой камер: `cam-1`, `cam-3` пишут постоянно (`continuous`) с разрывами 4 мин перед `network_unstable` и 2 мин после `disk_error`; `cam-2` — только вокруг своих событий (`event`, −10 с…+50 с); `cam-3` перестала писать в `lastSeen`; у `cam-4` записей нет; файлы режутся по границам часа (UTC), размер — по битрейту камеры. `data/bookmarks.ts`: 3 начальные закладки на последние записанные события (`person` у `cam-1`, `vehicle` у `cam-2`, `motion` у `cam-3`).
- Сценарные email (`auth.js`): `error500@example.com` → 500; `timeout@example.com` → бесконечная задержка; `ratelimited@example.com` → 429; 3 неверных пароля → 423. Журнал: поиск `error500` → 500.
- Задержки: nvr 200–400 мс, `cam-3` (error) — 3000 мс, `GET /api/events` — 350 мс, архив: файлы 300 мс, воспроизведение 250 мс, закладки 200–300 мс.
- In-memory состояние: `auth.js:8-11` (Maps/Set), `db.js`, закладки `data/bookmarks.ts` (дополнительно сохраняются в `localStorage`, ключ `mock-archive-bookmarks`, чтобы переживать перезагрузку в DEV; где хранилища нет — только память; функции сброса нет — очистить ключ вручную). Сброс: `resetMockState()` (`auth.js`), `resetDb()` (`db.js`); сейчас нигде не вызываются.
- `onUnhandledRequest`: не задан (дефолт v2 — `'warn'`).

## Recipes

1. **Новый query + мок** (пример: список камер):
   1. Типы — `src/entities/camera/model/types.ts`. Сейчас это реэкспорт из `src/mocks/data/nvrtypes.ts` (владелец 2026-10-17 решил пока не переносить); перенос определений и импорт типов моками из `@/entities/camera` — по M-2. Готовые запросы камер — `src/entities/camera/api/` (образец для шагов 2–4).
   2. API-функция — `src/entities/camera/api/getCameras.ts`: `apiFetch<Camera[]>('/api/cameras')` из `@/shared/api/http`.
   3. Хук и ключ — там же: `useQuery({queryKey: ['cameras', 'list'], queryFn: getCameras})`. Ключ начинать с имени сущности, чтобы инвалидировать по префиксу.
   4. Public API — экспорт хука из `src/entities/camera/index.ts`.
   5. Мок — хендлер в `src/mocks/handlers/<domain>.ts` (`http.get('/api/...', () => HttpResponse.json(data))`). Если создан новый массив хендлеров — добавить его в `handlers/index.js`, `browser.js` и `server.js`.
   6. Фикстура — `src/mocks/data/<domain>.ts`, типизированная типами сущности. Ошибки отдавать как `{error: '<ApiErrorCode>', message}`; новый код добавить в `src/shared/api/authErrorCodes.ts`.
   7. Проверка: `yarn exec tsc --noEmit`, `yarn exec biome check <файлы>`, ручной прогон в `yarn dev` (MSW активен в DEV).
2. **Мутация с инвалидацией** (образец — `src/entities/bookmark/api/bookmarkQueries.ts`): в `src/entities/<entity>/api/` — `useMutation({mutationFn, onSuccess: () => queryClient.invalidateQueries({queryKey: <entity>Keys.all})})`, где `queryClient = useQueryClient()`; тело JSON — с `headers: {'Content-Type': 'application/json'}` (`apiFetch` его сам не ставит). Обработку ошибок формы оставлять в UI через `isApiError(err)` + `ApiErrorCode`; колбэки `mutate(vars, {onSuccess})` вешать в компоненте, который переживает обновление списка.
3. **Переопределение хендлера в тесте**: `import {server} from '@/mocks/server'`; в тесте `server.use(http.post('/api/auth/login', () => HttpResponse.json({error: 'SERVICE_UNAVAILABLE', message: '…'}, {status: 503})))`. Хендлеры сбрасывает `afterEach` в `src/testSetup.ts`; in-memory состояние — вручную через `resetMockState()`/`resetDb()`. Рендер — `render` из `src/TestUtils.tsx` (QueryClient + BrowserRouter). Тестов пока нет: решение владельца, тесты будут позже.
4. **Переключение на реальный бэкенд**: production-сборка MSW не запускает. Для DEV против бэкенда сейчас нужна правка кода. Шаги: (1) флаг в `enableMocking` (`src/main.tsx:12-20`), например `VITE_API_MOCKS`; (2) `server.proxy['/api']` в `vite.config.ts` или base URL в `apiFetch`; (3) `Content-Type: application/json` и `Authorization: Bearer <accessToken>` в `apiFetch`; (4) сверить формат ошибок с `{error, message}`; (5) `StreamInfo`/ICE — из `GET /api/cameras/:id/stream`.

## Known Issues

Факты, которые нужно учитывать при работе (полный список и обоснования — `docs/ai/reports/04-data-and-mocks.md`, план — `docs/ai/reports/06-roadmap.md`):

- Ошибки nvr/cameras приходят как `{code, message}` и в клиенте превращаются в `UNKNOWN_ERROR`. Не полагаться на `err.code` для этих эндпоинтов: различать по `err.status` (так сделано в `pages/cam-page/ui/CamPage.tsx` для 404), текст брать из `err.message` (его `apiFetch` читает из `body.message`).
- `GET /api/cameras/:id/stream` для `cam-3` (`error`) отвечает через 3 с кодом 504, для `cam-4` — 404. Статус камеры известен заранее из `GET /api/cameras/:id`, поэтому `/stream` запрашивается только для `online`.
- Чтобы получить 503 для `POST /api/auth/login`, используйте `server.use(...)`: хендлер в `auth.js:253` не срабатывает.
- У `GET /api/me/context` нет мока. Прежде чем включать `useClientDashboard`, добавьте хендлер.
- `apiFetch` возвращает `{}`, если успешный ответ не JSON, и не отправляет `Authorization` и `Content-Type`.
- Видео в DEV идёт через `mockWhep.ts` по обычному пути WHEP; ветка `window.__MSW_ACTIVE__` в плеере не выполняется.
- Контракт воспроизведения архива (`/playback`, `/api/playback/:id/whep`, `from`/`speed` в query) придуман для моков: у реального регистратора/шлюза он может отличаться (`UNVERIFIED`). Паузы и скорости в WHEP нет, поэтому каждая перемотка, продолжение после паузы и смена скорости — новый сеанс; позицию считает клиент (`pages/archive/model/usePlayback.ts`).
- Время в URL архива (`t=2026-10-17T14:05:09`) и границы дней — местное время браузера; файлы мок режет по часам UTC (в поясах с нецелым смещением файл может пересечь полночь — UI обрезает отрезки по дню).
