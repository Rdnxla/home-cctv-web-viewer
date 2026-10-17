# Data Layer: TanStack Query and MSW

> TEMPLATE. Populated during phase 4 (`docs/ai/prompts/04-data-and-mocks.md`). Commit and date: `<not filled in>`

## Versions and Configuration

- @tanstack/react-query: `?` (v4 and v5 differ: `cacheTime`/`gcTime`, `isLoading`/`isPending`)
- msw: `?` (v1: `rest`; v2: `http`/`HttpResponse`)
- QueryClient: creation location `?`; defaultOptions `?`
- MSW startup: browser `?` (startup condition `?`), node/tests `?`, worker `public/mockServiceWorker.js` `?`

## Query Keys and Hooks

- Query key strategy: `?` (factory / literals); example file `?`
- Locations of hooks and API functions: `?`

## Queries and Mutations

| Hook | File | queryKey | API function | Method and path | Consumers |
|---|---|---|---|---|---|
| ? | ? | ? | ? | ? | ? |

| Mutation | File | What it invalidates | Error handling |
|---|---|---|---|
| ? | ? | ? | ? |

## MSW Mocks

| Method and path | Handler | Fixture/factory | API function | Hook |
|---|---|---|---|---|
| ? | ? | ? | ? | ? |

- Handler organization and aggregator: `?`
- Fixtures: `?`
- Scenario overrides (errors, delays): `?`
- `onUnhandledRequest`: `?`

## Recipes

1. How to add a new query + mock: `<steps with example paths>`
2. How to add a mutation with invalidation: `?`
3. How to override a handler in a test: `?`
4. How to switch to the real backend: `?`

## Known Issues

`?` (facts only, without restating the report; the full list is in `docs/ai/reports/04-data-and-mocks.md`)