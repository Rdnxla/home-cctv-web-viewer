# docs/ai: Architecture Audit and Project Map

This directory contains everything needed to conduct an audit across multiple short Codex sessions without manually carrying context from chat to chat.

## Structure

AGENTS.md                              rules and access boundaries (repository root)
docs/ai/
README.md                            this file
audit-plan.md                        work STATUS: phase statuses, decisions, next step
prompts/01..06-*.md                  prompt for each phase
scripts/fsd-imports.mjs              deterministic import scanner (graph, violations, cycles)
reports/                             phase reports (01-inventory.md ... 06-roadmap.md)
reports/generated/                   script outputs (imports.json, slices.md), re-generatable
.agents/skills/fe-architecture-map/    final skill (interaction map and conventions)
SKILL.md
references/fsd-rules.md              FSD rules used for verification
references/conventions.md            code style: Biome + informal project conventions
references/data-layer.md             TanStack Query + MSW: keys, hooks, handlers
references/interaction-map.md        map of layers, slices, and data flows

## How to Run

Before the first run: the git working tree must be clean (`git status`). At the end of each phase, check `git status`: only files matching `docs/ai/**`, `.agents/skills/**`, and the block in `AGENTS.md` should be modified. The Codex sandbox cannot restrict writes to a subfolder automatically, so this rule is enforced by AGENTS.md and your manual check.

```bash
codex --cd /path/to/project --sandbox workspace-write --ask-for-approval on-request
```

`workspace-write` is required because the agent writes reports. Network access is disabled by default in this mode. Check the flags via `codex --help` for your specific version.

One phase = one session. Starting message for each session:

Read AGENTS.md and docs/ai/audit-plan.md, then execute the phase with the 'next' status using its prompt from docs/ai/prompts/. At the end, update audit-plan.md.

Order: 01 inventory, 02 FSD, 03 Biome, 04 data and mocks, 05 interaction map, 06 synthesis and roadmap. Phases 02 and 03 are independent of each other, but both require results from 01. Phase 05 requires 02 and 04.

## Finding Format

Every finding in the reports must be formatted as follows:


FSD-007: features/cart imports features/auth

• Severity: high | medium | low
• Type: fact | conclusion | UNVERIFIED
• Location: src/features/cart/ui/Cart.tsx:12 (+ N more places)
• Rule: FSD, no imports between slices of the same layer
• Evidence: output of fsd-imports.mjs, cross-slice section
• Recommendation: extract shared logic to entities/... or merge the slices
• Effort: S | M | L

Severity: `high` breaks layers or creates cycles; `medium` violates conventions but doesn't break functionality; `low` is cosmetic.

## How to Use the Final Skill

After Phase 06, the `fe-architecture-map` skill contains everything a new session needs: rules, the map, and conventions. To connect it without relying on AGENTS.md, copy the folder to the location where your version of Codex reads skills (check current documentation: previously `~/.codex/skills`, now usually `.agents/skills` inside the repository). While it remains in the repository, AGENTS.md already references it, and any version will work.

## Updating the Map

The map is tied to a specific commit. When the structure in `src` changes