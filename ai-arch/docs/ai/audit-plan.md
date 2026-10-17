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
| 1 | Inventory | prompts/01-inventory.md | reports/01-inventory.md, stack block in AGENTS.md | next | - |
| 2 | FSD Audit | prompts/02-fsd-audit.md | reports/02-fsd-audit.md | todo | - |
| 3 | Biome & Style Audit | prompts/03-biome-audit.md | reports/03-biome-audit.md, references/conventions.md | todo | - |
| 4 | Data & Mocks | prompts/04-data-and-mocks.md | reports/04-data-and-mocks.md, references/data-layer.md | todo | - |
| 5 | Interaction Map | prompts/05-interaction-map.md | references/interaction-map.md | todo | - |
| 6 | Synthesis, Skill, Roadmap | prompts/06-synthesis.md | SKILL.md, reports/06-roadmap.md | todo | - |

## Dependencies

- 02, 03, 04 require results from 01.
- 05 requires 02 and 04.
- 06 requires all other phases.

## Decisions Made

This section records the project owner's decisions and agreements that should not be revisited. Format: `date: decision (reason)`.

- (none yet)

## Open Questions for the Owner

The agent records things here that cannot be determined from the code (intentions, exceptions, plans). Do not guess—ask.

- (none yet)

## Known Audit Limitations

- (to be filled by the agent: what could not be verified and why)

## Session Log

| Date | Phase | What was done | What is left |
|------|-------|---------------|--------------|
| -    | -     | -             | -            |

## Next Step

Phase 1: Inventory. Run using `docs/ai/prompts/01-inventory.md`.
