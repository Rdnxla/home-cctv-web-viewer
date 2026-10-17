# Code Conventions

> Commit: `8014d73` + незакоммиченная страница архива (Biome-статус, Public API и счётчики пересчитаны `rg`/`find`/сканером 2026-10-18; остальное measured at `e599d53`) · Date: 2026-10-18 · Source: `docs/ai/reports/03-biome-audit.md`
> `UNVERIFIED`: violation counts for disabled Biome rules (not measured — owner decision); rows marked "by files read" were counted by reading files, not by `rg`.

Principle: A convention is considered established when at least 80% of the code follows it. For each item, record the adoption rate and an example file. If there is no consistent style, write "no consistent style" and record the owner's decision, if any.

## Biome

- Version: `2.4.9` (exact pin in `package.json`)
- Configuration file: `biome.json` (no comments; reasons for disabled rules not recorded)
- Check commands: `yarn exec biome check .` (do not use `--write` during an audit; during development, `--write` is allowed only at the user's explicit request). Note: `yarn lint`/`yarn check`/`yarn format` scripts WRITE to files (`--write`, `lint:biome` adds `--unsafe`). CI runs `yarn biome ci` (read-only).
- Formatter: spaces, indent 2, line width 120, LF; JS/TS single quotes (JSX too), semicolons always, trailing commas `es5`, `arrowParentheses: asNeeded`, `bracketSpacing: false` (`{a}` not `{ a }`); CSS double quotes.
- Linter: `recommended: true` + every rule of `a11y`, `correctness`, `nursery`, `performance`, `security`, `style`, `suspicious` at `error`; `complexity` = recommended. Domains `project`, `react`, `test` = all.
  - Disabled (override `**/*`, `biome.json:84-139`): `useImportExtensions`, `noUnresolvedImports`, `useJsonImportAttributes`, `useQwikValidLexicalScope`, `useExplicitType`, `noTernary`, `noReactSpecificProps`, `noUnknownAtRules`, `noImgElement`, `noNamespaceImport`, `useSolidForComponent`, `noMagicNumbers`, `noImplicitBoolean`, `useBlockStatements`, `useNamingConvention`, `useComponentExportOnlyModules`, `noJsxLiterals`; plus `complexity/useSimplifiedLogicExpression`.
  - Modified: `useFilenamingConvention` — camelCase by default, PascalCase for `*.tsx`, camelCase for `index.tsx`/`main.tsx`, camel/kebab for `*.d.ts`; `useImportType: separatedType`; `noSecrets.entropyThreshold: 100`.
- Imports: `assist.organizeImports` sorts into groups: packages → `@/app` → `@/pages` → `@/widgets` → `@/features` → `@/entities` → `@/shared` → other aliases → relative. Also `useSortedKeys` (not for JSON), `useSortedAttributes` (JSX props alphabetical), `useSortedProperties` (CSS).
- Ignored paths / overrides: `.gitignore` (VCS); `public/**` — formatter+linter off; `vite.config.ts`/`playwright.config.ts` — `noNodejsModules`, `noDefaultExport` off; `src/**/*.test.tsx` — `useTopLevelRegex` off; `src/{pages,widgets,features,entities}/*/index.ts` и `src/shared/*/index.ts` (4+1 явных glob) — `performance/noBarrelFile` off (QW-3, разрешено владельцем 2026-10-17; срабатывание правила на именованные реэкспорты подтверждено `biome check`); `docs/ai/**` — assist, formatter and linter off (audit kit, added 2026-10-17, must stay the last override). SCSS is not checked by Biome.
- Status (2026-10-18): `yarn exec biome ci .` — 149 files, 1 error: форматирование `src/pages/cam-page/ui/CamPage.tsx` (многострочные импорты) уже в коммите `8014d73`, не исправлялось (вне задачи). Новый код — 0 диагностик. `tsc --noEmit -p tsconfig.app.json` — 2 errors (BIO-002: только `src/main.tsx:16`, `src/testSetup.ts:3` — JS-модули моков без типов; ошибки `ClientDashboard.tsx` и `InfoBlock.tsx` ушли вместе с переписанным кодом), not run in CI. Сырой вывод — `docs/ai/reports/generated/tsc-app.txt`.
- Biome: комментарий сразу после последнего импорта `organizeImports` считает частью блока импортов — отделять пустой строкой.
- Biome-правила, которые чаще всего срабатывают на новом коде (по `biome check` 2026-10-17): `style/useExportsLast` (все `export` — после неэкспортируемых объявлений), `nursery/useUnicodeRegex` (флаг `u`/`v` у регулярных выражений), `performance/useTopLevelRegex`, `correctness/useUniqueElementIds` (статичный `id` в JSX запрещён — `useId()`), порядок импортов (`organizeImports`: `*.module.scss` сортируется как обычный относительный путь; `@/entities/camera` раньше `@/entities/event`; `import type` и value-импорт одного модуля — соседние строки). `exactOptionalPropertyTypes`: нельзя передать `undefined` в необязательный проп Radix (`color={cond ? undefined : 'gray'}` — ошибка `tsc`), вместо этого — две ветки JSX.
- Ещё правила, сработавшие на странице архива (2026-10-18): `nursery/noInlineStyles` — атрибут `style` в JSX запрещён; динамическое положение (шкала времени) рисуется SVG-атрибутами в процентах (`x`, `width`, `x1`), см. `pages/archive/ui/Timeline.tsx`; `nursery/useNamedCaptureGroup` — только именованные группы `(?<year>\d{4})` + `match.groups`; `nursery/useDestructuring` — `let {start} = interval` вместо `let start = interval.start`; `a11y/noSvgWithoutTitle` — каждому `<svg>` без `<title>` (в т.ч. вложенному) нужен `aria-hidden='true'`; `style/useConsistentCurlyBraces` — строка-разделитель в JSX пишется текстом, не `{' – '}`. Внутри `<button>` — только строчные элементы (`Flex as='span'`, `Text`), `div` нельзя.

## Naming

| Item | Convention | Adoption | Example |
|---|---|---|---|
| Component files | PascalCase `.tsx`, named after the exported component | 100% (Biome-enforced) | `src/widgets/info/ui/InfoBlock.tsx` |
| Hook, utility, and type files | camelCase (Biome-enforced). Hook files `useX.ts` — 3/4 (75%, no consistent style). Type files — no consistent style (`types.ts`, `auth.types.ts`, `types.user.ts`, `nvrtypes.ts`) | — | `src/shared/utils/useMediaQuery.ts` |
| Tests | none yet (owner decision: tests later). Vitest picks `src/**/*.test.ts?(x)`; Playwright — `./tests` | — | — |
| Directories | kebab-case | 100% | `src/entities/user-profile-card` |
| Hooks (`useX`) | `use` + PascalCase | 6/6 (100%) | `useWebRtcPlayer` |
| Query keys and query hooks | key factory per entity (`cameraKeys`, `eventKeys`, `recordingKeys`, `bookmarkKeys`; keys start with the entity name); query hooks `use<Noun>Query`, mutations `use<Action>Mutation` (инвалидация `<entity>Keys.all` в хуке); необязательный запрос — `params \| null` + `skipToken`; paginated lists — `keepPreviousData` | 8 of 9 queries via factory (`rg 'useQuery\('`); legacy `['sidebar']` | `src/entities/event/api/eventQueries.ts`, `src/entities/bookmark/api/bookmarkQueries.ts` |
| Domain catalogs | `as const` arrays as the source of truth (`EVENT_TYPES`), union types derived from them, `Record<Union, Meta>` for labels/colors so a new value fails `tsc` until described; runtime narrowing via `isOneOf` (`@/shared/lib/isOneOf`) | новое соглашение (журнал событий) | `src/entities/event/model/catalog.ts`, `meta.ts` |
| Constants | `UPPER_SNAKE_CASE` for module constants | by files read in phases 2/4 | `SEGMENTS_CONFIG` (`TheHeader.tsx:8`) |
| CSS Module classes | camelCase BEM `block__element`, accessed `styles.block__element` | by files read | `styles.cameraCard__overlay` |

## Code

| Item | Convention | Adoption | Example |
|---|---|---|---|
| Exports (named / default) | named only; no `export default` (`noDefaultExport` except vite/playwright configs) | 100% | `TheHeader.tsx` |
| Route modules | pages and layouts export `function Component()` (react-router `lazy`) | 6/6 | `src/pages/cam-page/ui/CamPage.tsx` (re-exported by `src/pages/cam-page/index.ts`) |
| Component declarations | `export function Name(props)`; no arrow-function components. Non-exported helper components in the same file are fine (`PlayerSurface`) | 36/36 exported (`rg '^export function [A-Z]'`), 0 arrow | `src/entities/camera/ui/CameraLiveView.tsx` |
| Props typing | `interface <Name>Props` next to the component; destructuring style — no consistent style (body 2/3, parameter 1/3) | 3/3 interfaces | `UserProfileCard.tsx:3,10` |
| Type locations | props — inline in the component file; shared/domain types — separate file in the same folder; file suffix — no consistent style | — | `src/shared/components/callout/types.ts` |
| Imports (aliases / relative paths, `import type`) | cross-folder imports via `@/` (96% outside `src/mocks`); same-folder via `./`; type imports on a separate `import type` line (Biome + `verbatimModuleSyntax`) | 22/23 outside mocks | `src/widgets/the-header/TheHeader.tsx:5` |
| Barrel files (`index`) | `index.ts` per slice with explicit named re-exports, `export type` for types, no `export *` (FSD-005); `noBarrelFile` override in place (QW-3). Inside a slice import by relative path, never via own `index.ts` | 10/14 slices (сканер, 2026-10-18) + `src/shared/ui/index.ts` | `src/entities/event/index.ts` |
| Styling | CSS Modules `*.module.scss` per component (`variables.scss` auto-injected via `vite.config.ts:15`); layout via Radix Themes props (`Flex gap='4'`, `Grid columns={…}`); panels and tiles — Radix `Card` or a bordered `aside` (`padding: 12px; border: 1px solid var(--gray-5)`); 2 legacy global `.scss` files | 15/17 component SCSS (88%, `find src -name '*.scss'`, без `variables.scss`; прежнее значение 10/12 было пересчитано: до доработок модулей было 9) | `src/widgets/info/ui/InfoBlock.module.scss` |
| Loading / error / empty states | загрузка — Radix `Skeleton` той же формы, что и содержимое; ошибка основного блока — `LoadError`, второстепенного — `InlineError` (`@/shared/ui`); пустое состояние — иконка + заголовок + пояснение (+ действие) | все списки и страницы после доработок | `src/pages/client-dashboard/ui/CameraGrid.tsx` |
| UI primitives | `@radix-ui/themes` components; icons `@radix-ui/react-icons`; forms `radix-ui` `Form` | all UI slices | `src/pages/auth/Auth.tsx:2-3` |
| Non-component module exports | no consistent style (trailing `export {…}` list vs inline `export`) | — | `src/api/auth/auth.ts:18` vs `src/shared/api/http.ts` |
| Suppressions | `biome-ignore lint/<group>/<rule>: <reason>` — always name the rule and a reason (current mocks use `<>`) | 7 in 4 files, 0 in FSD layers | `src/mocks/handlers/index.js:1` |

## Before completing any task

1. `yarn exec biome check <affected files>`
2. `yarn exec tsc --noEmit -p tsconfig.app.json` (baseline at `e599d53`: 5 known errors — see `docs/ai/reports/03-biome-audit.md`; do not add new ones)
3. For any new or moved file, verify that imports comply with `fsd-rules.md`.
