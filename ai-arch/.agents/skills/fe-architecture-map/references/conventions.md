# Code Conventions

> TEMPLATE. Populated during phase 3 (`docs/ai/prompts/03-biome-audit.md`). Commit and date: `<not filled in>`

Principle: A convention is considered established when at least 80% of the code follows it. For each item, record the adoption rate and an example file. If there is no consistent style, write "no consistent style" and record the owner's decision, if any.

## Biome

- Version: `?`
- Configuration file: `?`
- Check commands: `<pm> exec biome check .` (do not use `--write` during an audit; during development, `--write` is allowed only at the user's explicit request)
- Formatter: indentation `?`, line width `?`, quotes `?`, semicolons `?`, trailing commas `?`
- Linter: `recommended` `?`; disabled rules (with reasons, if known): `?`; modified rule levels: `?`
- Imports: sorting (`organizeImports`/`assist`) `?`
- Ignored paths / overrides: `?`
- Status: does `check` pass? Number of diagnostics and top rules: `?`

## Naming

| Item | Convention | Adoption | Example |
|---|---|---|---|
| Component files | ? | ? | ? |
| Hook, utility, and type files | ? | ? | ? |
| Tests | ? | ? | ? |
| Directories | ? | ? | ? |
| Hooks (`useX`) | ? | ? | ? |
| Query keys and query hooks | ? | ? | ? |

## Code

| Item | Convention | Adoption | Example |
|---|---|---|---|
| Exports (named / default) | ? | ? | ? |
| Component declarations | ? | ? | ? |
| Props typing | ? | ? | ? |
| Type locations | ? | ? | ? |
| Imports (aliases / relative paths, `import type`) | ? | ? | ? |
| Barrel files (`index`) | ? | ? | ? |
| Styling | ? | ? | ? |

## Before completing any task

1. `<pm> exec biome check <affected files>`
2. `<pm> exec tsc --noEmit`
3. For any new or moved file, verify that imports comply with `fsd-rules.md`.