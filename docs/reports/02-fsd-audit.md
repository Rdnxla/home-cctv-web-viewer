# Фаза 2: Аудит FSD

- Коммит: `a22ced1`
- Дата: 2026-10-17
- Эталон правил: `.agents/skills/fe-architecture-map/references/fsd-rules.md`
- Граф: `node docs/ai/scripts/fsd-imports.mjs` → `docs/ai/reports/generated/{imports.json,slices.md}` (перезапущен в этой сессии, код с фазы 1 не менялся)

## Сводка

- Сканер: 38 файлов, 14 узлов (10 слайсов FSD + `app`, `shared` + 3 неизвестных слоя `?api`, `?mocks`, `?router`), 19 рёбер, **18 нарушений**: `layer-upward` 9, `non-public-api` 9; `cross-slice` 0, `deprecated-layer` 0, циклов 0.
- Ручная проверка: все 9 `layer-upward` — артефакт неизвестных слоёв (rank −1), а не реальный импорт вверх. При этом сканер **пропускает** импорты *в* неизвестные слои: `entities → ?mocks` (2), `pages → ?api` (3). Самое серьёзное нарушение (FSD-001) находится именно там.
- Структурно: 0 из 9 слайсов имеют Public API (`index`); 17 из 19 файлов слайсов `pages/widgets/entities` лежат в корне слайса, без сегментов; слой `features` пуст; доменные типы и API живут вне слоёв (`src/api`, `src/mocks/data`).
- 14 находок: high 1, medium 7, low 6.

## Ручная проверка автоматических нарушений (spot-check)

| # | Нарушение из `slices.md` | Вердикт | Обоснование |
|---|---|---|---|
| 1 | `src/app/routes.ts` → `pages/*` (`layer-upward`) | ложное срабатывание по правилу, но симптом FSD-002 | `?router` имеет rank −1; если роутер находится в `app`, импорт страниц разрешён. Импорты — динамические `lazy: () => import(...)` (`routes.ts:10,19,23,27`), сканер их учитывает |
| 2 | `src/api/auth/auth.ts` → `shared/api/http` (`layer-upward`) | ложное срабатывание | `?api` rank −1; из любого слоя FSD импорт `shared` разрешён. Симптом FSD-003 |
| 3 | `src/mocks/handlers/auth.js` → `shared/utils/auth` (`layer-upward`) | ложное по правилу, реальная проблема размещения | см. FSD-004 |
| 4 | `src/app/layouts/main/MainLayout.tsx:3` → `@/widgets/the-header/TheHeader` (`non-public-api`) | подтверждено | у слайса нет `index`, импорт в файл; не type-only, не `@x` |
| 5 | `src/pages/dashboard/Dashboard.tsx:3` → `@/entities/camera-card/CameraCard` (`non-public-api`) | подтверждено | то же |
| 6 | (пропущено сканером) `src/entities/camera-card/CameraCard.tsx:5-6` → `@/mocks/...` | ложноотрицательное | `to.rank (−1) < from.rank (2)` — проверка `layer-upward` не срабатывает. См. FSD-001 |

## Находки

### FSD-001: production-слайс `entities/camera-card` зависит от моков

- Severity: high
- Type: fact
- Location: `src/entities/camera-card/CameraCard.tsx:5` (`import type {StreamInfo} from '@/mocks/data/nvrtypes'`), `:6` (`import {useWebRtcPlayer} from '@/mocks/handlers/webrtc'`)
- Rule: FSD, слои не зависят от dev-инфраструктуры; `app` отвечает за подключение MSW (`fsd-rules.md`, «Layer Roles»)
- Evidence: `imports.json` → ребро `entities/camera-card → ?mocks` (count 2, typeOnly 1); `src/mocks/handlers/webrtc.ts:60-140` — боевой WHEP-плеер (`RTCPeerConnection`, `fetch(whepUrl)`) с веткой мок-режима (`:83`); `src/mocks/data/nvrtypes.ts:1-61` — доменные типы `Camera`, `CameraStatus`, `PoePort`, `NvrInfo`, `StreamInfo`, `IceServer`, `ApiErrorBody`
- Conclusion: production-код (плеер и типы камеры) физически находится в папке моков; при отключении/удалении MSW сборка сломается
- Recommendation: `useWebRtcPlayer` → `src/entities/camera/lib/useWebRtcPlayer.ts`; типы → `src/entities/camera/model/types.ts`; моки импортируют типы из `@/entities/camera` (направление mocks → entities допустимо)
- Effort: M

### FSD-002: роутер вне слоя `app`

- Severity: medium
- Type: fact
- Location: `src/app/routes.ts`, `src/router/README.md`
- Rule: FSD, `app` — инициализация: провайдеры, роутер (`fsd-rules.md`, «Layer Roles»)
- Evidence: `slices.md` → `?router`: 6 из 9 `layer-upward` и 4 из 9 `non-public-api`
- Recommendation: `src/app/routes.ts` → `src/app/app/routes.ts`. `src/router/README.md` (карта эндпоинтов `/api/nvr…`) к роутингу не относится → `docs/` или `src/entities/camera/api/README.md` после выполнения FSD-003. После переноса и добавления `index` у страниц (FSD-005) уходят 10 из 18 нарушений
- Effort: S

### FSD-003: API-функции и доменные типы в `src/api` вне слоёв

- Severity: medium
- Type: fact
- Location: `src/api/auth/auth.ts`, `src/api/auth/auth.types.ts`, `src/api/user/user.ts`, `src/api/user/types.user.ts`
- Rule: FSD, API и модели сущности — в сегментах `api`/`model` слайса `entities` (`fsd-rules.md`, «Segments», «Layer Roles»)
- Evidence: `imports.json` → `pages/auth → ?api` (2, typeOnly 1), `pages/dashboard → ?api` (1); эти рёбра сканер не проверяет. `auth.types.ts:5` — доменный тип назван `MockUser` и содержит `password` (`:9`)
- Recommendation: `api/auth/*` → `entities/session/{api,model}` (login, 2FA, `AuthSuccess`, `LoginResponse`); `api/user/*` → `entities/user/{api,model}`. Согласовано владельцем 2026-10-17
- Effort: M

### FSD-004: `src/mocks` вне слоёв; `shared` содержит хелпер, нужный только мокам

- Severity: medium
- Type: fact + conclusion
- Location: `src/mocks/**` (11 файлов); `src/shared/utils/auth.ts` (`makeToken`)
- Rule: FSD, `shared` — переиспользуемая база для приложения; моки — dev-инфраструктура (`fsd-rules.md`)
- Evidence: `rg makeToken src` → единственный потребитель — `src/mocks/handlers/auth.js:3,108,114,118,124,208`. Внешние зависимости `?mocks` в `imports.json`: `msw` 4, `react` 1 (React-хук в моках — см. FSD-001)
- Conclusion: держать `src/mocks` вне слоёв — допустимая практика при явном решении владельца (dev-only, импортируется только `main.tsx` и `testSetup.ts`). Сейчас граница не соблюдается в обе стороны (FSD-001 и `makeToken`)
- Recommendation: `src/shared/utils/auth.ts` → `src/mocks/lib/makeToken.ts`; зафиксировать правило «в `src/mocks` импортируют только `main.tsx`/`app` и тестовая инфраструктура» (согласовано владельцем 2026-10-17)
- Effort: S

### FSD-005: ни у одного слайса нет Public API

- Severity: medium
- Type: fact
- Location: все 9 слайсов `pages/*`, `widgets/*`, `entities/*`; примеры: `src/app/layouts/main/MainLayout.tsx:3`, `src/pages/cam-page/CamPage.tsx:2-3`, `src/pages/dashboard/Dashboard.tsx:2-3`
- Rule: FSD, внешний доступ к слайсу только через `index` (`fsd-rules.md`, «Import Rules» п. 3)
- Evidence: `slices.md` → колонка Public API = **NO** для 9 из 9; `non-public-api`: 9
- Recommendation: добавить `index.ts` в каждый слайс, реэкспортируя только используемое снаружи (без `export *`); для страниц — `Component` (react-router `lazy` принимает модуль с `Component`)
- Effort: S

### FSD-006: сегменты по технической природе, слайсы без сегментов

- Severity: medium
- Type: fact
- Location: `src/shared/components/` (3 файла), `src/shared/utils/` (2), `src/shared/components/callout/types.ts`; корни слайсов `pages/*`, `widgets/*`, `entities/*`
- Rule: FSD, сегменты `ui/api/model/lib/config`; избегать `components`, `utils`, `types` (`fsd-rules.md`, «Segments»)
- Evidence: `find src/pages src/widgets src/entities -mindepth 2 -maxdepth 2 -type f | wc -l` = 17 (файлы в корне слайса) против 2 файлов в сегментах (`pages/auth/model/useAuth.ts`, `pages/dashboard/model/useDashboard.ts`)
- Recommendation: `shared/components` → `shared/ui`, `shared/utils` → `shared/lib`; компоненты и стили слайсов → `<slice>/ui/`
- Effort: S

### FSD-007: границы entities: сущности названы по UI-компоненту, содержат сценарий и захардкоженные данные

- Severity: medium
- Type: fact + conclusion
- Location: `src/entities/camera-card/CameraCard.tsx:15,20,22-31,35-37`; `src/entities/user-profile-card/UserProfileCard.tsx`
- Rule: FSD, `entities` — бизнес-сущности без пользовательских сценариев (`fsd-rules.md`, «Layer Roles»)
- Evidence: `CameraCard` вызывает `useNavigate` и переходит на `/${currCamId}/detail` с константой `currCamId = 1`; объект `stream` захардкожен в компоненте. Модели камеры лежат в `src/mocks/data/nvrtypes.ts`, модели пользователя — в `src/api/*/…types…ts`; у слайсов `entities` нет `model`/`api`
- Conclusion: слайсы — это UI-карточки, а не сущности; бизнес-сущности `camera`, `user`/`session` фактически распределены по `src/api` и `src/mocks`
- Recommendation: `entities/camera-card` → `entities/camera` (`ui/CameraCard.tsx`, `model/types.ts`, `lib/useWebRtcPlayer.ts`, позже `api/`); навигацию передавать через props/`children` или поднять в `pages`/`widgets`; `entities/user-profile-card` → `entities/user/ui/UserProfileCard.tsx` (см. FSD-013 о неиспользуемости)
- Effort: M

### FSD-008: query-хуки в `model`, импорт API в обход алиаса

- Severity: medium
- Type: fact
- Location: `src/pages/auth/model/useAuth.ts:2` (`'../../../api/auth/auth'`), `src/pages/dashboard/model/useDashboard.ts:2` (`'@/api/user/user'`)
- Rule: FSD, query-хуки — сегмент `api` слайса-владельца (`fsd-rules.md`, «Segments», `api`); относительные импорты допустимы только внутри слайса (п. 3)
- Evidence: относительный путь из `pages/auth` выходит за пределы слайса и слоя; в соседнем файле того же слайса (`src/pages/auth/Auth.tsx:8`) используется `@/api/...`
- Recommendation: хуки → `api` сегмент сущности (`entities/session/api/useLoginMutation.ts` и т. п.) после FSD-003; детальный разбор ключей и мутаций — фаза 4
- Effort: S

### FSD-009: провайдеры приложения вне `app`; дублирование `Theme`

- Severity: low
- Type: fact
- Location: `src/main.tsx:10,29-33` (`QueryClient`, `QueryClientProvider`, `ReactQueryDevtools`, `RouterProvider`), `:12-20` (старт MSW); `src/app/layouts/main/MainLayout.tsx:9`, `src/app/layouts/empty/EmptyLayout.tsx:8` (одинаковый `Theme`)
- Rule: FSD, `app` — провайдеры, роутер, MSW setup (`fsd-rules.md`, «Layer Roles»)
- Recommendation: `src/app/providers/` (QueryClient + Theme один раз), `src/app/index.tsx`; `src/main.tsx` остаётся тонкой точкой входа для `index.html`
- Effort: S

### FSD-010: виджеты, используемые одной страницей

- Severity: low
- Type: fact + UNVERIFIED (планы на переиспользование)
- Location: `src/widgets/info/InfoBlock.tsx` (потребитель только `pages/dashboard`), `src/widgets/camera-control/CameraControls.tsx` (только `pages/cam-page`)
- Rule: FSD, блок, нужный одной странице, живёт на этой странице (`fsd-rules.md`, «Layer Roles», `widgets`)
- Evidence: `imports.json` → fan-in 1 у обоих; `widgets/the-header` (fan-in 1 от `app`) — виджет уровня layout, правило не нарушает
- Recommendation: ~~перенести в страницы~~ — **закрыто решением владельца 2026-10-17**: виджеты будут переиспользоваться, это отдельная логика; оставить в `widgets`, не трогать
- Effort: —

### FSD-011: дублирование UI-логики callout между `widgets` и `shared`

- Severity: low
- Type: fact
- Location: `src/widgets/info/InfoBlock.tsx:54-72` и `src/shared/components/callout/CalloutMessage.tsx:12-17,28-39` (одинаковые карта `colors` и `renderIcon`); `InfoBlock.tsx:3` — глубокий импорт `@/shared/components/callout/types`
- Rule: FSD, переиспользуемое отображение — в `shared/ui`; единообразие (`fsd-rules.md`, «Import Rules» п. 4)
- Recommendation: вынести презентационный `CalloutItem` (иконка + цвет) в `shared/ui/callout`, экспортировать через `shared/ui/index.ts`
- Effort: S

### FSD-012: тестовая инфраструктура и контексты в корне `src`

- Severity: low
- Type: fact
- Location: `src/TestUtils.tsx` (`export *` из `@testing-library/react`, `:36`), `src/testSetup.ts`
- Rule: единообразие размещения; FSD явно не регламентирует
- Evidence: `vite.config.ts:49` ссылается на `src/testSetup.ts`
- Recommendation: `src/TestUtils.tsx` → `src/shared/lib/test/render.tsx`; `testSetup.ts` можно оставить (путь в конфиге). Не срочно: тестов пока нет (решение владельца)
- Effort: S

### FSD-013: неиспользуемый и закомментированный код (кандидаты на очистку)

- Severity: low
- Type: fact
- Location / Evidence (`rg` по `src`, без закомментированных строк):
  - `src/entities/user-profile-card/UserProfileCard.tsx` — fan-in 0 (`slices.md`)
  - `src/pages/dashboard/model/useDashboard.ts` — используется только в комментарии `Dashboard.tsx:6,10`
  - `src/api/user/types.user.ts` (`User`) — 0 потребителей
  - `useCalloutMessage` (`src/shared/components/callout/CalloutMessage.tsx:58`) — 0 потребителей вне комментариев
  - закомментированные блоки: `src/pages/dashboard/Dashboard.tsx:5-25` (16 строк), `src/pages/event-list/EventList.tsx:2-22` (16 строк, копия из dashboard, включая несуществующий `./model/useDashboard`)
  - заглушка `src/widgets/camera-control/CameraControls.tsx:10` (`<Button>asd</Button>`)
- Recommendation: **закрыто решением владельца 2026-10-17**: ничего не удалять, это заготовки незавершённого проекта. Находка сохранена только как факт для карты (фаза 5)
- Effort: —

### FSD-014: непоследовательное именование слайсов и файлов

- Severity: low
- Type: fact
- Location: `widgets/camera-control/CameraControls.tsx` (ед./мн. число), `widgets/info/InfoBlock.tsx`, `widgets/the-header/TheHeader.tsx` (префикс `the-`), `pages/cam-page/CamPage.tsx` (суффикс `-page` в слое `pages`); `api/auth/auth.types.ts` против `api/user/types.user.ts`; `pages/auth/Auth.scss` и `shared/components/callout/callout.scss` (глобальные) против 10 `*.module.scss`
- Rule: единообразие (`fsd-rules.md`, шкала: «Cosmetics naming» — low)
- Recommendation: исправлять попутно при переносах FSD-005…007; стилевые соглашения — фаза 3
- Effort: S

## Положительное (нарушений нет)

- 0 циклов, 0 `cross-slice`, нет слоя `processes`.
- `shared` не импортирует верхние слои (fan-out 0); `src/shared/api/http.ts` — универсальный клиент без доменной логики; `authErrorCodes.ts` — коды ошибок API, используются клиентом (`http.ts:1-2`), домена не содержат (название файла узковато — см. FSD-014).
- Направление `pages → widgets/entities/shared` и `app → widgets/shared` соответствует правилам.
- `pages/auth/Auth.tsx` (260 строк) содержит логику формы, используемой на одной странице — по `fsd-rules.md` это допустимо; выделять `features/auth` до появления второго потребителя не требуется. Сохранение токенов в `localStorage` (`Auth.tsx:34-35`) — кандидат в `entities/session/model` вместе с FSD-003.

## Предлагаемые перемещения (from → to)

| # | From | To | Находки | Порядок |
|---|---|---|---|---|
| 1 | `src/app/routes.ts` | `src/app/app/routes.ts` | FSD-002 | 1 |
| 2 | `src/router/README.md` | `docs/api-endpoints.md` (или `entities/camera/api/README.md`) | FSD-002 | 1 |
| 3 | `src/shared/components/callout/*` | `src/shared/ui/callout/*` + `src/shared/ui/index.ts` | FSD-006, FSD-011 | 2 |
| 4 | `src/shared/utils/useMediaQuery.ts` | `src/shared/lib/useMediaQuery.ts` | FSD-006 | 2 |
| 5 | `src/shared/utils/auth.ts` | `src/mocks/lib/makeToken.ts` | FSD-004 | 2 |
| 6 | `src/mocks/data/nvrtypes.ts` | `src/entities/camera/model/types.ts` | FSD-001, FSD-007 | 3 |
| 7 | `src/mocks/handlers/webrtc.ts` | `src/entities/camera/lib/useWebRtcPlayer.ts` | FSD-001 | 3 |
| 8 | `src/entities/camera-card/*` | `src/entities/camera/ui/*` + `index.ts` | FSD-005, FSD-007 | 3 |
| 9 | `src/api/auth/*` | `src/entities/session/{api,model}/*` | FSD-003 | 4 |
| 10 | `src/api/user/*` | `src/entities/user/{api,model}/*` | FSD-003 | 4 |
| 11 | `src/entities/user-profile-card/*` | `src/entities/user/ui/*` (не удалять — решение владельца) | FSD-007 | 4 |
| 12 | `src/pages/*/model/use*.ts` | `src/entities/<x>/api/*` | FSD-008 | 4 |
| 13 | `src/pages/*/*.tsx`, `src/widgets/*/*.tsx` + стили | `<slice>/ui/*` + `<slice>/index.ts` | FSD-005, FSD-006 | 5 |
| 14 | провайдеры из `src/main.tsx`, `Theme` из layouts | `src/app/providers/*` | FSD-009 | 5 |
| 15 | ~~`src/widgets/{info,camera-control}`~~ | не переносить — решение владельца (FSD-010) | — | — |
| 16 | `src/TestUtils.tsx` | `src/shared/lib/test/render.tsx` | FSD-012 | 6 |

Целевое дерево (после перемещений 1–14 и 16; размещение `api`/`router`/`mocks` согласовано владельцем 2026-10-17):

```
src/
├── main.tsx                     # тонкая точка входа
├── app/        index.tsx, providers/, router/, layouts/{empty,main}/, styles/global.css
├── pages/      auth/, cam-page/, dashboard/, event-list/   → {ui/, index.ts}
├── widgets/    the-header/, info/, camera-control/                → {ui/, index.ts}
├── features/   (намеренная заготовка — решение владельца)
├── entities/   camera/{ui,model,lib,api}/  session/{api,model}/  user/{ui,api,model}/  + index.ts
├── shared/     api/ (http, коды ошибок), ui/callout/ + index.ts, lib/
├── assets/     scss/variables.scss   # путь зашит в vite.config.ts:15
└── mocks/      browser.js, server.js, db.js, handlers/, data/, lib/   # dev-only, вне слоёв (решение владельца)
```

## Что сканер не проверяет / UNVERIFIED

- Импорты из слоёв FSD в неизвестные слои (`?api`, `?mocks`) не считаются нарушением — найдены вручную (FSD-001, FSD-003).
- SCSS/CSS-зависимости (`@use` через `vite.config.ts:15`) в граф не входят.
- Закрыто владельцем 2026-10-17: переиспользование `widgets/info`, `widgets/camera-control` (да), удаление FSD-013 (нет), размещение `api`/`router`/`mocks` (перемещения 1, 2, 9, 10 согласованы), `features/` (заготовка).
- Фактическое поведение мок-ветки плеера (`window.__MSW_ACTIVE__`, `webrtc.ts:83`; присваивания этого флага в `src` не найдено) — предмет фазы 4.
