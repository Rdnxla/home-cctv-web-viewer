# Architecture issues

Found during the 2026-10-24 API/types consolidation (`src/api`). Not fixed — out of that task's scope.

## 1. Camera-domain UI and metadata live in `shared`
- **Where:** `src/shared/ui/cam-status-badge/`, `src/shared/ui/cam-status-icon/`, `src/shared/model/status.ts`.
- **Issue:** `shared/ui` is for domain-independent components; these render camera status and depend on `@/api/cameras/types`.
- **Impact:** `shared` depends on a domain, so it can't be reused as a domain-free layer.
- **Fix:** move them into `entities/camera` (`ui/` and `model/meta.ts`) and export them from its `index.ts`.

## 2. Camera representation split across three entity slices
- **Where:** `src/entities/camera-tile/CameraTile.tsx`, `src/entities/cam-details/CameraDetailsList.tsx` (files at the slice root, no `ui/` segment).
- **Issue:** both are representations of the camera entity. They'd normally be `entities/camera/ui/*`, and slice files belong in segments.
- **Impact:** more public APIs to maintain, and the same entity is spread over three slices.
- **Fix:** move both into `entities/camera/ui/` and re-export them from `entities/camera/index.ts`.

## 3. `pages/auth` has no segments and uses global styles
- **Where:** `src/pages/auth/Auth.tsx`, `src/pages/auth/Auth.scss`.
- **Issue:** the page sits at the slice root (no `ui/`), and its styles are a global stylesheet with non-BEM classes instead of `Auth.module.scss`.
- **Fix:** move to `pages/auth/ui/AuthPage.tsx` with a CSS module.

## 4. Two API folders (owner decision)
- **Where:** `src/api/**` (domain API: requests, hooks, server types) and `src/shared/api/**` (transport: `apiFetch`, `ApiError`, `ApiErrorCode`, `retryUnlessClientError`, `PaginatedResponse`, `SortOrder`).
- **Issue:** after the consolidation, only `src/api/**` calls `apiFetch`, so the transport could move into `src/api` too (for example `src/api/http.ts`). That would leave one API folder.
- **Impact:** low; this is a naming and layout choice.
