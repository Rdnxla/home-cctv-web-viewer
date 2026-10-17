# FSD Rules (benchmark for audit and development)

Consult the up-to-date documentation at https://feature-sliced.design whenever in doubt (this is the source of truth for the rules). This file defines the criteria used for audits.

## Layers (top to bottom)

`app` > `pages` > `widgets` > `features` > `entities` > `shared`

The `processes` layer is deprecated: flag its presence as an issue and migrate its contents to `pages`, `features`, or `app`.

- `app` and `shared` are not divided into slices; they contain segments directly, and segments may import one another.
- `pages`, `widgets`, `features`, and `entities` are divided into slices (a folder per domain/concept), with segments located inside each slice.

## Import Rules

1. A slice module imports only from layers STRICTLY below it. Importing upwards or into a different slice within the same layer is prohibited.
2. Slices within the same layer are isolated: `features/a` is unaware of `features/b`. Exception: `entities` may reference each other via a special Public API `@x` (e.g., `entities/song/@x/artist.ts`)—and *only* via this mechanism. Frequent coupling indicates incorrect boundaries; consider merging the slices or moving the composition up a layer (`widgets`/`pages`).
3. External imports into a slice must go through its Public API (the root `index`). Deep imports (e.g., `@/features/auth/ui/Form`) violate this rule. Relative imports are permitted within a slice.
4. For `shared`, a Public API at the segment level is recommended (e.g., `shared/ui/index`, `shared/api/index`); deep imports into `shared` are less critical, but consistency is desirable.
5. Circular dependencies between slices are not allowed.

## Segments

Named by purpose rather than technical nature:

| Segment | Contents |
|---|---|
| `ui` | components, styles, display formatting |
| `api` | backend requests, DTOs, mappers, (in our case) query hooks specific to the project's implementation |
| `model` | business logic, state, schemas, domain types |
| `lib` | helper code specific to this slice |
| `config` | constants, flags |

Names to avoid: `components`, `hooks`, `types`, `utils`, `helpers`, `common`, `misc`. These group items by technical nature and tend to turn into dumping grounds. Custom segments are permissible if named according to their purpose.

## Layer Roles

- `shared`: reusable base with no business knowledge (UI kit, HTTP client, utilities, config). No domain logic or references to specific features.
- `entities`: business entities (user, product, order), including their models, UI representations, and API interfaces. No user scenarios.
- `features`: reusable user scenarios that deliver business value (add to cart, log in). Not every action needs to be a feature; if it is used in only one place, keep it in `pages` or `widgets`.
- `widgets`: large, self-contained interface blocks composed of features and entities (header, feed). If a block is needed on only one page, it belongs on that page.
- `pages`: screens/routes; a lightweight composition of widgets and features. Page-specific logic (data, forms) is acceptable, but not reusable business logic.
- `app`: initialization: providers, router, global styles, MSW setup. No business logic.

## Finding Severity Scale

| What | Seriousness |
|---|---|
| Import up through layers, loop between slices | high |
| Import between slices of the same layer (except `@x`) | high |
| Business logic in `shared`, layer `processes` | medium-high |
| Import by Public API; slice without `index` | medium |
| Segments `components/hooks/types/utils`, dumps | medium |
| Too small/large slices, lack of uniformity | low-medium |
| Cosmetics naming | low |

## What the `fsd-imports.mjs` script can and cannot do

Can do: edges between slices, `layer-upward`, `cross-slice`, `non-public-api`, `deprecated-layer`, slices without `index`, loops, third-party layer packages. Doesn't know how to: evaluate the contents of `shared`, boundaries of entities and features, size of slices, names of segments by meaning, dynamic imports with variables, aliases from `vite.config` (reads only `paths` from tsconfig). These are manual phase 2 checks.

For automatic control in CI, you can consider Steiger (the official FSD linter). Installation requires a separate decision from the owner.
