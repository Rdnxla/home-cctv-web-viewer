# Phase 4: Data Layer (TanStack Query) and Mocks (MSW)

Precondition: Phase 1 is `done`. (Library versions are identified: rely on them, since API v4/v5 and MSW v1/v2 differ significantly).

## Steps: TanStack Query

1. **QueryClient Configuration**: Analyze `defaultOptions` (`staleTime`, `gcTime`/`cacheTime`, `retry`, `refetchOn*`), determine where the client is instantiated, identify where the provider is mounted, and check for devtools integration.
2. **Queries and Mutations Inventory**: Compile a structured table with the columns: `hook name | file | queryKey | query function (file) | endpoint | consumers (slices)`. Locate consumers via `rg` rather than using memory.
3. **Query Keys Strategy**: Determine whether a single query key factory is utilized or if literal keys are declared inline. Evaluate consistency, risk of collisions, and the nesting hierarchy used for query invalidation.
4. **Advanced Query Features**: Evaluate the adoption of `queryOptions`, data selectors (`select`), initial state management (`placeholderData`/`keepPreviousData`), conditional fetching (`enabled`), suspense mode, data prefetching (inside the router/loaders), and optimistic updates.
5. **Mutations Lifecycle**: Create a table with the columns: `mutation | target for invalidation/update | error handling location`. Pinpoint mutations that do not trigger cache invalidation.
6. **Code Location**: Identify the specific segments and layers hosting hooks and API functions. Verify compliance with FSD guidelines (cross-reference with findings from phase 2 without duplicating descriptions).
7. **Error and Loading States**: Check whether error handling and loading indicators follow a single unified strategy or are implemented in an ad-hoc manner.
8. **Redundancy & Duplication**: Identify identical queries using mismatched keys and separate hooks pointing to the exact same endpoint.

## Steps: MSW

1. **Version and API Mapping**: Establish the current version syntax (`http`/`HttpResponse` for v2, `rest` for v1). Identify bootstrap files: browser worker (where and when it boots: dev-only, via env flags), node server for tests, and the path to `public/mockServiceWorker.js`.
2. **Handlers Organization**: Locate handler definitions, trace their grouping strategy (by entities, by features), and find the main handler aggregator entry point.
3. **Route Coverage Table**: Build a mapping table with the columns: `method + path | handler (file) | fixture/factory | query function (file) | hook`. Specifically track down: endpoints actively called but lacking mock coverage; handlers without active consumers; mismatches between fixture data structures and network response types.
4. **Fixtures Quality**: Determine if fixtures are static json files or dynamic factories. Review shared mock data locations relative to FSD boundaries (mocks must not reside in the `shared` layer alongside production business logic).
5. **Mocking Scenarios**: Check how handlers are dynamically overridden (`server.use`, error state replication, artificially injected network delays, pagination, authorization flows), and trace if any mock state exists (such as an in-memory database).
6. **Unhandled Network Traffic**: Identify the configured `onUnhandledRequest` policy. Analyze how MSW is integrated into the testing suites.
7. **Environment Swapping**: Outline the specific steps and configurations required to switch to a live production backend (including updates to `baseURL`, environment variables, authentication mechanisms, and payload shapes).

## Output

1. `docs/ai/reports/04-data-and-mocks.md`: Summary | Step-by-step mapping tables | Issues cataloged as `DATA-NNN` | Remaining `UNVERIFIED` items.
2. `.agents/skills/fe-architecture-map/references/data-layer.md`: Populate according to the template (including compressed query/handler tables + step-by-step instructions on "how to implement a new query and its corresponding mock").
3. Update `docs/ai/audit-plan.md`.