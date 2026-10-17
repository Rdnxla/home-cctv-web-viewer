# Phase 6: Synthesis, Skill, and Roadmap

Precondition: Phases 1 through 5 are `done`.

## Steps

1. **Skill Definition Generation**: Complete `.agents/skills/fe-architecture-map/SKILL.md` using the pre-existing layout template. Condense information to its essence, aiming for a length of under 150 lines. Restrict `SKILL.md` to: project overview and core tech stack (from phase 1), 10-15 foundational architectural rules, path pointers to specific references files accompanied by "when to read" criteria, target commit markers, and the verification routine for validating map accuracy. Detailed evidence belongs in reference files, not inside the core skill.
2. **References Housekeeping**: Review all four documents stored inside the `references/` directory. Purge any non-actionable elements such as diagnostic descriptions or restatements of code findings. The skill assets must strictly specify how the system IS structured and how to PERFORM changes, while raw findings remain isolated within `reports/`.
3. **Traceability Verification**: Ensure every reference markdown file includes its corresponding validation commit hash and update date inside the header. Mark any unreviewed or unvalidated sections explicitly as `UNVERIFIED`.
4. **Actionable Roadmap Assembly**: Author `docs/ai/reports/06-roadmap.md` by consolidating findings from reports 02, 03, and 04 into three prioritized implementation tiers: Quick Wins (S-size, low-risk changes), Medium Steps (M-size changes), and Major Tasks (L-size transformations requiring a dedicated migration plan). For each item specify: the source finding ID, the remediation action, associated migration risks, and validation procedures. Group items by execution sequence and note structural dependencies. Place outstanding decisions requiring stakeholder sign-off in a separate section at the top.
5. **Dry Run Testing**: Simulate 3 routine development assignments against your generated documentation (e.g., "implement user feature X", "find all consumers of entity Y", "register a new API endpoint along with its MSW mock tracking asset"). Verify that a developer using only `SKILL.md` and the reference files—without pre-reading source code—can accurately deduce file placement, import structures, and validation steps. Document the dry run outcome in 3-5 lines inside `audit-plan.md` and address any identified documentation gaps in the skill file.
6. **Workspace State Audit**: Execute `git status` to confirm that modifications are strictly limited to the `docs/ai/**` paths, `.agents/skills/**` assets, and the target configuration block inside `AGENTS.md`.

## Output

`SKILL.md` is populated, `reports/06-roadmap.md` is generated, all audit phases are marked as `done` inside `audit-plan.md`, the session log contains the final outcome summary, and the "Next Step" field reads: "Audit complete. When modifying structural boundaries, execute the map regeneration sequence (detailed in the README 'Map Regeneration' section)".