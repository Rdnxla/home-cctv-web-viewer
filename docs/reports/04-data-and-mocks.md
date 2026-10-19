# Фаза 4: Слой данных (TanStack Query) и моки (MSW)

- Коммит: `e599d53` (`src/` идентичен `a22ced1`: `git diff --name-only a22ced1 e599d53 -- src` → 0 файлов)
- Дата: 2026-10-17
- Версии (из фазы 1): @tanstack/react-query 5.95.2 (API v5), msw 2.12.14 (API v2: `http`/`HttpResponse`)
- Поведение библиотек по умолчанию указано по документации v5/v2; `node_modules` не читались (решение владельца) — такие пункты помечены «по docs».
- Решения владельца, учтённые в отчёте: тестов нет намеренно (не находка); вопрос о `public/mockServiceWorker.js` снят; заготовки FSD-013 не удалять.

## Сводка

- TanStack Query: 1 query (`useClientDashboard`, не используется) + 2 mutations (`useLoginMutation`, `useVerifyTwoFactorMutation`), 3 API-функции. `QueryClient` без `defaultOptions`. Продвинутые возможности (`queryOptions`, `select`, `enabled`, `placeholderData`, suspense, prefetch, `setQueryData`/`invalidateQueries`, `onMutate`) — 0 использований (`rg` → 0 совпадений).
- MSW: 13 хендлеров в 2 массивах (`authHandlers` 6, `nvrHandlers` 7). Из них к API-функциям приложения привязаны 2, к прямым `fetch` WebRTC-плеера — 2, без потребителя — 8, недостижим — 1. 1 эндпоинт приложения без мока (`GET /api/me/context`).
- Ключевое: два несовместимых формата тела ошибки (`{error}` у auth и `{code}` у nvr) при клиенте, который читает только `error` (DATA-001); дублирующий хендлер `POST /api/auth/login` недостижим (DATA-002); токены сохраняются, но ни один запрос их не отправляет (DATA-005).
- 15 находок: medium 6, low 9.

## TanStack Query

### 1. Конфигурация QueryClient

| Параметр | Значение | Где |
|---|---|---|
| Создание | `new QueryClient()` на уровне модуля | `src/main.tsx:10` |
| `defaultOptions` | не заданы → по docs v5: `staleTime: 0`, `gcTime: 5 мин`, `retry: 3` для queries / `0` для mutations, `refetchOnWindowFocus/Reconnect/Mount: true` | `src/main.tsx:10` |
| Provider | `QueryClientProvider` внутри `StrictMode`, над `RouterProvider` | `src/main.tsx:30-33` |
| Devtools | `<ReactQueryDevtools initialIsOpen={false} />` монтируется безусловно; по docs v5 в production-бандл не попадает (`NODE_ENV !== 'development'`) — `UNVERIFIED` локально | `src/main.tsx:31` |
| Глобальная обработка ошибок | `QueryCache`/`MutationCache` с `onError` — нет | `rg QueryCache\|MutationCache src` → 0 |
| Тестовый клиент | отдельный модульный `QueryClient` с `retry: false`, `gcTime: Infinity` | `src/TestUtils.tsx:8-12` |

### 2. Инвентарь queries и mutations

| Хук | Файл | queryKey | API-функция (файл) | Endpoint | Потребители |
|---|---|---|---|---|---|
| `useClientDashboard` | `src/pages/client-dashboard/model/useClientDashboard.ts:4` | `['sidebar']` | `getDashboard` (`src/api/user/user.ts:3`) | `GET /api/me/context` | нет (только комментарии `ClientDashboard.tsx:6,10`; `EventList.tsx:3,7` ссылается на несуществующий `./model/useClientDashboard`) |
| `useLoginMutation` | `src/pages/auth/model/useAuth.ts:4` | — | `login` (`src/api/auth/auth.ts:4`) | `POST /api/auth/login` | `pages/auth` (`Auth.tsx:22`) |
| `useVerifyTwoFactorMutation` | `src/pages/auth/model/useAuth.ts:5` | — | `verifyTwoFactor` (`src/api/auth/auth.ts:11`) | `POST /api/auth/login/2fa` | `pages/auth` (`Auth.tsx:23`) |

Сетевые вызовы вне TanStack Query: `useWebRtcPlayer` — прямой `fetch(whepUrl, POST, application/sdp)` (`src/mocks/handlers/webrtc.ts:113`) и `fetch(sessionUrl, DELETE)` (`:132`). Для SDP-сигналинга это оправдано: это не JSON-ресурс. Размещение хука — FSD-001.

### 3. Стратегия ключей

- Фабрики ключей нет; единственный ключ — литерал `['sidebar']` (`useClientDashboard.ts:7`). Он не соответствует ни эндпоинту (`/api/me/context`), ни имени хука.
- Коллизий нет (1 ключ). Иерархии для инвалидации нет.

### 4. Продвинутые возможности

| Возможность | Использование |
|---|---|
| `queryOptions` | 0 |
| `select` | 0 |
| `placeholderData` / `keepPreviousData` | 0 |
| `enabled` | 0 |
| Suspense (`useSuspenseQuery`) | 0 |
| Prefetch в роутере/loaders | 0 (`routes.ts` использует только `lazy`) |
| Optimistic updates (`onMutate`) | 0 |

### 5. Жизненный цикл мутаций

| Мутация | Что инвалидирует/обновляет | Где обрабатываются ошибки |
|---|---|---|
| `useLoginMutation` | ничего | callbacks в `mutate`: `src/pages/auth/Auth.tsx:53-89` (switch по `ApiErrorCode`); успех → `localStorage` + `navigate` (`:32-39`) |
| `useVerifyTwoFactorMutation` | ничего | `src/pages/auth/Auth.tsx:126-139`; успех → тот же `handleAuthSuccess` |

Мутации без инвалидации: обе. Сейчас зависимых queries нет; станет проблемой при появлении запросов сессии/пользователя (DATA-011).

### 6. Размещение кода

API-функции — `src/api/**` (вне слоёв, FSD-003), хуки — сегмент `model` страниц (FSD-008), типы — `src/api/*/…types…ts` и `src/mocks/data/nvrtypes.ts` (FSD-001). Целевое размещение согласовано владельцем: `entities/{session,user,camera}/{api,model}`.

### 7. Ошибки и загрузка

| Аспект | Факт |
|---|---|
| Error boundary | `react-error-boundary` в зависимостях, 0 использований; `errorElement` в `routes.ts` нет |
| Глобальный toast | `CalloutMessage` смонтирован в обоих layout, хук `useCalloutMessage` — 0 потребителей |
| Ошибки запросов | только локально в `Auth.tsx` через `isApiError` + `ApiErrorCode` |
| Индикаторы загрузки | `isPending` в `Auth.tsx:202-203,253-254`; других нет |
| Вывод | единой стратегии нет (DATA-012) |

### 8. Дублирование

Одинаковых queries с разными ключами и разных хуков на один эндпоинт нет (1 query). Дублирование есть в моках: 2 хендлера `POST /api/auth/login` (DATA-002) и 2 генератора canvas-потока (DATA-008).

## MSW

### 1. Версия и bootstrap

| Что | Факт | Где |
|---|---|---|
| API | v2: `http`, `HttpResponse`, `delay` из `msw`; `setupWorker` из `msw/browser`, `setupServer` из `msw/node` | `src/mocks/handlers/*.{js,ts}:1`, `browser.js:1`, `server.js:1` |
| Browser worker | только при `import.meta.env.DEV`, динамический импорт, `worker.start({quiet: true})`; рендер ждёт старта | `src/main.tsx:12-24` |
| Node server | `server.listen()` / `resetHandlers()` / `close()` | `src/testSetup.ts:5-7` |
| Service worker | `public/mockServiceWorker.js` (git-ignored; вопрос снят владельцем) | `package.json` → `msw.workerDirectory` |
| `onUnhandledRequest` | не задан ни в `worker.start`, ни в `server.listen` → по docs v2 `'warn'` | `src/main.tsx:17-19`, `src/testSetup.ts:5` |

### 2. Организация хендлеров

- Группировка по домену: `handlers/auth.js` (auth), `handlers/nvr.ts` (NVR, камеры, WHEP). `handlers/mockWhep.ts` — серверная сторона WHEP-мока, используется только в `nvr.ts:4`. `handlers/webrtc.ts` — **не хендлер**, а production-хук плеера (FSD-001).
- Агрегатор: `handlers/index.js` (`export *` из `auth`, `nvr`). `browser.js` и `server.js` перечисляют массивы явно: `...authHandlers, ...nvrHandlers`. Новый массив нужно добавить в 3 места.
- Языки: `auth.js`, `index.js`, `db.js`, `browser.js`, `server.js` — JS; `nvr.ts`, `mockWhep.ts`, `webrtc.ts`, `data/*.ts` — TS.

### 3. Покрытие маршрутов

| Method + path | Handler (файл) | Fixture / factory | API-функция | Hook |
|---|---|---|---|---|
| `POST /api/auth/login` | `auth.js:153` | `db.accounts` ← `data/accounts.json` (`db.js`) | `login` (`api/auth/auth.ts:4`) | `useLoginMutation` |
| `POST /api/auth/login` (дубль) | `auth.js:253` | — | недостижим (DATA-002) | — |
| `POST /api/auth/login/2fa` | `auth.js:187` | `db.accounts`, `pendingTwoFactor` | `verifyTwoFactor` (`api/auth/auth.ts:11`) | `useVerifyTwoFactorMutation` |
| `POST /api/auth/refresh` | `auth.js:222` | — | нет | нет |
| `GET /api/auth/me` | `auth.js:241` | `activeSessions` | нет | нет |
| `POST /api/auth/logout` | `auth.js:259` | `activeSessions` | нет | нет |
| `GET /api/nvr` | `nvr.ts:34` | `getNvrInfo()` (`data/nvr.ts:96`) | нет | нет |
| `GET /api/nvr/ports` | `nvr.ts:39` | `poePorts` (`data/nvr.ts:87`) | нет | нет |
| `GET /api/cameras` | `nvr.ts:45` | `cameras` + `sortCameras` (`data/nvr.ts:12,81`) | нет | нет |
| `GET /api/cameras/:id` | `nvr.ts:50` | `cameras` | нет | нет |
| `GET /api/cameras/:id/stream` | `nvr.ts:60` | `cameras`, `whepUrl()` (`data/nvr.ts:118`) | нет (`StreamInfo` захардкожен в `CameraCard.tsx:22-31`) | нет |
| `POST /api/webrtc/:id/whep` | `nvr.ts:80` | `createMockWhepSession` (`mockWhep.ts:58`) | прямой `fetch` (`webrtc.ts:113`), URL захардкожен в `CameraCard.tsx:30` | `useWebRtcPlayer` (не TanStack) |
| `DELETE /api/webrtc/:id/whep/:session` | `nvr.ts:106` | `closeMockWhepSession` (`mockWhep.ts:84`) | прямой `fetch` (`webrtc.ts:132`) | `useWebRtcPlayer` |
| `GET /api/me/context` | **нет** | — | `getDashboard` (`api/user/user.ts:3`) | `useClientDashboard` |

Итого: вызывается, но без мока — 1; хендлеры без потребителя — 8; несоответствия формы данных — DATA-001, DATA-014.

### 4. Качество фикстур

- `data/accounts.json` — статичный JSON, 7 аккаунтов; все `status: "active"`, у 2 включена 2FA (`olga@`, `petr.client@`). `db.js` клонирует его при старте (`db.js:5,8-12`).
- `data/nvr.ts` — статичные TS-константы (`cameras` — 4 шт., статусы online ×2 / error / no_connection; `poePorts` — 4) + функции (`sortCameras`, `getNvrInfo`, `whepUrl`, `rtspSource`, `MOCK_SDP_ANSWER`). Типы из `data/nvrtypes.ts`. Фабрик нет.
- Расположение: моки вне `shared` (соответствует правилу), но доменные типы и плеер находятся в `src/mocks` (FSD-001), а `shared/utils/auth.ts` обслуживает только моки (FSD-004).

### 5. Сценарии

| Сценарий | Как вызывается | Где |
|---|---|---|
| 422 валидация | пустой/невалидный email, пароль < 8 | `auth.js:132-149,162` |
| 500 | email `error500@example.com` | `auth.js:164-172` |
| Бесконечная задержка | email `timeout@example.com` (`delay('infinite')`) | `auth.js:173` |
| 429 rate limit | email `ratelimited@example.com` или > 3 попыток за 60 с | `auth.js:30-54` |
| 401 → 423 lock | 3 неверных пароля | `auth.js:67-86` |
| 423/403 по статусу аккаунта | `locked`, `unverified`, `password_reset_required` | `auth.js:58-66,94-112`: в фикстурах таких статусов нет (DATA-013) |
| 2FA | аккаунт с `twoFactorEnabled`, код `123456` | `auth.js:7,113-116,187-219` |
| 503 | дубль-хендлер | `auth.js:253-256`: недостижим (DATA-002) |
| Камеры: 404/504/404 | `cam-4` no_connection, `cam-3` error (задержка 3 с), несуществующий id | `nvr.ts:14-31` |
| Задержки | 200–400 мс у nvr, 3000 мс для error | `nvr.ts` |
| Переопределение в тестах | `server.use` — 0 использований (тестов нет — решение владельца) | — |
| In-memory состояние | `failedAttempts`, `rateLimitWindow`, `pendingTwoFactor`, `activeSessions` (`auth.js:8-11`), `db` (`db.js`); `resetMockState`/`resetDb` экспортируются, вызовов 0 | DATA-015 |

### 6. Необработанные запросы

`onUnhandledRequest` не задан (по docs → `'warn'`). Запрос без мока (`GET /api/me/context`) в DEV уйдёт в Vite dev-сервер; что он вернёт и как это обработает `apiFetch` — `UNVERIFIED` (см. DATA-003, DATA-004).

### 7. Переключение на реальный бэкенд

| # | Что сейчас | Что потребуется |
|---|---|---|
| 1 | MSW включается только по `import.meta.env.DEV` (`main.tsx:13`), отдельного флага нет; `.env*` файлов нет | флаг вроде `VITE_API_MOCKS` для запуска DEV против бэкенда |
| 2 | URL относительные (`/api/...`), `baseURL` нет (`http.ts:27`); `server.proxy` в `vite.config.ts` нет | `server.proxy['/api']` или `VITE_API_URL` + префикс в `apiFetch` |
| 3 | `Content-Type: application/json` для JSON-тел не ставится (`http.ts:27-29`, `auth.ts:5-8,12-15`) | заголовок в `apiFetch` |
| 4 | Токены пишутся в `localStorage` (`Auth.tsx:34-35`), но `Authorization` никто не отправляет; refresh/me/logout не реализованы на клиенте | слой сессии (DATA-005) |
| 5 | Формат ошибок неоднороден (DATA-001); контракт реального бэкенда неизвестен | `UNVERIFIED`: согласовать контракт |
| 6 | WebRTC: ICE-серверы захардкожены в `CameraCard.tsx:27` (Google STUN), мок отдаёт `[]` (`nvr.ts:71`) | брать `StreamInfo` из `GET /api/cameras/:id/stream` |
| 7 | Dev-сервер на HTTPS с локальными сертификатами (`vite.config.ts:26-31`) | при proxy на HTTP-бэкенд учесть `secure`/`changeOrigin` |

## Находки

### DATA-001: несовместимые форматы тела ошибки в моках и клиенте

- Severity: medium
- Type: fact
- Location: `src/shared/api/http.ts:36` (читает `body.error`); `src/mocks/handlers/auth.js:42,61,82,...` (`{error, message}`); `src/mocks/handlers/nvr.ts:8,17,21,26,54,87` + `src/mocks/data/nvrtypes.ts:3-6` (`ApiErrorBody = {code, message}`)
- Rule: единый контракт API между моками и клиентом (`prompts/04`, шаг MSW 3)
- Evidence: для любых ошибок nvr/cameras `apiFetch` подставит `ApiErrorCode.unknownError`; коды `CAMERA_NOT_FOUND`, `NO_CONNECTION`, `CONNECTION_ERROR`, `CONNECTION_TIMEOUT`, `UNSUPPORTED_MEDIA_TYPE` отсутствуют в `src/shared/api/authErrorCodes.ts:1-16`
- Recommendation: выбрать один формат (рекомендуется уже используемый клиентом `{error, message, ...data}`), привести `nvr.ts` и `ApiErrorBody`, расширить `ApiErrorCode`
- Effort: S

### DATA-002: дублирующий хендлер `POST /api/auth/login` недостижим

- Severity: medium
- Type: fact
- Location: `src/mocks/handlers/auth.js:253-256` (503 `SERVICE_UNAVAILABLE`); первый хендлер — `auth.js:153-184`
- Rule: MSW v2 применяет первый подходящий хендлер, вернувший ответ; первый хендлер возвращает ответ на всех ветках
- Evidence: сценарий 503 никогда не срабатывает, хотя `ApiErrorCode.serviceUnavailable` объявлен (`authErrorCodes.ts:12`)
- Recommendation: сделать сценарий явным, по email (`maintenance@example.com`) внутри первого хендлера, или держать отдельный хендлер для `server.use()` в тестах
- Effort: S

### DATA-003: эндпоинт `GET /api/me/context` без мока

- Severity: medium
- Type: fact
- Location: `src/api/user/user.ts:4`; в `src/mocks/handlers/*` маршрута нет
- Rule: каждый вызываемый эндпоинт имеет мок (`prompts/04`, MSW 3)
- Evidence: таблица покрытия выше; хук `useClientDashboard` сейчас не вызывается (заготовка, не удалять — решение владельца)
- Recommendation: добавить хендлер и фикстуру до включения хука; форма ответа неизвестна — тип `User` (`api/user/types.user.ts`) ни к чему не привязан (`UNVERIFIED`)
- Effort: S

### DATA-004: `apiFetch` глушит ошибки парсинга и не валидирует ответ

- Severity: medium
- Type: fact
- Location: `src/shared/api/http.ts:31` (`res.json().catch(() => ({}))`), `:42` (`return body as T`)
- Rule: ошибки данных не должны превращаться в успешный пустой ответ
- Evidence: при `res.ok` и не-JSON теле запрос «успешен» с `{}`; `valibot` в зависимостях — 0 импортов в `src`; `getDashboard` вызывает `apiFetch` без типа (`user.ts:4`) → `unknown`
- Recommendation: при `res.ok` пробрасывать ошибку парсинга (или учитывать `204`); опционально — схемы valibot в `entities/*/model` и проверка в API-функции
- Effort: S (парсинг) / M (схемы)

### DATA-005: токены сохраняются, но не используются

- Severity: medium
- Type: fact
- Location: `src/pages/auth/Auth.tsx:34-35`; `src/shared/api/http.ts:26-29` (заголовков нет); моки ожидают `Authorization: Bearer` (`auth.js:242,260`)
- Rule: целостность сценария аутентификации между клиентом и моками
- Evidence: хендлеры `refresh`, `me`, `logout` (`auth.js:222-263`) не имеют клиентских функций; `activeSessions` проверяется только в `/me`
- Recommendation: `entities/session` (согласовано, FSD-003): хранение токенов, подстановка `Authorization` в `apiFetch`, функции `refresh`/`me`/`logout`
- Effort: M

### DATA-006: нет конфигурации для работы против реального бэкенда

- Severity: medium
- Type: fact
- Location: `src/main.tsx:13`, `src/shared/api/http.ts:27-29`, `vite.config.ts:26-31`
- Evidence: раздел «Переключение на реальный бэкенд», пункты 1–3
- Recommendation: env-флаг для MSW, `server.proxy` (или base URL), `Content-Type: application/json` в `apiFetch`
- Effort: S

### DATA-007: данные камер не проходят через слой данных

- Severity: low
- Type: fact
- Location: `src/entities/camera-card/CameraCard.tsx:22-31` (захардкоженный `StreamInfo`), `:30` (`/api/webrtc/cam-1/whep`); 5 хендлеров `nvr.ts:34-77` без API-функций
- Rule: данные из API через API-функции и query-хуки сущности
- Evidence: таблица покрытия: `/api/nvr`, `/api/nvr/ports`, `/api/cameras`, `/api/cameras/:id`, `/api/cameras/:id/stream` — потребителей 0
- Conclusion: моки опережают клиент (проект в разработке)
- Recommendation: при реализации — `entities/camera/api` (`getCameras`, `getCamera`, `getCameraStream` + хуки), `StreamInfo` брать из `/stream`
- Effort: M

### DATA-008: мёртвая мок-ветка плеера и дублирующий генератор canvas-потока

- Severity: low
- Type: fact
- Location: `src/mocks/handlers/webrtc.ts:80-92` (`window.__MSW_ACTIVE__`, присваиваний в `src` — 0), `:8-39` (`createMockMediaStream`) ≈ `src/mocks/handlers/mockWhep.ts:15-46` (`createCanvasStream`)
- Evidence: в DEV плеер всегда идёт по «боевому» пути WHEP, который обслуживает `mockWhep.ts` (комментарий `mockWhep.ts:1-6`); `@ts-ignore` в `webrtc.ts:81,101,114`
- Recommendation: при переносе плеера в `entities/camera/lib` (FSD-001) оставить только боевой путь; генератор canvas — только в `mockWhep.ts`
- Effort: S

### DATA-009: `QueryClient` на дефолтах, без глобальной обработки ошибок

- Severity: low
- Type: fact + по docs
- Location: `src/main.tsx:10`
- Evidence: `retry: 3` по умолчанию: ошибка query появляется только после 3 повторов с backoff; при этом `CalloutMessage` уже есть для глобальных уведомлений
- Recommendation: `src/app/providers/queryClient.ts` с явными `defaultOptions` (`staleTime`, `retry` с учётом 4xx) и `QueryCache({onError})` → toast (вместе с FSD-009)
- Effort: S

### DATA-010: нет стратегии query keys

- Severity: low
- Type: fact
- Location: `src/pages/client-dashboard/model/useClientDashboard.ts:7`
- Evidence: литерал `['sidebar']`, не связанный с эндпоинтом/хуком
- Recommendation: при создании `entities/*/api` — фабрика ключей на сущность (`cameraKeys.all/list/detail(id)`) или `queryOptions` рядом с API-функцией
- Effort: S

### DATA-011: мутации логина не обновляют кеш

- Severity: low
- Type: fact
- Location: `src/pages/auth/model/useAuth.ts:4-5`
- Evidence: нет `onSuccess` с `invalidateQueries`/`setQueryData`; зависимых queries пока нет
- Recommendation: при появлении query сессии/пользователя — `setQueryData`/`invalidateQueries` в `onSuccess` мутации (в слое `entities/session/api`)
- Effort: S

### DATA-012: обработка ошибок и загрузки ad hoc

- Severity: low
- Type: fact
- Location: `src/pages/auth/Auth.tsx:53-89,126-139`; `src/app/routes.ts` (нет `errorElement`); `react-error-boundary` — 0 использований
- Recommendation: `errorElement`/`ErrorBoundary` на уровне layout-маршрутов + глобальный `onError` (DATA-009); локальную обработку форм оставить
- Effort: S

### DATA-013: фикстуры не покрывают ветки статусов аккаунта

- Severity: low
- Type: fact
- Location: `src/mocks/data/accounts.json` (7/7 `active`); ветки `auth.js:58-66,94-112`
- Evidence: сценарные email (`ratelimited@`, `error500@`, `timeout@`) нигде не задокументированы (`rg` вне `auth.js` → 0)
- Recommendation: добавить по аккаунту на `locked`/`unverified`/`password_reset_required`; таблицу тестовых email — в `references/data-layer.md` (сделано)
- Effort: S

### DATA-014: несоответствия типов и ответов моков

- Severity: low
- Type: fact
- Location: `src/api/auth/auth.types.ts:5-17,25` (`AuthSuccess.user: MockUser` с `password`) против `auth.js:17-20,125` (`sanitize` удаляет `password`); `src/api/user/types.user.ts` (`User`) не связан ни с одним хендлером
- Recommendation: тип пользователя без `password` (в `entities/user/model`), отдельный тип записи фикстуры — в `src/mocks/data`
- Effort: S

### DATA-015: состояние моков не сбрасывается между тестами

- Severity: low (отложено: тесты появятся позже — решение владельца)
- Type: fact
- Location: `src/testSetup.ts:6` (только `server.resetHandlers()`); `resetMockState` (`auth.js:22`), `resetDb` (`db.js:16`) — 0 вызовов; модульный `queryClient` в `src/TestUtils.tsx:8`
- Recommendation: при написании тестов — `afterEach`: `resetMockState()`, `resetDb()`, `queryClient.clear()`
- Effort: S

## UNVERIFIED

- Поведение по умолчанию TanStack Query v5 (`retry`, `staleTime`, devtools в prod) и MSW v2 (`onUnhandledRequest: 'warn'`, порядок хендлеров) — по документации версий, локально не проверено (`node_modules` не читались).
- Ответ Vite dev-сервера на немокнутый `GET /api/me/context` и итог в `apiFetch`.
- Контракт реального бэкенда (формат ошибок, `/api/me/context`, авторизация).
