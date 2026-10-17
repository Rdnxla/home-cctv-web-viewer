# Phase 2: FSD Audit

Precondition: Phase 1 is `done`. Rule source of truth: `.agents/skills/fe-architecture-map/references/fsd-rules.md` (read completely before starting).

## Steps

1. Take `docs/ai/reports/generated/slices.md` and `imports.json` as the source of truth for imports. If they are older than 24 hours or the code has changed, rerun the script.
2. Automated violations: For each type (`layer-upward`, `cross-slice`, `non-public-api`, `deprecated-layer`, cycles, slices without an `index`), group them by slices, assess the severity, and manually spot-check 3-5 cases for false positives (e.g., type imports, dynamic imports, `@x`).
3. Manual checks (invisible to the script), each backed by evidence:
   - `shared` layer content: Check for business logic, domain entities, or knowledge of specific features.
   - The thinness of `pages` (composed of widgets and features, containing no internal business logic) and the role of `widgets` (composition, not logic).
   - Boundaries between `entities` and `features`: Entities function as business models without user scenarios; features function as user-facing scenarios. Identify features that are actually entities, and vice versa.
   - Slice sizing: Overly large slices (candidates for split) and too small/single-file slices.
   - Segment naming: Named by purpose (`ui`, `api`, `model`, `lib`, `config`), not by technical nature (`components`, `hooks`, `types`, `utils`). List of deviations.
   - Dumping grounds: `utils`, `helpers`, `common`, `misc`, `types` at any level.
   - `app` layer: Providers, router, global styles reside here; no business logic.
   - Location of Query hooks and API calls (whether contained within the slice's `api` segment or scattered).
   - Consistency: Is the same concept structured identically across different slices?
   - Public API: Check for excessive `export *` statements exposing internals; ensure only necessary elements are exported.
4. Do not propose the complete target structure until all findings have been fully listed. Then, propose a list of relocations (from → to) as a separate table.

## Output

1. `docs/ai/reports/02-fsd-audit.md`: Summary (3-5 lines, numbers from the script) | Findings formatted according to `docs/ai/README.md` (ID `FSD-NNN`), in descending order of severity | Table of proposed relocations | What the script cannot check and what remains `UNVERIFIED`.
2. If a decision requires the owner's strategic alignment (e.g., an intentional exception to the rules), do not make it yourself: add a question to `audit-plan.md`.
3. Update `docs/ai/audit-plan.md`.