# Фаза 3: Аудит Biome и стиля

- Коммит: `e599d53` (`src/` идентичен `a22ced1`)
- Дата: 2026-10-17
- Biome: `2.4.9` (`yarn exec biome --version`; совпадает с `package.json` и `$schema` → `./node_modules/@biomejs/biome/configuration_schema.json`)
- Ограничения сессии (решение владельца): правила Biome анализировались **только по `biome.json`**, без прогона отдельных правил (`--only`); `node_modules` не читались. Поэтому количество нарушений по отключённым правилам и поведение отдельных правил — `UNVERIFIED`.
- Команды:
  - `yarn exec biome check . --max-diagnostics=none --colors=off` → `reports/generated/biome-check.txt` (1586 строк, полностью)
  - `yarn exec biome check src index.html vite.config.ts playwright.config.ts biome.json package.json tsconfig*.json .vscode .zed .github` (только файлы проекта)
  - `yarn exec tsc --noEmit -p tsconfig.app.json` → `reports/generated/tsc-app.txt`; `-p tsconfig.node.json`

## Сводка

| Метрика | Значение |
|---|---|
| `biome check .` (весь репозиторий) | **exit 1**: 72 errors + 1 warning, 52 файла |
| из них в файлах проекта (`src`, конфиги) | **0** (50 файлов) |
| из них в комплекте аудита | 73: `docs/ai/scripts/fsd-imports.mjs` — 72, `docs/ai/reports/generated/imports.json` — 1 |
| auto-fixable (FIXABLE) | 35 из 73 |
| `tsc --noEmit` app | **exit 2**: 5 ошибок в 4 файлах |
| `tsc --noEmit` node (`vite.config.ts`, `playwright.config.ts`) | exit 0 |
| `biome-ignore` в `src` | 7 в 4 файлах (все — `src/mocks/**` и `src/TestUtils.tsx`) |
| Файлы `src`, которые Biome не проверяет | 13 из 53: 12 `.scss`, 1 `.md` (Biome проверил 40) |

Код проекта полностью соответствует очень строгой конфигурации: все группы правил на `error`, включая `nursery`. Две проблемы связаны с инструментами вокруг кода. Первая: файлы комплекта аудита, закоммиченные в `e599d53`, ломают `biome ci` в CI (BIO-001). Вторая: CI не запускает `tsc`, а в коде есть 5 ошибок типов (BIO-002).

## Обзор конфигурации (`biome.json`)

| Раздел | Настройка | Строки |
|---|---|---|
| VCS | `enabled`, `clientKind: git`, `useIgnoreFile: true` (учитывается `.gitignore`) | 3-7 |
| `files` | не задан → проверяется всё, что не в `.gitignore`, включая `docs/ai/**` | — |
| Formatter | пробелы, ширина 2, `lineWidth: 120`, `lineEnding: lf` | 42-48 |
| JS formatter | `quoteStyle: single`, `jsxQuoteStyle: single`, `semicolons: always`, `trailingCommas: es5`, `arrowParentheses: asNeeded`, `bracketSpacing: false`, `quoteProperties: asNeeded`, `expand: auto` | 49-60 |
| CSS | `parser.tailwindDirectives: true`, `formatter.quoteStyle: double` | 34-41 |
| Assist | `organizeImports` с группами: пакеты → `@/app` → `@/pages` → `@/widgets` → `@/features` → `@/entities` → `@/shared` → прочие алиасы → относительные пути; `useSortedAttributes`, `useSortedKeys`, `useSortedProperties` — on | 8-33 |
| Linter: группы | `recommended: true`; `a11y`, `correctness`, `nursery`, `performance`, `security`, `style`, `suspicious` — `"error"` (все правила группы); `complexity` — `recommended` | 68-81 |
| Linter: domains | `project: all`, `react: all`, `test: all` | 62-66 |
| Override `**/*` | фактически глобальные отключения (см. «Дрейф») + `useFilenamingConvention: camelCase`, `useImportType: separatedType`, `noSecrets.entropyThreshold: 100` | 84-139 |
| Override `**/*.tsx` | `useFilenamingConvention: PascalCase` | 140-156 |
| Override `**/index.tsx`, `src/main.tsx` | `useFilenamingConvention: camelCase` | 157-173 |
| Override `**/*.d.ts` | `camelCase` или `kebab-case` | 174-190 |
| Override `vite.config.ts`, `playwright.config.ts` | `noNodejsModules: off`, `noDefaultExport: off` | 191-203 |
| Override `src/**/*.test.tsx` | `useTopLevelRegex: off` | 204-213 |
| Override `**/*.json(c)` | `useSortedKeys: off` | 214-223 |
| Override `public/**` | formatter и linter выключены | 224-232 |

`recommended` не отключён. Строже некуда: каждая группа включена целиком.

## Результаты `check`

### По областям

| Область | Диагностик | Файлов |
|---|---|---|
| `src/**` | 0 | 40 |
| конфиги проекта (`vite.config.ts`, `playwright.config.ts`, `biome.json`, `package.json`, `tsconfig*.json`, `index.html`, `.vscode`, `.zed`, `.github`) | 0 | 10 |
| `docs/ai/scripts/fsd-imports.mjs` | 72 | 1 |
| `docs/ai/reports/generated/imports.json` | 1 (`format`) | 1 |

Горячих точек по слоям и слайсам нет: в `src` диагностик 0.

### Топ-10 правил (все в `docs/ai/scripts/fsd-imports.mjs`)

| # | Правило | Кол-во | Тип |
|---|---|---|---|
| 1 | `lint/nursery/useUnicodeRegex` | 12 | lint |
| 2 | `assist/source/useSortedKeys` | 11 | assist |
| 3 | `lint/nursery/useNamedCaptureGroup` | 7 | lint |
| 4 | `lint/performance/useTopLevelRegex` | 5 | lint |
| 5 | `lint/style/useExplicitLengthCheck` | 4 | lint |
| 6 | `lint/nursery/useDestructuring` | 4 | lint |
| 7 | `lint/nursery/noIncrementDecrement` | 4 | lint |
| 8 | `lint/nursery/noContinue` | 4 | lint |
| 9 | `lint/suspicious/noAssignInExpressions` | 3 | lint |
| 10 | `lint/style/useSingleVarDeclarator`, `lint/nursery/noReturnAssign`, `lint/correctness/noProcessGlobal`, `lint/correctness/noNodejsModules` | по 2 | lint |

Ещё: `format` 2 (`fsd-imports.mjs`, `imports.json`), `assist/source/organizeImports` 1, по 1 — `noUnusedExpressions`, `noConsole`, `useTemplate`, `useFilenamingConvention`, `noNestedTernary`, `noMultiAssign`, `noUnusedFunctionParameters`, `noCommaOperator` (единственный warning, `fsd-imports.mjs:124`).

По типу: lint 59, assist 12, format 2. Auto-fixable: 35, требуют ручной правки: 38. Из 20 lint-правил 7 — из группы `nursery` (34 диагностики).

### Ошибки TypeScript (`reports/generated/tsc-app.txt`)

| Файл:строка | Код | Суть |
|---|---|---|
| `src/main.tsx:16` | TS7016 | `./mocks/browser` — JS без деклараций |
| `src/testSetup.ts:3` | TS7016 | `./mocks/server` — JS без деклараций |
| `src/pages/client-dashboard/ClientDashboard.tsx:35` | TS2375 | `className: string \| undefined` несовместим с `className?: string` при `exactOptionalPropertyTypes` (`CameraCard.tsx:10`) |
| `src/widgets/info/InfoBlock.tsx:88` | TS7053 | `colors[m.type]`: `type` выведен как `string` (массив `messages` без `as const`/типа, `:6-52`) |
| `src/widgets/info/InfoBlock.tsx:89` | TS2345 | `renderIcon(m.type)`: `string` вместо `MessageType` |

## Дрейф конфигурации (только по `biome.json`)

Отключены в override `**/*` (`biome.json:84-139`) и `complexity` (`:72`). Колонка «Оценка» основана на конфиге и коде, прочитанном в фазах 2 и 4. Число нарушений при включении правила не измерялось (решение владельца) — `UNVERIFIED`.

| Правило | Вероятная причина отключения | Оценка |
|---|---|---|
| `correctness/useQwikValidLexicalScope`, `performance/useSolidForComponent`, `suspicious/noReactSpecificProps` | правила для Qwik/Solid, включились вместе с целыми группами | оставить выключенными: к стеку не относятся |
| `performance/noImgElement` | правило для Next.js | оставить |
| `correctness/useImportExtensions`, `correctness/noUnresolvedImports`, `correctness/useJsonImportAttributes` | `moduleResolution: bundler`, импорты без расширений, JSON без атрибутов (`db.js:1`) | оставить |
| `suspicious/noUnknownAtRules` | Tailwind-директивы; при этом `css.parser.tailwindDirectives: true` | `UNVERIFIED`: возможно, отключение избыточно |
| `nursery/noTernary`, `nursery/useExplicitType`, `style/noMagicNumbers`, `style/noImplicitBoolean`, `style/useBlockStatements`, `style/noJsxLiterals`, `complexity/useSimplifiedLogicExpression`, `performance/noNamespaceImport` | стилистический выбор (тернарники в JSX, вывод типов, литералы UI-текста без i18n) | выбор владельца, не нарушение |
| `style/useNamingConvention` | не указана | кандидат на проверку: имена в коде, прочитанном в фазах 2 и 4, единообразны (camelCase/PascalCase/`UPPER_CASE` для констант). Исключения из соглашения — BEM-ключи CSS-модулей (`styles.cameraCard__overlay`), JSON-коды ошибок (`'ACCOUNT_LOCKED'`) — `UNVERIFIED` |
| `style/useComponentExportOnlyModules` | страницы экспортируют `Component` для react-router `lazy`; `CalloutMessage.tsx` экспортирует компонент и хук | оставить или включить с override для `src/shared/**` — `UNVERIFIED` |

Технический долг «правило выключено, потому что код массово его нарушает» по конфигу не просматривается. Ни у одного отключения нет комментария с причиной: `biome.json` не поддерживает комментарии, `biome.jsonc` — поддерживает.

## Находки

### BIO-001: `biome ci` в CI падает из-за файлов комплекта аудита

- Severity: high
- Type: fact
- Location: `.github/workflows/test.yml:32` (`yarn biome ci`); `docs/ai/scripts/fsd-imports.mjs` (72 диагностики), `docs/ai/reports/generated/imports.json` (1)
- Rule: CI должен проверять код проекта; `biome.json` не исключает `docs/**` (`files` не задан, `:3-7`)
- Evidence: `reports/generated/biome-check.txt`: 73 диагностики, все в `docs/ai/**`; файлы закоммичены в `e599d53` → следующий push в `main` уронит шаг Validate (`UNVERIFIED`: CI не запускался, но `biome ci` проверяет то же, что и `check`)
- Recommendation: override в стиле существующего `public/**` (`biome.json:224-232`): `{"includes": ["docs/ai/**"], "formatter": {"enabled": false}, "linter": {"enabled": false}, "assist": {"enabled": false}}`. Альтернатива — `files.includes` с исключением `!docs/ai/**`
- Effort: S
- **Статус: исправлено 2026-10-17** с разрешения владельца: override добавлен в `biome.json:233-244`; `yarn exec biome ci .` → exit 0, `Checked 50 files`

### BIO-002: CI не проверяет типы; в коде 5 ошибок TypeScript

- Severity: high
- Type: fact
- Location: `.github/workflows/test.yml:32` (нет `tsc`); `package.json` → `lint:tsc: tsc -b` есть, но вызывается только из `lint`/`validate` (локально); ошибки — таблица выше
- Rule: `tsconfig.app.json` — `strict`, `exactOptionalPropertyTypes`; Biome типы не проверяет
- Evidence: `tsc --noEmit -p tsconfig.app.json` → exit 2, 5 ошибок
- Recommendation: (1) добавить `yarn lint:tsc` в шаг Validate; (2) исправить ошибки: `src/mocks/{browser,server,db}.js` и `handlers/{auth,index}.js` → `.ts` (5 JS-файлов в TS-проекте; `vite.config.ts:37` уже исключает `src/mocks/browser.ts`, то есть ожидается TS); `messages` в `InfoBlock.tsx` типизировать как `Message[]`/`as const`; в `CameraCardProps` — `className?: string | undefined`. Правки `src` — только с разрешения владельца
- Effort: S

### BIO-003: `performance: "error"` конфликтует с Public API FSD

- Severity: medium
- Type: conclusion + UNVERIFIED
- Location: `biome.json:76` (`"performance": "error"` включает `noBarrelFile`, `noReExportAll`); `src/mocks/handlers/index.js:1-2` (оба правила подавлены `biome-ignore-all`)
- Rule: FSD — внешний доступ к слайсу только через `index` (FSD-005)
- Evidence: единственный barrel в `src` потребовал двух подавлений. 9 будущих `index.ts` слайсов и `shared/*/index.ts` тоже будут barrel-файлами (`UNVERIFIED`: срабатывает ли `noBarrelFile` на именованный реэкспорт `export {X} from './ui/X'` в 2.4.9, проверить по docs)
- Recommendation: до выполнения FSD-005 добавить override `{"includes": ["src/{pages,widgets,features,entities}/*/index.ts", "src/shared/*/index.ts"], "linter": {"rules": {"performance": {"noBarrelFile": "off"}}}}`. `noReExportAll` оставить: Public API должен быть явным (FSD-аудит, «без `export *`»)
- Effort: S

### BIO-004: группа `nursery` включена целиком

- Severity: medium
- Type: fact + conclusion
- Location: `biome.json:75` (`"nursery": "error"`)
- Evidence: 34 из 73 диагностик в `fsd-imports.mjs` — правила `nursery` (7 правил). Nursery-правила нестабильны: в минорных версиях Biome их добавляют, меняют и переносят в другие группы (по docs Biome). Версия зафиксирована точно (`"@biomejs/biome": "2.4.9"`), что сейчас снижает риск
- Conclusion: обновление Biome может уронить CI без изменений в коде
- Recommendation: сохранить точную версию; обновлять Biome отдельным PR с прогоном `biome check .`; либо перечислить выбранные nursery-правила явно вместо `"error"` для всей группы
- Effort: S

### BIO-005: скрипты `lint`/`validate` изменяют код (`--write --unsafe`)

- Severity: medium
- Type: fact
- Location: `package.json` → `lint:biome: biome check --write --unsafe`, `lint: yarn lint:tsc && yarn lint:biome`, `validate: yarn lint && …`, `check: biome check --write`, `format: biome format --write`
- Rule: проверка не должна менять файлы; в проекте нет локального read-only lint-скрипта
- Evidence: CI использует read-only `yarn biome ci` (`test.yml:32`), локальный `validate` применяет небезопасные фиксы
- Recommendation: `lint:biome: biome check` (или `biome ci`), отдельный `fix: biome check --write` (`--unsafe` — только вручную)
- Effort: S

### BIO-006: SCSS вне контроля Biome

- Severity: low
- Type: fact + UNVERIFIED
- Location: 12 файлов `src/**/*.scss` (10 `*.module.scss`, `pages/auth/Auth.scss`, `shared/components/callout/callout.scss`, `assets/scss/variables.scss`)
- Evidence: Biome проверил 40 из 53 файлов `src`; не проверены 12 `.scss` и 1 `.md`. CSS (`app/global.css`) проверяется. Поддержка SCSS в 2.4.9 — `UNVERIFIED`
- Recommendation: при необходимости — stylelint + `stylelint-config-standard-scss` (новая зависимость — решение владельца) или перенос стилей в `.module.css`
- Effort: S/M

### BIO-007: базовые отключения правил оформлены как override `**/*`

- Severity: low
- Type: fact
- Location: `biome.json:84-139`
- Evidence: override с `includes: ["**/*"]` применяется ко всем файлам, то есть дублирует назначение `linter.rules`. При этом `complexity.useSimplifiedLogicExpression` отключён в `linter.rules` (`:72`), а остальные — в override
- Recommendation: перенести содержимое override в `linter.rules`; перейти на `biome.jsonc` и прокомментировать причины отключений
- Effort: S

### BIO-008: `noSecrets` с порогом энтропии 100

- Severity: low
- Type: fact + UNVERIFIED
- Location: `biome.json:130-135`
- Evidence: порог значительно выше значения по умолчанию (по docs ≈ 41 — `UNVERIFIED`), то есть проверка секретов практически отключена для всего проекта; моки содержат пароли и токены (`src/mocks/data/accounts.json`, `src/mocks/data/nvr.ts`)
- Recommendation: вернуть порог по умолчанию глобально и поднять/отключить только для `src/mocks/**`
- Effort: S

### BIO-009: подавления без причины и общий `biome-ignore lint`

- Severity: low
- Type: fact
- Location: `src/mocks/handlers/webrtc.ts:1,82`, `src/mocks/handlers/mockWhep.ts:19,80` (причина `<>`); `src/TestUtils.tsx:35` (`// biome-ignore lint: test file` — подавляет все lint-правила строки); `src/mocks/handlers/index.js:1-2` (`<mock>`)
- Evidence: 7 подавлений в 4 файлах; в слоях FSD — 0
- Recommendation: указывать конкретное правило и причину; `webrtc.ts:1` (`noTsIgnore` для всего файла) исчезнет вместе с `@ts-ignore` при переносе плеера (FSD-001, DATA-008)
- Effort: S

### BIO-010: настройки редакторов расходятся

- Severity: low
- Type: fact
- Location: `.zed/settings.json` (Biome — форматтер, `fixAll`, `organizeImports`, `useSorted*` при сохранении); `.vscode/settings.json` (только `js/ts.tsdk.path`, `tabSize`); `.vscode/extensions.json` нет
- Evidence: в VS Code форматтер по умолчанию не задан → встроенный форматтер TS может расходиться с Biome (кавычки, `bracketSpacing`)
- Recommendation: `.vscode/settings.json`: `editor.defaultFormatter: biomejs.biome`, `editor.codeActionsOnSave` (`source.fixAll.biome`, `source.organizeImports.biome`); `.vscode/extensions.json` с `biomejs.biome`
- Effort: S

### BIO-011: override для тестов покрывает только `*.test.tsx`

- Severity: low (отложено: тестов пока нет — решение владельца)
- Type: fact
- Location: `biome.json:204-213` (`src/**/*.test.tsx`) и `vite.config.ts:48` (`src/**/*.test.ts?(x)`)
- Recommendation: при появлении тестов — `src/**/*.test.{ts,tsx}`
- Effort: S

## Неявные соглашения

Подсчёт — `rg` по `src` (команда в начале отчёта и в сессии) + список файлов из фазы 1. Порог соглашения — ≥ 80%.

| Соглашение | Доля | Статус | Пример |
|---|---|---|---|
| Именованные экспорты, без `export default` | 0 default в `src` | соглашение (100%) + `noDefaultExport` | `src/widgets/the-header/TheHeader.tsx` |
| Компоненты — `export function Name()` | 12/12 TSX-компонентов; стрелочных экспортируемых — 0 | соглашение (100%) | `src/entities/camera-card/CameraCard.tsx:17` |
| Страницы и layout экспортируют `Component` (для `lazy`) | 6/6 (`pages/*` 4, `app/layouts/*` 2) | соглашение (100%) | `src/pages/cam-page/CamPage.tsx:18` |
| Props — `interface XProps` | 3/3 (`CameraCardProps`, `UserProfileCardProps`, `ProviderProps`) | соглашение (выборка мала) | `src/entities/user-profile-card/UserProfileCard.tsx:3` |
| Деструктуризация props | в теле 2/3, в параметре 1/3 | нет единого стиля | `CameraCard.tsx:18` против `CalloutMessage.tsx:9` |
| Файлы компонентов PascalCase `.tsx` | 13/13 (кроме `main.tsx`) | соглашение + `useFilenamingConvention` | `InfoBlock.tsx` |
| Прочие TS/JS — camelCase | 100% (обеспечивает Biome) | соглашение | `useMediaQuery.ts` |
| Суффиксы файлов типов | `types.ts`, `auth.types.ts`, `types.user.ts`, `nvrtypes.ts` — 4 варианта в 4 файлах | нет единого стиля | `src/api/auth/auth.types.ts` |
| Папки kebab-case | 100% каталогов `src` | соглашение | `src/entities/user-profile-card` |
| Хуки `useX` | 6/6 экспортируемых хуков | соглашение | `useWebRtcPlayer` |
| Файл хука = `useX.ts` | 3/4 (`webrtc.ts` содержит хук) | нет единого стиля (75%) | `src/shared/utils/useMediaQuery.ts` |
| Импорты между папками через `@/` | 22 из 28 (79%); вне `src/mocks` — 22 из 23 (96%) | соглашение вне моков | `TheHeader.tsx:5`; исключение `pages/auth/model/useAuth.ts:2` |
| Импорты внутри папки `./` | 24 | соглашение (стили, соседние модули) | `CamPage.tsx:4` |
| `import type` отдельной строкой | 14 строк; обеспечивают `useImportType: separatedType` и `verbatimModuleSyntax` | соглашение (инструмент) | `src/TestUtils.tsx:2` |
| Порядок импортов по слоям FSD | обеспечивает `organizeImports` (`biome.json:14-24`) | соглашение (инструмент) | `MainLayout.tsx:1-5` |
| Место экспорта в модулях-не-компонентах | список `export {…}` в конце: `api/auth/auth.ts`, `api/user/user.ts`, `shared/utils/auth.ts`, `mocks/db.js`, `mocks/handlers/{auth.js,webrtc.ts}`; inline `export`: `shared/api/http.ts`, `authErrorCodes.ts`, `useMediaQuery.ts`, `mocks/data/*`, `mocks/handlers/{nvr,mockWhep}.ts` | нет единого стиля | — |
| Barrel-файлы | в слайсах 0; единственный — `src/mocks/handlers/index.js` | — (Public API — FSD-005) | — |
| Стили — CSS Modules `*.module.scss` | 10/12 SCSS (83%) | соглашение | `src/widgets/info/InfoBlock.module.scss` |
| Классы CSS Modules — camelCase-BEM `block__element` | `cameraCard__overlay`, `camPage__camLink`, `clientDashboard__cameraCard` | соглашение (по прочитанным файлам) | `CameraCard.tsx:44` |
| UI-примитивы — Radix Themes (`Box`, `Flex`, `Heading`, `Text`) | во всех компонентах `pages/widgets/entities` (`externalsByLayer` в `imports.json`) | соглашение | `ClientDashboard.tsx:1` |
| Query keys / query-хуки | 1 ключ, 1 query | недостаточно данных (DATA-010) | — |
| Тесты | 0 файлов (решение владельца) | — | — |

## Контроль архитектурных границ

| Что | Чем | Статус |
|---|---|---|
| Порядок импортов по слоям | `assist.organizeImports.groups` | работает (`biome.json:14-24`) |
| Запрет импортов вверх и между слайсами | `style/noRestrictedImports` с override по слоям (например, для `src/entities/**` — запрет `@/features/**`, `@/widgets/**`, `@/pages/**`, `@/app/**`, `@/mocks/**`) | не настроено; поддержка шаблонов (`patterns`) в 2.4.9 — `UNVERIFIED` |
| Запрет глубоких импортов (Public API) | `noRestrictedImports` по шаблону `@/*/*/**` или nursery-правило ограничения импортов | `UNVERIFIED` |
| Циклы | `nursery/noImportCycles` (domain `project`) — при `nursery: "error"` и `project: "all"` предположительно уже включено | `UNVERIFIED`; сейчас циклов 0 (`fsd-imports.mjs`) |
| Полная проверка FSD | Steiger (`steiger` + `@feature-sliced/steiger-plugin`, devDependencies) | новая зависимость + сеть → решение владельца |
| Регресс графа | `node docs/ai/scripts/fsd-imports.mjs` в CI (без зависимостей) | возможно; сначала выполнить BIO-001 |

## Рекомендации (по пользе/стоимости)

| # | Действие | Находка | Стоимость |
|---|---|---|---|
| 1 | ~~Исключить `docs/ai/**` из Biome~~ — сделано 2026-10-17 | BIO-001 | S, 1 override |
| 2 | Добавить `yarn lint:tsc` в CI и исправить 5 ошибок типов | BIO-002 | S |
| 3 | Override `noBarrelFile: off` для `index.ts` слайсов — до FSD-005 | BIO-003 | S |
| 4 | Read-only `lint:biome`, отдельный `fix` | BIO-005 | S |
| 5 | `noRestrictedImports` по слоям (после проверки docs 2.4.9) | контроль границ | M |
| 6 | Вернуть порог `noSecrets`, послабление — только для `src/mocks/**` | BIO-008 | S |
| 7 | VS Code: Biome как форматтер по умолчанию | BIO-010 | S |
| 8 | Переход на `biome.jsonc`, перенос override `**/*` в `linter.rules` с комментариями | BIO-007 | S |
| 9 | Политика обновления Biome / явный список nursery-правил | BIO-004 | S |

## Контекст (не находки)

- Тестов нет — решение владельца. При текущем CI шаги `yarn test:ci` и `yarn test:e2e:ci` выполняются без тестовых файлов и без папки `./tests`; их результат — `UNVERIFIED` (CI не запускался).
- ESLint, Prettier, husky, lint-staged — не обнаружены (фаза 1), конфликтов инструментов нет.

## UNVERIFIED

- Число нарушений по каждому отключённому правилу (не измерялось — решение владельца: анализ только по `biome.json`).
- Точное поведение правил 2.4.9: `noBarrelFile` на именованные реэкспорты, `noRestrictedImports.patterns`, `noImportCycles`, значение `noSecrets` по умолчанию, поддержка SCSS. Владелец решил не проверять документацию (2026-10-17) — проверить при внедрении соответствующих рекомендаций.
- Фактическое падение CI до исправления BIO-001 — CI не запускался (после исправления `biome ci .` локально проходит).
