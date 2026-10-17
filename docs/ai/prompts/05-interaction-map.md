# Phase 5: Interaction Map

Precondition: Phases 2 and 4 are `done`. "Update" mode execution: if a map already exists, rerun `fsd-imports.mjs`, compare differences against the existing map, and edit only the modified blocks.

Objective: Produce a reference document that allows a new developer session to immediately understand file distribution, component dependencies, and side-effects without reading raw code. The map describes the ACTUAL current architecture (including violations), not the ideal structure. Desired architectural shifts must be placed in the roadmap.

## Steps

1. **Source Data Parsing**: Extract relationship paths, fan-in/fan-out metrics, and rule violations directly from `reports/generated/imports.json`. Do not recalculate these metrics manually.
2. **Layer Interaction Diagram**: Generate a Mermaid diagram visualizing dependencies between layers, including exact import counts. Highlight architectural boundary violation edges explicitly.
3. **Slice Interaction Diagram**: If total relationship edges are ≤ 80, create a single comprehensive Mermaid diagram; otherwise, generate separate sub-graphs per layer interaction (e.g., `pages → widgets/features`, `widgets → features/entities`, `features → entities`).
4. **Slice Fact Sheets**: Create a compact index card entry for each slice (via table or a brief block spanning 4-6 lines) covering: purpose (derived from names and source code), Public API footprint (items exported through the `index` entrypoint), inbound dependencies (derived from graph), outbound consumers (derived from graph), data ownership details (associated queries, mutations, and MSW handlers from `data-layer.md`), and routing paths (if the slice resides in the page layer).
5. **End-to-End User Journeys**: Trace data and component execution flows for 5-8 primary user interactions following the chain: `route → page → widgets → features → entities → api-function → MSW-handler`. Select journeys based on dense dependency counts or critical user entry routes.
6. **Cross-Cutting Concerns**: Document shared application infrastructure including bootstrap providers in the `app` layer, routing engines, global state managers, i18n localization, layout themes, global exception handlers, and authentication modules (only if actively present in the codebase, detailing precise file paths).
7. **Architectural Hot Spots**: Pinpoint structural outliers including slices with maximum fan-in/fan-out metrics, components locked in circular dependencies, and hidden slices lacking a valid Public API.
8. **Impact Mitigation Rules**: Draft 8-15 actionable rules under the title "If modifying X, make sure to verify Y" derived from the graph topology (e.g., "modifying `entities/user` will impact N downstream slices, listed here").
9. **Project Domain Glossary**: Define a glossary mapping core domain business concepts directly to their corresponding architectural slices, if apparent from naming conventions.

## Output

1. `.agents/skills/fe-architecture-map/references/interaction-map.md`: Include the target commit hash, execution timestamp, and the exact CLI commands required for regeneration directly in the file header.
2. **Size Constraint**: Cap the file at ~400 lines. If content exceeds this limit, extract the slice fact sheets into dedicated markdown files under `references/slices/<layer>.md` and link them from the main map.
3. Update `docs/ai/audit-plan.md`.