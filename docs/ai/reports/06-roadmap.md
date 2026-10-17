# Фаза 6: Roadmap улучшений

- Коммит: `9e5be8f` (`src/` идентичен `a22ced1`) · Дата: 2026-10-17
- Источники: `02-fsd-audit.md` (FSD-*), `03-biome-audit.md` (BIO-*), `04-data-and-mocks.md` (DATA-*), факты карты `references/interaction-map.md` (MAP-*)
- Уже сделано: BIO-001 — `docs/ai/**` исключён из Biome (`biome.json`, последний override), `yarn exec biome ci .` → exit 0.
- Закрыто решениями владельца, в план не входит: FSD-010 (виджеты остаются), FSD-013 (ничего не удалять), пустой `features/`, `mockServiceWorker.js` в `.gitignore`.
- Отложено до появления тестов (решение владельца): DATA-015, BIO-011, FSD-012.

## Решения, требующие согласования владельца

Каждое решение блокирует только указанные пункты; остальной план от них не зависит.

| # | Вопрос | Варианты | Блокирует |
|---|---|---|---|
| D1 | Как автоматически контролировать границы FSD | (a) Biome `noRestrictedImports` по слоям, без новых зависимостей, поддержка шаблонов в 2.4.9 — `UNVERIFIED`; (b) Steiger — новая devDependency, нужна сеть; (c) `fsd-imports.mjs` в CI, без зависимостей, но без проверки `?mocks`/`?api` | M-7 |
| D2 | Контракт ошибок API для реального бэкенда | `{error, message, ...data}` (уже понимает клиент) или `{code, message}` (как в nvr-моках) | QW-4 (выбор формата), L-2 |
| D3 | Валидация ответов в рантайме | valibot-схемы в `entities/*/model` или оставить приведение типов | M-3, M-5 |
| D4 | Защита маршрутов и поведение без сессии | guard на `MainLayout`, редирект на `/` | M-4 |
| D5 | Пункт «Архив» (`/archive`) в шапке без маршрута (MAP-1) | заготовка-страница или временно скрыть пункт | M-6 |
| D6 | Линтинг SCSS (BIO-006) | stylelint (новая зависимость) или не контролировать | M-8 |

## Порядок выполнения

```
Этап 0  CI и инструменты      QW-1 → QW-2 → QW-3
Этап 1  Контракт данных       QW-4, QW-5, QW-6, QW-7          (независимы друг от друга)
Этап 2  Подготовка структуры  QW-8, QW-9, QW-10, QW-11        (QW-8 до M-1)
Этап 3  Сущности              M-2 → M-3 → M-1 → M-7        (Public API добавляется после перестройки сущностей)
Этап 4  Данные и сессия       M-5, M-4 (после M-3)
Этап 5  Крупные задачи        L-1 (охватывает этапы 2–3), L-2 (после этапа 4 и D2)
```

Ключевые зависимости:
- QW-3 (override `noBarrelFile`) нужен до M-1/M-2/M-3: иначе `index.ts` слайсов уронят `biome ci`.
- M-2 (`entities/camera`) — до M-5: queries камер пишутся в новый слайс.
- M-3 (`entities/session`) — до M-4.
- QW-4 (единый формат ошибок) — до M-5: обработка ошибок камер опирается на `err.code`.

## Quick Wins (S, низкий риск)

| ID | Источник | Действие | Риск | Проверка |
|---|---|---|---|---|
| QW-1 | BIO-002 | Добавить `yarn lint:tsc` в шаг Validate CI. Исправить 5 ошибок: перевести `src/mocks/{browser,server,db}.js` и `handlers/{auth,index}.js` на `.ts`; типизировать `messages` в `InfoBlock.tsx` (`Message[]`/`as const`); `className?: string \| undefined` в `CameraCardProps` | низкий; при переименовании JS → TS нужно обновить импорты `main.tsx:16`, `testSetup.ts:3` (с расширением не импортируются — правка может не потребоваться) | `yarn exec tsc --noEmit -p tsconfig.app.json` → exit 0; `yarn exec biome ci .`; `yarn dev`: вход и дашборд |
| QW-2 | BIO-005 | `lint:biome: biome check` (read-only), отдельный `fix: biome check --write`; `--unsafe` — только вручную | нет | `yarn lint` не меняет файлы (`git status` чистый) |
| QW-3 | BIO-003 | Override `performance/noBarrelFile: off` для `src/{pages,widgets,features,entities}/*/index.ts` и `src/shared/*/index.ts` | срабатывание правила на именованные реэкспорты — `UNVERIFIED`: проверить при внедрении | создать тестовый `index.ts` → `yarn exec biome ci .` |
| QW-4 | DATA-001 | Перевести `nvr.ts` и `ApiErrorBody` на `{error, message}` (или формат из D2); добавить коды камер в `ApiErrorCode` | низкий: потребителей ошибок камер нет | в DEV запрос `GET /api/cameras/cam-4/stream` → `isApiError` с кодом `NO_CONNECTION` |
| QW-5 | DATA-002 | Сценарий 503 по email (`maintenance@example.com`) внутри первого хендлера `POST /api/auth/login`; убрать недостижимый дубль (`auth.js:253-256`) | нет | вход с `maintenance@example.com` → сообщение 503 |
| QW-6 | DATA-004, DATA-006 (п. 3) | `apiFetch`: не глушить ошибку парсинга при `res.ok` (учесть 204), выставлять `Content-Type: application/json` для JSON-тела | низкий: все текущие ответы — JSON | вход/2FA/ошибки входа в DEV |
| QW-7 | DATA-013 | Добавить в `accounts.json` аккаунты со статусами `locked`, `unverified`, `password_reset_required`; перечислить сценарные email в `references/data-layer.md` (перечислены) | нет | вход каждым аккаунтом → соответствующая ошибка |
| QW-8 | FSD-002 | `src/router/routes.ts` → `src/app/router/routes.ts`; `src/router/README.md` → `docs/api-endpoints.md` | низкий: один импорт в `main.tsx:8` | `node docs/ai/scripts/fsd-imports.mjs`: `layer-upward` 9 → 3; все 4 маршрута открываются |
| QW-9 | FSD-006, FSD-004 | `shared/components` → `shared/ui` (+ `shared/ui/index.ts`), `shared/utils/useMediaQuery.ts` → `shared/lib/`, `shared/utils/auth.ts` → `src/mocks/lib/makeToken.ts` | низкий: 5 импортов | сканер: `?mocks → shared` исчезает; `tsc`, `biome ci` |
| QW-10 | FSD-009, DATA-009, DATA-012 | `src/app/providers/`: `QueryClient` с явными `defaultOptions` (`retry` без повторов на 4xx, `staleTime`), один `Theme` вместо двух; `errorElement` на layout-маршрутах | средний для `QueryCache.onError` → toast: провайдер toast находится внутри layout, а `QueryClient` — выше. Решение — вызывать toast из компонента-подписчика, а не из кеша | `yarn dev`: ошибка запроса → сообщение; неизвестный маршрут → `errorElement` |
| QW-11 | BIO-007, BIO-008, BIO-009, BIO-010, BIO-004 | Гигиена конфигов: `biome.json` → `biome.jsonc` с причинами отключений, override `**/*` → `linter.rules`; порог `noSecrets` по умолчанию + послабление для `src/mocks/**` (значение по умолчанию — `UNVERIFIED`); указать правило и причину в 7 `biome-ignore`; `.vscode/settings.json` + `extensions.json` для Biome; обновлять Biome отдельным PR | низкий; при изменении порога `noSecrets` возможны новые срабатывания | `yarn exec biome ci .` → exit 0 |

## Medium Steps (M)

| ID | Источник | Действие | Риск | Проверка | Зависит от |
|---|---|---|---|---|---|
| M-1 | FSD-005, FSD-006, FSD-014 | `index.ts` в каждом из 9 слайсов (именованные реэкспорты; для страниц — `Component`); компоненты и стили → сегмент `ui/`; переименования (`the-header`, `camera-control` ↔ `CameraControls`) — попутно | средний: правка всех межслайсовых импортов (9) и `lazy` в роутере | сканер: `non-public-api` → 0, все слайсы — Public API = yes | QW-3, QW-8, M-2, M-3 |
| M-2 | FSD-001, FSD-007, DATA-008 | Создать `entities/camera`: `mocks/data/nvrtypes.ts` → `model/types.ts`; `mocks/handlers/webrtc.ts` → `lib/useWebRtcPlayer.ts` (без мёртвой ветки `__MSW_ACTIVE__` и `@ts-ignore`); `entities/camera-card` → `ui/CameraCard.tsx`; навигация «Открыть» — через props/`children`; моки импортируют типы из `@/entities/camera` | средний: видео в DEV зависит от WHEP-пути `mockWhep.ts` | сканер: ребра `entities → ?mocks` нет; `yarn dev`: видео на дашборде и в детальном просмотре; уход со страницы → `DELETE …/whep/:session` | QW-3 |
| M-3 | FSD-003, FSD-008, DATA-014 | `src/api/auth/*` → `entities/session/{api,model}` (+ хуки мутаций из `pages/auth/model`), `src/api/user/*` → `entities/user/{api,model}`, `entities/user-profile-card` → `entities/user/ui` (не удалять); тип пользователя без `password`, тип записи фикстуры — в `src/mocks/data`. Удалить пустой `src/api` | средний: типы, которые использует `Auth.tsx` | сканер: узла `?api` нет; вход и 2FA в DEV | QW-3 |
| M-4 | DATA-005, DATA-011 | Слой сессии в `entities/session`: хранение токенов, `Authorization` в `apiFetch`, функции и хуки `refresh`/`me`/`logout`, `setQueryData` после логина, guard маршрутов (D4) | средний: смена потока входа | вход → `GET /api/auth/me` 200; выход → 401; `/dashboard` без сессии — по D4 | M-3, D4 |
| M-5 | DATA-007, DATA-010, DATA-003 | Queries камер в `entities/camera/api` (`getCameras`, `getCamera`, `getCameraStream`) с фабрикой ключей; `CameraCard` получает `StreamInfo` из `/stream`. Это снимает MAP-2 (4 WHEP-сессии к `cam-1`) и MAP-3 (`/1/detail` при id `cam-N`). `CamPage` читает `:id`. Мок для `GET /api/me/context` — перед включением `useClientDashboard` | средний: поведение плеера при ошибках камер (`cam-3` — задержка 3 с, `cam-4` — 404) | `yarn dev`: 2 online-камеры с видео, 2 — с ошибками; переход в детальный просмотр нужной камеры | M-2, QW-4, D3 |
| M-6 | MAP-1, MAP-4 | Маршрут или скрытие пункта `archive` (D5); вынести пути маршрутов в одну константу (`app/router/paths.ts`) вместо строк в 4 файлах | низкий | клик по каждому пункту шапки | QW-8, D5 |
| M-7 | Контроль границ (`03-biome-audit.md`) | Автоматическая проверка FSD по D1; в любом случае — `node docs/ai/scripts/fsd-imports.mjs` в CI с проверкой отсутствия нарушений | ложные срабатывания на внеслойном `src/mocks` → исключение для него | искусственный импорт вверх → CI падает | M-1…M-3, D1 |
| M-8 | BIO-006, FSD-011 | По D6 — линтинг SCSS; презентационный `CalloutItem` (иконка + цвет) в `shared/ui/callout`, переиспользуемый `InfoBlock` и `CalloutMessage` | низкий | визуальная проверка toast и блока «Обзор» | QW-9, D6 |

## Major Tasks (L, нужен отдельный план миграции)

### L-1: Завершение структуры FSD

- Источник: FSD-001…FSD-009, FSD-014 (сводно)
- Состав: QW-8 → QW-9 → QW-3 → M-2 → M-3 → M-1 → M-7; итог — целевое дерево из `02-fsd-audit.md`.
- План миграции:
  1. один PR — один слайс или один перенос;
  2. после каждого: сканер, `tsc`, `biome ci`, ручной прогон 7 сценариев из `references/interaction-map.md` (раздел 4);
  3. обновить карту: `references/interaction-map.md` и `fsd-rules.md` → «Project placement».
- Риски: массовые правки импортов (сортировку исправит `organizeImports`); обновить `biome.json` (группы импортов, override `noBarrelFile`) и `vite.config.ts:37` (coverage exclude).
- Проверка: сканер — 0 нарушений, нет узлов `?api`, `?router`; единственный внеслойный узел — `?mocks` (fan-in только от `main.tsx`/`app`/тестов).

### L-2: Подключение реального бэкенда

- Источник: DATA-006, DATA-001, DATA-004, DATA-005; решения D2, D3
- Состав:
  1. флаг `VITE_API_MOCKS` в `enableMocking` (`main.tsx:12-20`);
  2. `server.proxy['/api']` в `vite.config.ts` (учесть HTTPS dev-сервер, `secure`/`changeOrigin`) или base URL в `apiFetch`;
  3. согласованный контракт ошибок;
  4. сверка форм ответов с типами сущностей (при D3 — схемы valibot);
  5. ICE-серверы из `/stream`.
- План миграции: по одному домену — auth → cameras/nvr → me/context; моки остаются источником сценариев для DEV и тестов.
- Риски: расхождение контрактов, CORS/HTTPS, WHEP через прокси.
- Проверка: DEV с `VITE_API_MOCKS=false` против стенда — сценарии 2–7 карты; DEV с моками — без регрессий.

## Отложено (решение владельца: тесты позже)

| Источник | Что сделать при появлении тестов |
|---|---|
| DATA-015 | `afterEach`: `resetMockState()`, `resetDb()`, `queryClient.clear()` в `src/testSetup.ts` |
| BIO-011 | override тестов Biome: `src/**/*.test.{ts,tsx}` |
| FSD-012 | `src/TestUtils.tsx` → `src/shared/lib/test/render.tsx` |
| Контекст | CI запускает `test:ci`/`test:e2e:ci` без тестов и без `./tests` (`03-biome-audit.md`, «Контекст») |

## Факты карты, не вошедшие в отчёты 02–04

| ID | Факт | Где |
|---|---|---|
| MAP-1 | пункт навигации `archive` без маршрута | `src/widgets/the-header/TheHeader.tsx:11`, `src/router/routes.ts` |
| MAP-2 | 4 `CameraCard` на дашборде открывают 4 WHEP-сессии к `cam-1` | `ClientDashboard.tsx:34-36`, `CameraCard.tsx:22-33` |
| MAP-3 | «Открыть» ведёт на `/1/detail`, id камер — `cam-N`; `CamPage` не читает `:id` | `CameraCard.tsx:15,36`, `mocks/data/nvr.ts` |
| MAP-4 | пути маршрутов захардкожены в 4 файлах | `Auth.tsx:36`, `CameraCard.tsx:36`, `TheHeader.tsx:9-11`, `CamPage.tsx:37` |
| MAP-5 | защиты маршрутов нет | `src/router/routes.ts` |
