# Audit Plan and Progress Status

> This file is read first in every session and updated last. It is the sole carrier of context between chats.

## Objectives

1. Full architecture audit for FSD compliance.
2. Compliance audit for Biome style and rules (config vs. actual code).
3. Data layer audit (TanStack Query + MSW).
4. Interaction map (layers, slices, data flows) formatted as a skill named `fe-architecture-map` to avoid transferring context manually.
5. Prioritized improvement roadmap.

## Phase Status

Statuses: `todo` | `next` | `in-progress` | `done` | `blocked`.

| # | Phase | Prompt | Result | Status | Commit at the time of work |
|---|-------|--------|--------|--------|----------------------------|
| 1 | Inventory | prompts/01-inventory.md | reports/01-inventory.md, stack block in AGENTS.md | done | a22ced1 |
| 2 | FSD Audit | prompts/02-fsd-audit.md | reports/02-fsd-audit.md | done | a22ced1 |
| 3 | Biome & Style Audit | prompts/03-biome-audit.md | reports/03-biome-audit.md, references/conventions.md | done | e599d53 |
| 4 | Data & Mocks | prompts/04-data-and-mocks.md | reports/04-data-and-mocks.md, references/data-layer.md | done | e599d53 |
| 5 | Interaction Map | prompts/05-interaction-map.md | references/interaction-map.md | done | 9e5be8f |
| 6 | Synthesis, Skill, Roadmap | prompts/06-synthesis.md | SKILL.md, reports/06-roadmap.md | done | 9e5be8f |

Все фазы выполнены. Коммит `9e5be8f` не меняет `src/` (`git diff --name-only e599d53 9e5be8f -- src` → 0), поэтому все отчёты актуальны. Коммит `e599d53` («ai audit») не меняет `src/` относительно `a22ced1`, поэтому отчёты 01–02 актуальны.

## Dependencies

- 02, 03, 04 require results from 01.
- 05 requires 02 and 04.
- 06 requires all other phases.

## Decisions Made

This section records the project owner's decisions and agreements that should not be revisited. Format: `date: decision (reason)`.

- 2026-10-17: комплект аудита перенесён владельцем в корень репозитория (`docs/ai/`, `.agents/skills/`, `AGENTS.md`); папки `ai-arch/` больше нет. Действуют правила корневого `AGENTS.md`. Сканер: `node docs/ai/scripts/fsd-imports.mjs` из корня. (Прежнее расхождение двух `AGENTS.md` снято.)
- 2026-10-17: `node_modules` не читать. Для документации инструментов (в т.ч. Biome 2.4.9 в фазе 3) опираться на документацию соответствующей версии пакета; если для этого нужен интернет — сначала спросить разрешение у владельца. (Закрывает бывший Q4.)
- 2026-10-17: тестового покрытия нет намеренно; тесты будут написаны после готовности проекта и компонентов. Отсутствие тестов, `./tests` и расхождение с порогом coverage 100% в `vite.config.ts` не считать находками, только упоминать как контекст. (Закрывает бывший Q6.)
- 2026-10-17: «мусор» в репозитории агент может исправить, но только после явного разрешения владельца на каждое изменение (исключение из read-only для `src/**` и конфигов — только по запросу).
- 2026-10-17: правила Biome анализировать только по `biome.json`; не прогонять отдельные правила (`biome lint --only=…`) для подсчёта дрейфа. Число нарушений по отключённым правилам — `UNVERIFIED`. (Указание владельца в фазе 3.)
- 2026-10-17: владелец разрешил правку `biome.json` (бывший Q9). Добавлен override `docs/ai/**` с отключёнными `assist`/`formatter`/`linter`, после последнего override `public/**`. Проверка: `yarn exec biome ci .` → exit 0, 50 файлов. BIO-001 закрыта. Это единственное изменение вне `docs/ai/**`/`.agents/**`/блока stack, сделанное агентом.
- 2026-10-17: проверку документации Biome 2.4.9 в интернете не выполнять (бывший Q10). Пункты BIO-003, BIO-008 и раздел о контроле границ остаются `UNVERIFIED`; в roadmap отмечать их как «проверить при внедрении».
- 2026-10-17: целевое размещение вне-слойных папок согласовано (бывший Q1): `src/router` → `src/app/router` (FSD-002); `src/api` → `src/entities/{session,user}/{api,model}` (FSD-003); `src/mocks` остаётся вне слоёв как dev-only, импортировать его могут только `main.tsx`/`app` и тестовая инфраструктура; production-код из `src/mocks` выносится в слои (FSD-001, FSD-004).
- 2026-10-17: `src/features/` — намеренная заготовка (бывший Q2). Пустой слой не считать находкой.
- 2026-10-17: вопрос о git-ignored `public/mockServiceWorker.js` снят владельцем (бывший Q3). Не поднимать повторно, в фазе 4 только упомянуть как факт.
- 2026-10-17: `widgets/info` и `widgets/camera-control` будут переиспользоваться, это отдельная логика (бывший Q7). Не переносить в `pages`; FSD-010 закрыта как принятое исключение.
- 2026-10-17: ничего из списка FSD-013 не удалять (бывший Q8): `entities/user-profile-card`, `useClientDashboard`, тип `User`, `useCalloutMessage`, закомментированные блоки, заглушка `asd` — заготовки незавершённого проекта. Не рекомендовать удаление и не считать мусором в последующих фазах.

## Open Questions for the Owner

The agent records things here that cannot be determined from the code (intentions, exceptions, plans). Do not guess—ask.

Q1–Q10 закрыты (см. Decisions). Решения для внедрения roadmap — подробно в `reports/06-roadmap.md`, раздел «Решения, требующие согласования владельца»:

- D1: инструмент контроля границ FSD — Biome `noRestrictedImports`, Steiger или `fsd-imports.mjs` в CI (блокирует M-7).
- D2: контракт ошибок API — `{error, message}` или `{code, message}` (QW-4, L-2).
- D3: валидация ответов через valibot — да/нет (M-3, M-5).
- D4: защита маршрутов без сессии (M-4).
- D5: пункт «Архив» без маршрута — заготовка-страница или скрыть (M-6).
- D6: линтинг SCSS (stylelint) — да/нет (M-8).

## Known Audit Limitations

- Сканер `fsd-imports.mjs` обрабатывает только JS/TS (38 из 53 файлов `src`); SCSS/CSS/JSON/MD-зависимости (например, `@use` в `vite.config.ts:15`) в граф не входят.
- Сканер присваивает папкам вне слоёв FSD rank −1: импорты *из* них показываются как `layer-upward` (все 9 в текущем отчёте — ложные), импорты *в* них не проверяются (пропущены `entities → ?mocks`, `pages → ?api`; найдены вручную в фазе 2).
- `tree` не установлен; дерево построено через `find`.
- Ассеты из `index.html` (`/Inter.woff2`, `/favicon.png`, `/manifest.webmanifest`) в `public/` не найдены; источник — `UNVERIFIED`.
- Biome и `tsc` ещё не запускались (предмет фазы 3).
- Фаза 4: поведение по умолчанию TanStack Query v5 и MSW v2 (`retry: 3`, `onUnhandledRequest: 'warn'`, порядок хендлеров, devtools в prod) взято из документации версий, локально не проверено (`node_modules` не читаются). Приложение не запускалось (`dev` без разрешения запрещён), поэтому ответ Vite на немокнутый `/api/me/context` — `UNVERIFIED`.

## Session Log

| Date | Phase | What was done | What is left |
|------|-------|---------------|--------------|
| 2026-10-17 | 1 | Инвентаризация: `reports/01-inventory.md`, блок stack в `AGENTS.md`, сканер → `reports/generated/` (38 файлов, 14 слайсов, 19 рёбер, 18 нарушений, 0 циклов, без FALLBACK). | Фазы 2–6 |
| 2026-10-17 | 2 | Комплект перенесён владельцем в корень; ссылки на `ai-arch/` исправлены в `AGENTS.md` (блок stack) и `01-inventory.md`. FSD-аудит: `reports/02-fsd-audit.md` — 14 находок (high 1, medium 7, low 6), 16 перемещений, целевое дерево. Ключевое: FSD-001 (production `entities/camera-card` импортирует плеер и типы из `src/mocks`), 0 Public API, все 9 `layer-upward` — ложные. | Фазы 4, 3, 5, 6 |
| 2026-10-17 | 2 | Ответы владельца на Q1, Q2, Q3, Q7, Q8 записаны в Decisions; `02-fsd-audit.md` обновлён (FSD-010 и FSD-013 закрыты решениями владельца, таблица перемещений скорректирована). | Фазы 4, 3, 5, 6 |
| 2026-10-17 | 4 | `reports/04-data-and-mocks.md`: 15 находок (medium 6, low 9) — 1 query, 2 mutations, 13 хендлеров (8 без потребителя, 1 недостижим), 1 эндпоинт без мока. Главное: два формата ошибок при клиенте, понимающем один (DATA-001); недостижимый дубль `POST /api/auth/login` (DATA-002); токены не отправляются (DATA-005). Заполнен `references/data-layer.md` (таблицы, тестовые аккаунты/сценарии, 4 рецепта). | Фазы 3, 5, 6 |
| 2026-10-17 | 3 | `reports/03-biome-audit.md`: файлы проекта — 0 диагностик Biome при максимально строгом конфиге; все 73 диагностики — в комплекте аудита (BIO-001, ломает `biome ci`); `tsc` — 5 ошибок, CI его не запускает (BIO-002). 11 находок (high 2, medium 3, low 6). Сырые выводы: `generated/biome-check.txt`, `generated/tsc-app.txt`. Заполнен `references/conventions.md`. Дрейф правил — только по `biome.json` (указание владельца). | Q9, Q10; фазы 5, 6 |
| 2026-10-17 | 3 | По ответу на Q9 в `biome.json` добавлен override `docs/ai/**`; `yarn exec biome ci .` → exit 0. BIO-001 закрыта. Q10 — проверка docs не нужна. | Фазы 5, 6 |
| 2026-10-17 | 5 | `references/interaction-map.md` (254 строки): граф слоёв и слайсов (19 рёбер, одна диаграмма; нарушения размечены, включая не видимые сканеру), 14 карточек узлов, 7 сквозных сценариев, сквозные механизмы, hotspots, 15 правил «если меняешь X — проверь Y», глоссарий. Метрики — из `imports.json` после перезапуска сканера. Новые факты для roadmap: пункт `archive` в шапке без маршрута (`TheHeader.tsx:11`); защиты маршрутов нет; 4 `CameraCard` на дашборде открывают 4 WHEP-сессии к `cam-1`; `CameraCard` переходит на `/1/detail`, а id камер — `cam-N`. | Фаза 6 |
| 2026-10-17 | 6 | Шаг dry run удалён владельцем из промпта 06 и не выполнялся. `SKILL.md` заполнен (87 строк: обзор, 14 правил, указатели, рецепты, анти-паттерны, принятые исключения); references приведены к виду «как устроено / как менять» с заголовками commit/date и пометками `UNVERIFIED`; в `fsd-rules.md` добавлены особенности сканера и таблица согласованного размещения. `reports/06-roadmap.md`: 6 решений для владельца, 11 quick wins, 8 medium, 2 major, отложенное и факты карты MAP-1…5. В `docs/ai/README.md` дописан оборванный раздел «Updating the Map (Map Regeneration)». **Итог аудита:** код чистый по Biome при максимально строгом конфиге, 0 циклов и 0 cross-slice. Главные долги: production-код в `src/mocks` (FSD-001), нет Public API (FSD-005), API и роутер вне слоёв (FSD-002/003), CI без `tsc` при 5 ошибках типов (BIO-002), несогласованный контракт ошибок (DATA-001), токены не используются (DATA-005). | — |

## Next Step

Audit complete. When modifying structural boundaries, execute the map regeneration sequence (detailed in the README 'Map Regeneration' section)
