# Implementation issues

Found during the 2026-10-24 API/types consolidation (`src/api`). Not fixed — out of that task's scope.

## 1. Unreachable `POST /api/auth/login` mock handler
- **Where:** `src/mocks/handlers/auth.js`, second `http.post(`${BASE_URL}/login`)` (returns 503 `SERVICE_UNAVAILABLE`).
- **Issue:** MSW uses the first matching handler; the first `/login` handler always responds, so the 503 handler never runs.
- **Impact:** the maintenance (503) scenario cannot be triggered from the UI.
- **Fix:** gate it behind a dedicated email (like `error500@example.com`) inside the first handler, or remove it.

## 2. "Осталось попыток: undefined." on invalid credentials
- **Where:** `src/pages/auth/Auth.tsx`, `ApiErrorCode.invalidCredentials` branch.
- **Issue:** `remaining` is `number | undefined`, but the check is `remaining === null`, which is never true.
- **Impact:** if the server omits `attemptsRemaining`, the message ends with `Осталось попыток: undefined.`
- **Fix:** compare with `undefined`.

## 3. `showMessage` receives an `Error` instead of a string
- **Where:** `src/entities/camera/ui/CameraLiveView.tsx` (`retryStream`), `src/pages/dashboard/ui/CameraGrid.tsx` (`retry`): `refetch().catch(e => showMessage(e, 'error'))`.
- **Issue:** `e` is `any`, so TypeScript accepts it; the toast renders `message` as a React child, and an `Error` object there throws.
- **Impact:** latent — TanStack `refetch()` resolves on failure (no `throwOnError`), so `.catch` does not run today. It would crash the toast if it ever did.
- **Fix:** drop the `.catch` (as other retry handlers do with `.catch(() => ({}))`) or pass `e.message`.

## 4. Dormant mock branch in the production WHEP client
- **Where:** `src/api/cameras/useWebRtcPlayer.ts` (`createMockMediaStream`, `__MSW_ACTIVE__` branch).
- **Issue:** nothing sets `__MSW_ACTIVE__`; in DEV the mock video comes from `src/mocks/handlers/mockWhep.ts` through the regular WHEP path.
- **Impact:** dead mock code ships in the production bundle. Kept because of the "do not delete code that appears unused" rule — owner decision.

## 5. Type-check is red on a clean checkout
- **Where:** `src/main.tsx` (`import('./mocks/browser')`), `src/testSetup.ts` (`./mocks/server`).
- **Issue:** `tsc --noEmit -p tsconfig.app.json` fails with TS7016: `src/mocks/{browser,server}.js` have no type declarations.
- **Impact:** `yarn lint:tsc` / `yarn validate` cannot pass.
- **Fix:** convert both files to `.ts` (as the other mock handlers are) or add declaration files.

## 6. `biome-ignore` comments without a rule or reason
- **Where:** `src/TestUtils.tsx` (`// biome-ignore lint: test file` — suppresses every rule), `src/mocks/handlers/mockWhep.ts` (two `noNonNullAssertion` with `<>` as the reason).
- **Issue:** violates the rule that every suppression names one rule and explains why.
- **Fix:** name the specific rule each suppression needs and give a reason, or remove the non-null assertions.

## 7. `vite.config.ts` requires git-ignored TLS certificates
- **Where:** `vite.config.ts` (`server.https` reads `./certs/localhost.pem` and `./certs/localhost-key.pem` with `fs.readFileSync`); `certs` is in `.gitignore`.
- **Issue:** the files are read when the config loads, not only when the dev server starts, so Vitest, `vite build`, and the Playwright `webServer` all crash with `ENOENT` on a clean checkout.
- **Impact:** CI failed before running any test. `.github/workflows/test.yml` now generates a throwaway self-signed certificate as a workaround.
- **Fix:** enable `server.https` only when the cert files exist (or only for `vite serve`), and drop the workflow step.

## 8. Playwright waits for `http://` while the dev server serves `https://`
- **Where:** `playwright.config.ts` (`use.baseURL` and `webServer.url` are `http://localhost:5173`); `vite.config.ts` enables `server.https`.
- **Issue:** Playwright never gets a response on the `http://` URL, so it fails with `Timed out waiting 60000ms from config.webServer`. It starts the web server even when no tests exist, unless the E2E step is skipped.
- **Impact:** no E2E test can run. CI skips the E2E steps until `tests/` contains spec files, so this will surface as soon as the first one is added.
- **Fix:** switch both URLs to `https://localhost:5173` and set `use.ignoreHTTPSErrors: true`. Consider `vite` instead of `yarn dev` (`vite --open`) as the `webServer.command`.
