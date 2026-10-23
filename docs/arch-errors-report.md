# Architecture issues

## 2026-10-22: archive page refactor (`src/pages/archive`)

### 1. The 300-line file limit conflicts with "one component per role" on the archive page

- **Where:** `src/pages/archive/ui/archive-viewer/ArchiveViewer.tsx` (≈610 lines); `biome.json` (`"nursery": "error"` turns on `noExcessiveLinesPerFile`, default 300).
- **Issue:** the owner asked for the archive viewer to be a single component (player, playback controls, bookmark form, timeline, day summary). Its markup alone is about twice the limit. The file therefore starts with `// biome-ignore-all lint/nursery/noExcessiveLinesPerFile` plus a reason. The removed `ui/Timeline.tsx` (372 lines) already broke the rule before the refactor.
- **Impact:** the rule is switched off for the largest file in the slice. `ui/ArchivePage.tsx` is just under the limit, so most additions there will trip it.
- **Options:** keep the documented exception; raise `maxLines` for page UI in `biome.json`; or allow the viewer to be split into two or three large parts inside `ui/archive-viewer/`.

### 2. CLAUDE.md describes an archive structure that does not exist

- **Where:** `CLAUDE.md`: "FSD structure", "Video", Core rule 7.
- **Issue:** CLAUDE.md lists `widgets/archive-player`, `widgets/archive-timeline`, `widgets/archive-sidebar`, `features/archive-playback`, `features/add-bookmark` and `features/delete-bookmark`. None of them exist. The whole archive lives in `pages/archive`: `ui/ArchivePage.tsx`, `ui/archive-viewer/`, `ui/archive-sidebar/`, `model/` and `lib/time.ts`. Rule 7 ("split UI by role into entities/features/widgets, even with one consumer") also contradicts the owner's direction for this page: a few large components, each with its own hooks in its own folder.
- **Impact:** agents following CLAUDE.md will look for slices that don't exist or re-split the page.

### 3. `useBookmarksQuery` cannot be disabled

- **Where:** `src/entities/bookmark/api/bookmarkQueries.ts`, `useBookmarksQuery(cameraId: string)`.
- **Issue:** unlike `useRecordingsQuery` and `useEventsInRangeQuery`, it does not accept `null` with `skipToken` (the Core rule 6 convention). The page therefore can't request bookmarks before the camera is resolved.
- **Impact:** archive data fetching is split. The page (`model/useArchivePage.ts`) loads cameras and recordings; the viewer (`ui/archive-viewer/useArchiveViewer.ts`) loads events and bookmarks.

### 4. Camera queries come from the legacy `@/api/cameras/cameraQueries`

- **Where:** `src/pages/archive/model/useArchivePage.ts` (`useCamerasQuery`), `src/pages/archive/ui/archive-viewer/usePlayback.ts` (`useCameraPlaybackQuery`).
- **Issue:** Core rule 6 says to import these from `@/entities/camera`, but that index does not export them.
- **Impact:** the docs and the code disagree, and these imports will need updating when the hooks move into `entities/camera/api`.
