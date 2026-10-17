# Phase 1: Inventory

**Goal:** Record factual data about the project that will serve as the foundation for all subsequent phases. **No evaluations or recommendations, only facts.**

## Steps

1. Identify the package manager (by checking the lockfile) and record it.
2. Read `package.json`: versions of react, vite/bundler, `@tanstack/react-query`, `msw`, `@biomejs/biome`, router, state manager, UI library, testing tools; and the `scripts` list. Versions are critical: MSW v1 vs v2 and TanStack Query v4 vs v5 APIs differ significantly.
3. Read the configuration files: `tsconfig*.json` (paths and aliases), `vite.config.*` (aliases, plugins), `biome.json(c)`, `.gitignore`, and CI files if present. Note if there are any remaining traces of ESLint/Prettier.
4. Generate a `src` directory tree with a depth of 3 (`tree -L 3 src` or `find`). For each layer and slice, record the file count and the list of segments.
5. Identify entry points: `main.tsx`, the root component, router, and providers (`QueryClientProvider`, MSW initialization, theme, i18n, etc.).
6. Locate the following assets: MSW (`handlers`, `browser`/`server`, `public/mockServiceWorker.js`), tests, mock fixtures/factories, global styles, and environment variables (file names only, do not read the contents of `.env*` files).
7. Identify the top 10 largest files by line count and the top 10 largest folders.
8. Run `node docs/ai/scripts/fsd-imports.mjs`. If the report contains a "FALLBACK" notice regarding aliases, verify them against `vite.config.*` and re-run with the `--alias` flag. Do not analyze the output yet: this is a task for Phase 2.
9. Record the output of `git rev-parse --short HEAD`.

## Output

1. `docs/ai/reports/01-inventory.md` with the following structure: Tech Stack & Versions | Configs & Aliases | src Tree (Brief) | Layers, Slices, & Segments (Table) | Entry Points & Providers | MSW, Tests, & Fixtures Locations | Large Files & Folders | Undetermined Items.
2. Fill in the `<!-- stack:start -->...<!-- stack:end -->` block in `AGENTS.md` with 5–10 lines (versions of key libraries, aliases, package manager, MSW location). Do not modify anything else in `AGENTS.md`.
3. Update `docs/ai/audit-plan.md`: set Phase 1 status to `done`, add the commit hash, change the status of Phases 2, 3, and 4 to `next` (propose the sequential order for 2, 3, and 4), and list any open questions for the owner.
