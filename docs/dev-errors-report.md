# Developer: implementation issues

## 2026-10-23 — event log (`pages/event-list`)

### Fixed: pagination was cut off below the table
- **Where:** `src/pages/event-list/ui/EventList.module.scss` (`.eventList`).
- **Issue:** the section had `min-height: calc(100% - $header-h)` and `overflow: hidden`, and nothing limited the table's height. With a long page (25+ rows), the table pushed `EventListFooter` (page-size select and `Pagination`) past the bottom of the section, where it was clipped and could not be reached.
- **Fix:** the section is now a flex column with `flex: 1; min-height: 0`. The table takes the remaining height and scrolls its rows inside Radix `Table.Root`'s ScrollArea, with a sticky header. The footer always stays visible.

### Open: `.page` min-height ignores the layout padding
- **Where:** `src/app/global.scss` (`.page`) and `src/assets/scss/variables.scss` (`$page-min-h`).
- **Issue:** `calc(100% - $header-h)` leaves out the 2×16px padding and 4px gap of `MainLayout`. A page that uses it ends up about 36px taller than the space under the header, so the document scrolls slightly, and with `overflow: hidden` the bottom of the content can be clipped.
- **Impact:** extra page scroll or clipped content on dashboard, camera detail and archive. `flex: 1; min-height: 0` on the page (as done for the event log) avoids the arithmetic.

### Open: `EventList.tsx` imports
- **Where:** `src/pages/event-list/ui/EventList.tsx:3-6`.
- **Issue:** Biome `assist/source/organizeImports` reports the imports as unsorted. `useCalloutMessage` is imported from the deep path `@/shared/ui/callout/CalloutMessage`, not from the `@/shared/ui` public API (which doesn't export it yet).
- **Impact:** `biome check` fails for the file, and the shared/ui public API is bypassed.

### Open: `EventFilters.tsx` uses the legacy camera query
- **Where:** `src/pages/event-list/ui/EventFilters.tsx:4`.
- **Issue:** `useCamerasQuery` is imported from `@/api/cameras/cameraQueries`. Per the project rules, the camera list query must come from `@/entities/camera`.
- **Impact:** a second query implementation and possibly a separate cache entry for the same data.

### Open: table scroll position is kept when the page changes
- **Where:** `src/pages/event-list/ui/EventTable.tsx`.
- **Issue:** the rows now scroll inside the table. If you scroll to the bottom and then switch to another page, sort order or filter, the new rows also open at the bottom.
- **Impact:** minor UX issue. Possible fix: scroll the table's viewport (`[data-radix-scroll-area-viewport]`) back to the top when the page changes.

## 2026-10-23 — header (`widgets/the-header`)

### Open: `NvrInfo` is declared twice
- **Where:** `src/entities/nvr/model/types.ts` (new, used by the header) and `src/mocks/data/nvrtypes.ts` (used by the `GET /api/nvr` mock).
- **Issue:** the header needed the NVR name, and there was no client for `GET /api/nvr`. The domain type was added to `entities/nvr` because production code must not import `@/mocks/**`. The mock still uses its own copy.
- **Impact:** the two types can drift apart. Per the mocks boundary rule, `mocks/data/nvr.ts` should import `NvrInfo` from `@/entities/nvr` and the copy in `nvrtypes.ts` should be removed.

### Open: `the-header` slice has no `ui/` segment
- **Where:** `src/widgets/the-header/` (`TheHeader.tsx`, `DeviceInfo.tsx` and their styles sit at the slice root).
- **Issue:** the other widgets keep components in `ui/`. The files were left in place because the shell was unavailable for a move during this change. The slice now has an `index.ts`, so only that file needs updating after the move.
- **Impact:** inconsistent slice structure; nothing breaks.

### Open: CLAUDE.md lists camera queries in the wrong place
- **Where:** `CLAUDE.md`, rule 6, and the "Data flow" section.
- **Issue:** these say `cameraKeys`, `useCamerasQuery`, `useCameraQuery`, etc. are exported from `@/entities/camera`. They actually live in `src/api/cameras/cameraQueries.ts`, and `entities/camera/index.ts` doesn't export them.
- **Impact:** following the rule literally fails to compile. Either the migration to `entities/camera/api` still needs doing, or the docs are ahead of the code.
