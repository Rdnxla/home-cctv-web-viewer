# Фаза 1: Инвентаризация

- Коммит: `a22ced1` (`git rev-parse --short HEAD`)
- Дата: 2026-10-17
- Режим: только факты, без оценок и рекомендаций. Анализ графа импортов — задача фазы 2.
- Расположение комплекта аудита: корень репозитория (на момент фазы 1 — `ai-arch/`, перенесён владельцем 2026-10-17). Все пути указаны от корня репозитория.

## 1. Стек и версии

Источник: `package.json`, `yarn.lock`, `.yarnrc.yml`.

| Категория | Пакет | Версия |
|---|---|---|
| Менеджер пакетов | yarn (Berry) | 4.18.0 (`packageManager`), `nodeLinker: node-modules` |
| UI-ядро | react / react-dom | 19.2.4 |
| Роутер | react-router | 7.13.2 (`createBrowserRouter`, data router) |
| Серверное состояние | @tanstack/react-query (+ devtools) | 5.95.2 |
| Моки | msw | 2.12.14 (`msw.workerDirectory: ["public"]`) |
| Линтер/форматтер | @biomejs/biome | 2.4.9 |
| Сборщик | vite / @vitejs/plugin-react | 8.0.3 / 6.0.1 |
| Язык | typescript | 6.0.2 |
| UI-библиотеки | @radix-ui/themes, radix-ui, @radix-ui/react-icons | ^3.3.0, ^1.6.7, ^1.3.2 |
| Стили | tailwindcss + @tailwindcss/vite, sass | 4.2.2, ^1.104.1 |
| Валидация | valibot | 1.3.1 |
| Ошибки | react-error-boundary | 6.1.1 |
| Unit-тесты | vitest, @vitest/coverage-v8, happy-dom | 4.1.2, 4.1.2, 20.8.9 |
| Testing Library | dom / react / jest-dom / user-event | 10.4.1 / 16.3.2 / 6.9.1 / 14.6.1 |
| E2E | @playwright/test | 1.58.2 |
| State manager | — | не обнаружен в `package.json` |

Скрипты `package.json`: `dev` (`vite --open`), `build`, `preview`, `test` (`vitest`), `test:ci` (`vitest run`), `test:e2e` (`playwright test --ui`), `test:e2e:ci`, `lint:tsc` (`tsc -b`), `lint:biome` (`biome check --write --unsafe`), `lint`, `format` (`biome format --write`), `check` (`biome check --write`), `validate`.

## 2. Конфиги и алиасы

| Файл | Ключевые факты |
|---|---|
| `tsconfig.json` | только `references` → `tsconfig.app.json`, `tsconfig.node.json` |
| `tsconfig.app.json` | `paths: {"@/*": ["./src/*"]}`, `include: ["src"]`, `strict`, `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `types: ["vitest/globals"]` |
| `tsconfig.node.json` | `include: ["vite.config.ts", "playwright.config.ts"]` |
| `vite.config.ts` | алиас `'@'` → `./src` (стр. 23); плагины `react()`, `tailwindcss()` (стр. 20); SCSS `additionalData` с `@use "@/assets/scss/variables.scss"` (стр. 15); HTTPS dev-сервер из `./certs/*.pem` (стр. 27–30); `test`: `happy-dom`, `globals`, `setupFiles: src/testSetup.ts`, `include: src/**/*.test.ts?(x)`, coverage с порогом 100 и `exclude: ['src/main.tsx', 'src/mocks/browser.ts']` (стр. 32–50) |
| `biome.json` | `$schema` из `node_modules/@biomejs/biome`; VCS + `useIgnoreFile`; organizeImports с группами по слоям FSD (стр. 14–24); formatter: 2 пробела, ширина 120, одинарные кавычки, `jsxQuoteStyle: single`, `bracketSpacing: false`; linter: `recommended` + все группы на `error`, `nursery: error`; 7 блоков `overrides` (стр. 83–233). Детальный разбор — фаза 3 |
| `playwright.config.ts` | `testDir: './tests'` (стр. 19), `baseURL: http://localhost:5173`, `webServer: yarn dev` |
| `index.html` | точка входа `/src/main.tsx` (стр. 35); ссылается на `/Inter.woff2`, `/favicon.png`, `/manifest.webmanifest` (стр. 9, 16, 17) |
| `.github/workflows/test.yml` | Node 22, corepack; `yarn biome ci && yarn test:ci && yarn test:e2e:ci` (стр. 32) |
| `.vscode/settings.json` | `js/ts.tsdk.path`, tabSize 2 |
| `.zed/settings.json` | форматтер Biome, `fixAll`/`organizeImports`/`useSorted*` при сохранении |
| `.gitignore` | `node_modules`, `dist`, `dist-ssr`, `certs`, `*.local`, `coverage`, `mockServiceWorker.js`, артефакты Playwright |
| ESLint / Prettier / husky / lint-staged | следов не найдено (`rg -l -i 'eslint\|prettier'` без node_modules и lock-файла — 0 совпадений; файлов конфигов в корне нет) |

## 3. Дерево `src` (кратко)

`find src -type f`: 53 файла, 2429 строк. По расширениям: `ts` 19, `tsx` 14, `scss` 12 (из них `*.module.scss` 10), `js` 5, `css` 1, `json` 1, `md` 1.

```
src/
├── main.tsx  TestUtils.tsx  testSetup.ts  vite-env.d.ts
├── app/        global.css, layouts/{empty,main}/
├── pages/      auth/{Auth.tsx,Auth.scss,model/}  cam-page/  client-dashboard/{…,model/}  event-list/
├── widgets/    camera-control/  info/  the-header/
├── features/   (пустая папка)
├── entities/   camera-card/  user-profile-card/
├── shared/     api/  components/callout/  utils/
├── api/        auth/{auth.ts,auth.types.ts}  user/{user.ts,types.user.ts}
├── mocks/      browser.js  server.js  db.js  data/  handlers/
├── router/     routes.ts  README.md
└── assets/     scss/variables.scss
```

## 4. Слои, слайсы и сегменты

Файлы — `find <dir> -type f | wc -l` (все типы). Сегменты — подпапки слайса. `index` — наличие `index.*` в корне слайса.

| Слой | Слайс | Файлов | Сегменты (подпапки) | index |
|---|---|---|---|---|
| app | layouts | 4 | `empty`, `main` | нет |
| app | (корень) | 1 | `global.css` | — |
| pages | auth | 3 | `model` | нет |
| pages | cam-page | 2 | — (файлы в корне слайса) | нет |
| pages | client-dashboard | 3 | `model` | нет |
| pages | event-list | 2 | — | нет |
| widgets | camera-control | 2 | — | нет |
| widgets | info | 2 | — | нет |
| widgets | the-header | 2 | — | нет |
| features | — | 0 | — | — |
| entities | camera-card | 2 | — | нет |
| entities | user-profile-card | 1 | — | нет |
| shared | (сегменты) | 7 | `api` (2), `components/callout` (3), `utils` (2) | нет |
| вне FSD | `src/api` | 4 | `auth`, `user` | нет |
| вне FSD | `src/mocks` | 11 | `data` (3), `handlers` (5) | `handlers/index.js` |
| вне FSD | `src/router` | 2 | — | нет |
| вне FSD | `src/assets` | 1 | `scss` | нет |

Сканер (`reports/generated/slices.md`) учитывает только JS/TS-файлы (38): классифицирует `src/api`, `src/mocks`, `src/router` как `?api`, `?mocks`, `?router` (неизвестные слои).

## 5. Точки входа и провайдеры

| Что | Где |
|---|---|
| HTML-вход | `index.html:35` → `/src/main.tsx` |
| Bootstrap | `src/main.tsx`: импорт `./app/global.css` и `@radix-ui/themes/styles.css` (стр. 1–2) |
| QueryClient | `src/main.tsx:10` — `new QueryClient()` без `defaultOptions` |
| Провайдеры | `src/main.tsx:29–33`: `StrictMode` → `QueryClientProvider` → `ReactQueryDevtools` + `RouterProvider` |
| Старт MSW | `src/main.tsx:12–20`: при `import.meta.env.DEV` динамический импорт `./mocks/browser`, `worker.start({quiet: true})`; рендер — после резолва промиса (стр. 24) |
| Роутер | `src/router/routes.ts`: `createBrowserRouter`, 2 корневых layout-маршрута, 4 lazy-страницы |
| Маршруты | `/` → `pages/auth/Auth` (layout `EmptyLayout`); `/dashboard` → `pages/client-dashboard/ClientDashboard`, `/:id/detail` → `pages/cam-page/CamPage`, `/events` → `pages/event-list/EventList` (layout `MainLayout`) |
| Тема | `@radix-ui/themes` `Theme` в `src/app/layouts/main/MainLayout.tsx:9` и `src/app/layouts/empty/EmptyLayout.tsx:8` (`accentColor='indigo'`, `appearance='light'`) |
| Глобальный обёрточный компонент | `shared/components/callout/CalloutMessage` оборачивает `<Outlet />` в обоих layout |
| ErrorBoundary | `react-error-boundary` есть в зависимостях, использований в `src` не найдено (`rg 'ErrorBoundary\|react-error-boundary' src` — 0) |
| i18n, auth-провайдер, глобальный state | не обнаружены |

## 6. MSW, тесты, фикстуры

| Что | Где |
|---|---|
| Browser worker | `src/mocks/browser.js` — `setupWorker(...authHandlers, ...nvrHandlers)` |
| Node server | `src/mocks/server.js` — `setupServer(...authHandlers, ...nvrHandlers)` |
| Агрегатор хендлеров | `src/mocks/handlers/index.js` — `export *` из `./auth`, `./nvr` |
| Хендлеры | `src/mocks/handlers/{auth.js, nvr.ts, webrtc.ts, mockWhep.ts}`; `mockWhep` импортируется в `nvr.ts:4`; `webrtc.ts` в агрегатор не входит |
| In-memory состояние | `src/mocks/db.js` |
| Фикстуры | `src/mocks/data/accounts.json` (статичный JSON), `src/mocks/data/nvr.ts`, типы `src/mocks/data/nvrtypes.ts` |
| Импорты из `mocks` вне `mocks` | `src/main.tsx:16`, `src/testSetup.ts:3`, `src/entities/camera-card/CameraCard.tsx:5–6` (`@/mocks/data/nvrtypes`, `@/mocks/handlers/webrtc`) |
| Service worker | `public/mockServiceWorker.js` — существует, в `.gitignore` (единственный файл в `public/`) |
| Unit-тесты | `*.test.*` / `*.spec.*` / `__tests__` — 0 файлов |
| E2E | `testDir: ./tests` — папка отсутствует |
| Тест-инфраструктура | `src/testSetup.ts` (MSW `server.listen/resetHandlers/close`), `src/TestUtils.tsx` (свой `render` с `QueryClient` `retry: false`, `gcTime: Infinity`, `BrowserRouter`) |
| Глобальные стили | `src/app/global.css`, `src/assets/scss/variables.scss` (инжектится через `vite.config.ts:15`) |
| Компонентные стили | 10 × `*.module.scss`, плюс `src/pages/auth/Auth.scss`, `src/shared/components/callout/callout.scss` |
| `.env*` | файлов не найдено (`find . -name '.env*'` без node_modules) |
| Документация в `src` | `src/router/README.md` — карта эндпоинтов `/api/nvr`, `/api/nvr/ports`, `/api/cameras`, `/api/cameras/:id`, `/api/cameras/:id/stream` |

## 7. Крупные файлы и папки

Топ-10 файлов (`find src -type f | xargs wc -l | sort -rn`):

| Строк | Файл |
|---|---|
| 266 | `src/mocks/handlers/auth.js` |
| 260 | `src/pages/auth/Auth.tsx` |
| 152 | `src/pages/auth/Auth.scss` |
| 148 | `src/app/global.css` |
| 140 | `src/mocks/handlers/webrtc.ts` |
| 140 | `src/mocks/data/nvr.ts` |
| 110 | `src/mocks/handlers/nvr.ts` |
| 98 | `src/widgets/info/InfoBlock.tsx` |
| 93 | `src/mocks/data/accounts.json` |
| 87 | `src/mocks/handlers/mockWhep.ts` |

Топ-10 папок по строкам (без `src`, 2429 строк / 53 файла):

| Строк | Файлов | Папка |
|---|---|---|
| 948 | 11 | `src/mocks` |
| 607 | 5 | `src/mocks/handlers` |
| 580 | 10 | `src/pages` |
| 417 | 3 | `src/pages/auth` |
| 304 | 3 | `src/mocks/data` |
| 202 | 6 | `src/widgets` |
| 191 | 5 | `src/app` |
| 179 | 7 | `src/shared` |
| 114 | 3 | `src/entities` |
| 109 | 2 | `src/widgets/info` |

## 8. Сканер импортов

Команда (из корня репозитория):

```bash
node docs/ai/scripts/fsd-imports.mjs
```

Вывод: `OK: 38 files, 14 slices, 19 edges, violations: 18, cycles: 0`. Алиасы: `@/`→`src` (из `tsconfig.app.json`), FALLBACK отсутствует. Результаты: `reports/generated/imports.json`, `reports/generated/slices.md`. Анализ нарушений — фаза 2.

## 9. Неопределённое (не выводится из файлов)

| # | Вопрос | Почему не определить |
|---|---|---|
| 1 | Назначение `src/api`, `src/mocks`, `src/router` вне слоёв FSD — намеренно или переходное состояние | намерение владельца |
| 2 | Пустая `src/features/` — заготовка или остаток | намерение владельца |
| 3 | `public/mockServiceWorker.js` в `.gitignore` — намеренно (генерируется при установке) или нет | в `package.json` нет `postinstall`/`msw init` |
| 4 | `vite.config.ts:37` исключает `src/mocks/browser.ts`, фактический файл — `browser.js` | расхождение имён — факт; влияние на coverage — фаза 3/4, `UNVERIFIED` |
| 5 | Ассеты из `index.html` (`/Inter.woff2`, `/favicon.png`, `/manifest.webmanifest`) отсутствуют в `public/` | возможно, вне репозитория или не созданы — `UNVERIFIED` |
| 6 | Корневой `README.md` указывает Vite 6, TS 5, Vitest 3, Playwright 1.52 — фактические версии выше (см. §1) | факт расхождения; актуальность README — вопрос владельцу |
| 7 | Будущий бэкенд и источник `baseURL` | `src/shared/api/http.ts` будет разобран в фазе 4 |
