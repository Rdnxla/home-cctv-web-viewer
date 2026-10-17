---
name: fe-architecture-map
description: Architecture map and conventions for this frontend project (React, Feature-Sliced Design, TanStack Query, MSW, Biome). You MUST use this skill BEFORE any work in the repository, including adding or moving code, creating a feature, widget, page, entity, query, mutation, or MSW mock, refactoring, code review, answering questions such as "where is something located", "what depends on what", "where should a file go", "what will this change affect", as well as auditing the project structure, code style, and linting. It provides layers, slices, import rules, code style, and data-layer paths so you don't have to read the entire codebase or ask the user for context.
---

# fe-architecture-map

> STATUS: TEMPLATE. Populated during phase 6 of the audit (`docs/ai/prompts/06-synthesis.md`). While this notice is present, do not trust empty sections: inspect the code and inform the user that the map is not ready.

Freshness metadata:
- Map commit: `<not filled in>`
- Date: `<not filled in>`
- Versions: react `?`, @tanstack/react-query `?`, msw `?`, @biomejs/biome `?`

## Freshness check (do this first)

```bash
git rev-list --count <commit>..HEAD
git diff --name-status <commit> HEAD -- src | rg '^(A|D|R)'
```

- If there are no added, deleted, or renamed files in `src`, the map can be trusted (changes within existing files do not affect the structure).
- If there are A/D/R changes in slice directories, `index.*` files, or MSW handlers, the map is outdated in those areas. Regenerate the graph using `node docs/ai/scripts/fsd-imports.mjs`, inspect the changed slices, and inform the user that the map needs to be updated (see the procedure in `docs/ai/README.md`, section "Updating the Map").

## Project at a glance

<!-- FILL IN (phase 6): application purpose, tech stack, package manager, path aliases, 5–8 lines. -->

## Core rules

<!-- FILL IN (phase 6): 10–15 rules derived from the audit. Baseline rules (already applicable to any FSD project):
1. Imports are allowed only from strictly lower layers: app > pages > widgets > features > entities > shared.
2. Slices within the same layer must not import from one another (the @x notation is allowed for entities).
3. Access a slice from outside only through its `index` (Public API).
4. Name segments according to their purpose: ui, api, model, lib, config.
5. All code must comply with Biome: before finishing work, run `<pm> exec biome check <changed files>`.
Supplement project-specific rules using references/conventions.md and reports/. -->

## Where to look next

| Task | Read |
|---|---|
| Where to put a file, whether X can be imported from Y, assessing violations | `references/fsd-rules.md` |
| Dependencies, impact analysis, scenario flows | `references/interaction-map.md` |
| Code style, naming, formatting, Biome rules | `references/conventions.md` |
| A new query or mutation, query keys, a new MSW handler, fixtures | `references/data-layer.md` |

## How to add common items

<!-- FILL IN (phase 6): 3–5 short recipes based on actual project examples, including example file paths:
- A new page; a new feature; a new entity; a new query + mock; a new shared UI component. -->

## What not to do

<!-- FILL IN (phase 6): anti-patterns found in this project and accepted exceptions (mark each exception with "owner decision" and the date). -->