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
| 3 | Biome & Style Audit | prompts/03-biome-audit.md | reports/03-biome-audit.md, references/conventions.md | next (2nd) | - |
| 4 | Data & Mocks | prompts/04-data-and-mocks.md | reports/04-data-and-mocks.md, references/data-layer.md | next (1st) | - |
| 5 | Interaction Map | prompts/05-interaction-map.md | references/interaction-map.md | todo | - |
| 6 | Synthesis, Skill, Roadmap | prompts/06-synthesis.md | SKILL.md, reports/06-roadmap.md | todo | - |

Порядок оставшихся фаз: **04 → 03 → 05 → 06**. 04 первой, потому что 05 ждёт 02 и 04; 03 ни от чего, кроме 01, не зависит.

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
- 2026-10-17: целевое размещение вне-слойных папок согласовано (бывший Q1): `src/router` → `src/app/router` (FSD-002); `src/api` → `src/entities/{session,user}/{api,model}` (FSD-003); `src/mocks` остаётся вне слоёв как dev-only, импортировать его могут только `main.tsx`/`app` и тестовая инфраструктура; production-код из `src/mocks` выносится в слои (FSD-001, FSD-004).
- 2026-10-17: `src/features/` — намеренная заготовка (бывший Q2). Пустой слой не считать находкой.
- 2026-10-17: вопрос о git-ignored `public/mockServiceWorker.js` снят владельцем (бывший Q3). Не поднимать повторно, в фазе 4 только упомянуть как факт.
- 2026-10-17: `widgets/info` и `widgets/camera-control` будут переиспользоваться, это отдельная логика (бывший Q7). Не переносить в `pages`; FSD-010 закрыта как принятое исключение.
- 2026-10-17: ничего из списка FSD-013 не удалять (бывший Q8): `entities/user-profile-card`, `useClientDashboard`, тип `User`, `useCalloutMessage`, закомментированные блоки, заглушка `asd` — заготовки незавершённого проекта. Не рекомендовать удаление и не считать мусором в последующих фазах.

## Open Questions for the Owner

The agent records things here that cannot be determined from the code (intentions, exceptions, plans). Do not guess—ask.

- (открытых вопросов нет; Q1–Q8 закрыты, см. Decisions)

## Known Audit Limitations

- Сканер `fsd-imports.mjs` обрабатывает только JS/TS (38 из 53 файлов `src`); SCSS/CSS/JSON/MD-зависимости (например, `@use` в `vite.config.ts:15`) в граф не входят.
- Сканер присваивает папкам вне слоёв FSD rank −1: импорты *из* них показываются как `layer-upward` (все 9 в текущем отчёте — ложные), импорты *в* них не проверяются (пропущены `entities → ?mocks`, `pages → ?api`; найдены вручную в фазе 2).
- `tree` не установлен; дерево построено через `find`.
- Ассеты из `index.html` (`/Inter.woff2`, `/favicon.png`, `/manifest.webmanifest`) в `public/` не найдены; источник — `UNVERIFIED`.
- Biome и `tsc` ещё не запускались (предмет фазы 3).

## Session Log

| Date | Phase | What was done | What is left |
|------|-------|---------------|--------------|
| 2026-10-17 | 1 | Инвентаризация: `reports/01-inventory.md`, блок stack в `AGENTS.md`, сканер → `reports/generated/` (38 файлов, 14 слайсов, 19 рёбер, 18 нарушений, 0 циклов, без FALLBACK). | Фазы 2–6 |
| 2026-10-17 | 2 | Комплект перенесён владельцем в корень; ссылки на `ai-arch/` исправлены в `AGENTS.md` (блок stack) и `01-inventory.md`. FSD-аудит: `reports/02-fsd-audit.md` — 14 находок (high 1, medium 7, low 6), 16 перемещений, целевое дерево. Ключевое: FSD-001 (production `entities/camera-card` импортирует плеер и типы из `src/mocks`), 0 Public API, все 9 `layer-upward` — ложные. | Фазы 4, 3, 5, 6 |
| 2026-10-17 | 2 | Ответы владельца на Q1, Q2, Q3, Q7, Q8 записаны в Decisions; `02-fsd-audit.md` обновлён (FSD-010 и FSD-013 закрыты решениями владельца, таблица перемещений скорректирована). | Фазы 4, 3, 5, 6 |

## Next Step

Phase 4: Data & Mocks. Run using `docs/ai/prompts/04-data-and-mocks.md`. Cross-reference FSD-001, FSD-003, FSD-008 from `reports/02-fsd-audit.md` instead of re-describing them. Then Phase 3 (no `node_modules` reading — see Decisions; ask before any internet lookup).
