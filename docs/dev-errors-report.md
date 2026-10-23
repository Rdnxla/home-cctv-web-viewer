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
