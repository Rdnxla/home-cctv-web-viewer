# Code Conventions

> Commit: `9e5be8f` (measured at `e599d53`; `src/` identical) · Date: 2026-10-17 · Source: `docs/ai/reports/03-biome-audit.md`
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
- Ignored paths / overrides: `.gitignore` (VCS); `public/**` — formatter+linter off; `vite.config.ts`/`playwright.config.ts` — `noNodejsModules`, `noDefaultExport` off; `src/**/*.test.tsx` — `useTopLevelRegex` off; `docs/ai/**` — assist, formatter and linter off (audit kit, added 2026-10-17). SCSS is not checked by Biome.
- Status: `yarn exec biome ci .` passes (50 files, 0 diagnostics) after the `docs/ai/**` override. `tsc --noEmit -p tsconfig.app.json` — 5 errors (BIO-002), not run in CI.

## Naming

| Item | Convention | Adoption | Example |
|---|---|---|---|
| Component files | PascalCase `.tsx`, named after the exported component | 13/13 (100%, Biome-enforced) | `src/widgets/info/InfoBlock.tsx` |
| Hook, utility, and type files | camelCase (Biome-enforced). Hook files `useX.ts` — 3/4 (75%, no consistent style). Type files — no consistent style (`types.ts`, `auth.types.ts`, `types.user.ts`, `nvrtypes.ts`) | — | `src/shared/utils/useMediaQuery.ts` |
| Tests | none yet (owner decision: tests later). Vitest picks `src/**/*.test.ts?(x)`; Playwright — `./tests` | — | — |
| Directories | kebab-case | 100% | `src/entities/user-profile-card` |
| Hooks (`useX`) | `use` + PascalCase | 6/6 (100%) | `useWebRtcPlayer` |
| Query keys and query hooks | not established: 1 query (`['sidebar']`), 2 mutations `use<Action>Mutation` | insufficient data | `src/pages/auth/model/useAuth.ts` |
| Constants | `UPPER_SNAKE_CASE` for module constants | by files read in phases 2/4 | `SEGMENTS_CONFIG` (`TheHeader.tsx:8`) |
| CSS Module classes | camelCase BEM `block__element`, accessed `styles.block__element` | by files read | `styles.cameraCard__overlay` |

## Code

| Item | Convention | Adoption | Example |
|---|---|---|---|
| Exports (named / default) | named only; no `export default` (`noDefaultExport` except vite/playwright configs) | 100% | `TheHeader.tsx` |
| Route modules | pages and layouts export `function Component()` (react-router `lazy`) | 6/6 | `src/pages/cam-page/CamPage.tsx:18` |
| Component declarations | `export function Name(props)`; no arrow-function components | 12/12 | `src/entities/camera-card/CameraCard.tsx:17` |
| Props typing | `interface <Name>Props` next to the component; destructuring style — no consistent style (body 2/3, parameter 1/3) | 3/3 interfaces | `UserProfileCard.tsx:3,10` |
| Type locations | props — inline in the component file; shared/domain types — separate file in the same folder; file suffix — no consistent style | — | `src/shared/components/callout/types.ts` |
| Imports (aliases / relative paths, `import type`) | cross-folder imports via `@/` (96% outside `src/mocks`); same-folder via `./`; type imports on a separate `import type` line (Biome + `verbatimModuleSyntax`) | 22/23 outside mocks | `src/widgets/the-header/TheHeader.tsx:5` |
| Barrel files (`index`) | none in slices yet (target: `index.ts` per slice — FSD-005; needs `noBarrelFile` override — BIO-003) | 0/9 slices | — |
| Styling | CSS Modules `*.module.scss` per component (`variables.scss` auto-injected via `vite.config.ts:15`); layout via Radix Themes props (`Flex gap='4'`); 2 legacy global `.scss` files | 10/12 SCSS (83%) | `src/widgets/info/InfoBlock.module.scss` |
| UI primitives | `@radix-ui/themes` components; icons `@radix-ui/react-icons`; forms `radix-ui` `Form` | all UI slices | `src/pages/auth/Auth.tsx:2-3` |
| Non-component module exports | no consistent style (trailing `export {…}` list vs inline `export`) | — | `src/api/auth/auth.ts:18` vs `src/shared/api/http.ts` |
| Suppressions | `biome-ignore lint/<group>/<rule>: <reason>` — always name the rule and a reason (current mocks use `<>`) | 7 in 4 files, 0 in FSD layers | `src/mocks/handlers/index.js:1` |

## Before completing any task

1. `yarn exec biome check <affected files>`
2. `yarn exec tsc --noEmit -p tsconfig.app.json` (baseline at `e599d53`: 5 known errors — see `docs/ai/reports/03-biome-audit.md`; do not add new ones)
3. For any new or moved file, verify that imports comply with `fsd-rules.md`.
