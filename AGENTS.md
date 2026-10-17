# AGENTS.md

Project: React SPA (frontend only). Feature-Sliced Design architecture, TanStack Query, MSW for mocking, Biome for linting and formatting.

## Work Protocol (Mandatory for Every Session)

1. First and foremost, read `docs/ai/audit-plan.md`: it contains the status of the phases, decisions made, open questions, and the next step. Context between chats is transferred ONLY via files in `docs/ai/` and in the skill `.agents/skills/fe-architecture-map/`. Do not assume anything from the chat history.
2. Execute only the phase with the `next` status, unless the user specifies otherwise. Phase prompts are located in `docs/ai/prompts/`.
3. If the `fe-architecture-map` skill is already filled out, read its `SKILL.md` and verify the commit hash mark (see the "Relevance Check" section inside it) before trusting it.
4. At the end of the session, update `docs/ai/audit-plan.md`: phase status, decisions, open questions, and the next step. This is a mandatory part of the workflow, not an option.

## Access Boundaries

- Workspace: the root of this repository. Do not read or write outside of it (`~`, neighboring projects, global configs).
- Project source code and configs (`src/**`, `public/**`, `biome.json*`, `package.json`, `tsconfig*`, `vite.config.*`, etc.) are read-only. No edits, renames, formatting, installing, or updating dependencies.
- Writing is permitted ONLY to:
  - `docs/ai/**`
  - `.agents/skills/fe-architecture-map/**`
  - the block `<!-- stack:start -->...<!-- stack:end -->` in this file
- Do not read: `node_modules`, `dist`, `build`, `coverage`, `.git` (except for the git commands listed below), `.env*`, or lock-files in their entirety.
- Network usage is prohibited. If a step requires installing a package, stop and ask the user.

## Allowed Commands (Read-Only)

- File system: `ls`, `tree -L N`, `find`, `wc`, `du`, `cat`, `sed -n`, `rg`.
- Git: `git status`, `git log`, `git rev-parse`, `git rev-list --count`, `git diff --stat`.
- Biome without writing: `<pm> exec biome check .`, `biome lint .`, `biome format .` (WITHOUT `--write`, `--fix`, `--unsafe`), `biome rage`. Use `<pm> exec`, do not use `npx` (to avoid downloading packages).
- Types: `<pm> exec tsc --noEmit`.
- Audit scripts: `node docs/ai/scripts/fsd-imports.mjs`.
- `<pm>` stands for the project's package manager (determine it by the lock-file).

Everything else, especially `install`, `build`, `dev`, `git commit/checkout/stash/reset`, is forbidden without explicit permission.

## Audit Rules

- Back up every finding with a file path (and line number, if applicable). No evidence, no conclusion.
- Explicitly separate: FACT (observed in code or command output), CONCLUSION (follows from facts), ASSUMPTION (unverified, mark as `UNVERIFIED`).
- Numbers (count of files, violations, imports) must be taken from command or script outputs, not estimated by eye. The dependency graph is built by `fsd-imports.mjs`, not by you.
- Do not recommend changing things that do not violate the rules. Sort recommendations by benefit and cost.
- Format findings in a unified style (see `docs/ai/README.md`, "Finding Format" section), using IDs like `FSD-001`, `BIO-001`, `DATA-001`.
- Reports: tables and lists, no code paraphrasing.
- Document language: Russian; identifiers, paths, and code in their original language.

## Stack and Conventions

Filled out after Phase 1 (`docs/ai/prompts/01-inventory.md`). Until then, this section remains empty.

<!-- stack:start -->
- Kit location: repo root (`docs/ai/`, `.agents/skills/`); moved from `ai-arch/` on 2026-10-17. Scanner: `node docs/ai/scripts/fsd-imports.mjs`. Note: dirs outside FSD layers (`src/api`, `src/mocks`, `src/router`) get rank -1 in the scanner — imports *from* them show as `layer-upward`, imports *into* them are not flagged.
- Package manager: yarn 4.18.0 (`nodeLinker: node-modules`) → `<pm> exec` = `yarn exec`.
- Core: react 19.2.4, react-router 7.13.2 (`createBrowserRouter`, lazy routes in `src/router/routes.ts`), vite 8.0.3, typescript 6.0.2.
- Data: @tanstack/react-query 5.95.2 (v5 API, `gcTime`); `QueryClient` in `src/main.tsx:10`; valibot 1.3.1.
- Mocks: msw 2.12.14 (v2 API, `http`/`HttpResponse`); `src/mocks/{browser.js,server.js,db.js,handlers/,data/}`; worker in `public/mockServiceWorker.js` (git-ignored); starts in DEV only.
- Lint/format: @biomejs/biome 2.4.9, `biome.json`; no ESLint/Prettier.
- UI: @radix-ui/themes + radix-ui, Tailwind 4, SCSS modules (`variables.scss` auto-injected).
- Tests: vitest 4.1.2 + happy-dom + Testing Library (`src/testSetup.ts`, `src/TestUtils.tsx`); Playwright 1.58.2 (`./tests`, missing). 0 test files at `a22ced1`.
- Alias: `@/*` → `src/*` (`tsconfig.app.json`, `vite.config.ts`). Non-FSD top-level dirs: `src/api`, `src/mocks`, `src/router`, `src/assets`; `src/features` is empty.
<!-- stack:end -->
