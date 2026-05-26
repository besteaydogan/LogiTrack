# Final Verification

Verification document date: 2026-05-26

This is the canonical evidence table for the LogiTrack portfolio demo. A check is marked `Passed` only when there is local output, CI output, screenshot evidence, or a documented smoke result. Items that are implemented but not yet captured remain `Evidence pending`.

## Verification Matrix

| Check | Command / URL | Result | Date | Evidence | Notes |
|---|---|---|---|---|---|
| Frontend lint | `pnpm lint` | Passed | 2026-05-26 | Local command output: shell and all four remotes linted successfully | Must lint shell and all remotes |
| Frontend tests | `pnpm test` | Passed | 2026-05-26 | Local command output: 8 test files, 21 tests passed | Current root script runs shell tests |
| Frontend remote tests | Remote-specific component tests | Evidence pending | 2026-05-26 | Additional tests required | Analytics/fleet/delivery/alert remotes need more coverage |
| Frontend build | `pnpm build` | Passed | 2026-05-26 | Local command output: analytics, fleet, delivery, alerts, and shell built successfully | Builds remotes before shell; Vite reports a large analytics chunk warning |
| Backend local Maven | `mvn test package` in `services/backend-api` | Not run locally | 2026-05-26 | No local Maven evidence | Local Maven CLI may be unavailable; CI Maven job is canonical |
| Backend CI Maven job | GitHub Actions backend job | Evidence pending | 2026-05-26 | CI run URL required | Add latest green run link after pushing |
| Frontend CI job | GitHub Actions frontend job | Evidence pending | 2026-05-26 | CI run URL required | `.github/workflows/ci.yml` exists |
| Backend Docker build | `docker compose build backend-api analytics-service` | Passed | 2026-05-26 | Local command output: both images built from cache successfully | Confirms Spring Boot and Streamlit images build |
| Clean full-stack Docker demo | `docker compose down -v`; `docker compose up --build` | Evidence pending | 2026-05-26 | Local command output required | Must verify postgres, backend-api, redpanda, simulator, consumer, analytics-service |
| Current Docker runtime services | `docker compose ps --services --filter status=running` | Passed | 2026-05-26 | Local command output: analytics-service, backend-api, data-simulator, postgres, redpanda, stream-consumer | Existing stack was already running; not a clean reset proof |
| API verifier | `.\scripts\verify-api.ps1` | Passed | 2026-05-26 | Local command output: health, dashboard, deliveries, alerts, vehicles, analytics all HTTP 200 | Should cover health, dashboard, deliveries, alerts, vehicles, analytics |
| Linux/macOS API verifier | `./scripts/verify-api.sh` | Evidence pending | 2026-05-26 | Script output required | Shell verifier exists for non-Windows environments |
| GraphQL no-filter smoke | `POST /graphql` deliveryAnalytics | Passed | 2026-05-26 | Local response: `totalDeliveries=25`, `delayedDeliveries=10`, `averageDelayMinutes=45.1`, `onTimeRate=60.0` | No variables |
| GraphQL region smoke | `POST /graphql` deliveryAnalytics with `region` | Passed | 2026-05-26 | Local response for `Ankara`: `totalDeliveries=6`, `delayedDeliveries=2` | Example region: `Ankara` |
| GraphQL date smoke | `POST /graphql` deliveryAnalytics with `from`/`to` | Passed | 2026-05-26 | Local response for `2026-05-01` to `2026-05-25`: `totalDeliveries=17`, `delayedDeliveries=2` | Example dates: `2026-05-01` to `2026-05-25` |
| GraphQL combined smoke | `POST /graphql` with `from`/`to`/`region` | Passed | 2026-05-26 | Local response for date range + `Ankara`: `totalDeliveries=5`, `delayedDeliveries=1` | Confirms filter composition |
| Historical sample import dry-run | `python scripts/import_historical_data.py --csv data/sample/historical_deliveries_sample.csv --dry-run` | Passed | 2026-05-26 | Local command output: normalized 5 historical deliveries, no writes performed | Proves parser path only |
| Historical 5k+ import | `python scripts/import_historical_data.py --csv data/raw/<kaggle-file>.csv` | Evidence pending | 2026-05-26 | PostgreSQL count required | Required before marking Phase 9 complete |
| Data quality script | `python scripts/check_data_quality.py` | Blocked locally | 2026-05-26 | Local output: missing `psycopg` dependency | Install `psycopg[binary]` locally or run from a Python env with requirements installed |
| Data quality SQL spot check | PostgreSQL SQL checks through `docker compose exec -T postgres psql ...` | Passed | 2026-05-26 | Local output: 25 deliveries, 0 duplicate tracking groups, 0 missing regions, 0 invalid statuses, 0 negative delays, 0 invalid coordinates | Does not replace the script evidence for final Phase 9 |
| Streamlit build | `docker compose build analytics-service` | Passed | 2026-05-26 | Local command output: image built successfully | Confirms service image |
| Streamlit smoke | `http://localhost:8501` | Passed | 2026-05-26 | Local HTTP result: 200 OK | Screenshots still required |
| Shell dashboard route | `http://localhost:5173/dashboard` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Shell deliveries route | `http://localhost:5173/deliveries` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Shell alerts route | `http://localhost:5173/alerts` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Shell analytics route | `http://localhost:5173/analytics` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Shell fleet route | `http://localhost:5173/fleet` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Vehicle detail route | `http://localhost:5173/fleet/vehicles/VHL-001` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Uses `GET /api/vehicles/{id}` at runtime; screenshot still required |
| Analytics standalone remote | `http://localhost:5174` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Fleet standalone remote | `http://localhost:5175` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Delivery standalone remote | `http://localhost:5176` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Alerts standalone remote | `http://localhost:5177` | Passed | 2026-05-26 | Preview HTTP smoke: 200 OK | Screenshot still required |
| Remote entry files | `http://localhost:5174-5177/assets/remoteEntry.js` | Passed | 2026-05-26 | Preview HTTP smoke: all four remote entries returned 200 OK | Local files also exist after `pnpm build` |
| Remote fallback behavior | Stop one remote and open shell route | Evidence pending | 2026-05-26 | Manual browser note required | Shell must not crash |
| Fleet live vehicle SSE | `curl.exe -N --max-time 6 -H "Accept: text/event-stream" http://localhost:8080/api/live/vehicles` | Passed | 2026-05-26 | Local output: stream returned vehicle snapshot events with 8 vehicles | Curl exits with timeout because SSE streams stay open by design |
| Fleet live marker update | Simulator -> consumer -> PostgreSQL -> `/api/live/vehicles` -> marker move | Evidence pending | 2026-05-26 | Browser marker movement proof required | SSE payload is verified; visual marker movement still needs screenshot/manual proof |
| Marker throttling | 50+ vehicle events / profiler smoke | Evidence pending | 2026-05-26 | Profiler or test output required | `markerUpdateBuffer.ts` exists |
| Dashboard profiler | React DevTools Profiler | Evidence pending | 2026-05-26 | Capture required | Initial render and SSE update |
| Alerts profiler | React DevTools Profiler | Evidence pending | 2026-05-26 | Capture required | Severity filter |
| Analytics profiler | React DevTools Profiler | Evidence pending | 2026-05-26 | Capture required | Region/date filters |
| Fleet profiler | React DevTools Profiler | Evidence pending | 2026-05-26 | Capture required | Marker update |
| Screenshot package | `docs/screenshots/*.png` | Evidence pending | 2026-05-26 | PNG files required | See screenshot checklist below |

## Required Screenshot Files

Store final screenshots under `docs/screenshots/`:

- `dashboard.png`
- `deliveries.png`
- `alerts.png`
- `analytics.png`
- `fleet-map.png`
- `fleet-selected-vehicle.png`
- `vehicle-detail.png`
- `streamlit-data-quality.png`
- `streamlit-analytics.png`
- `shell-analytics-remote.png`
- `shell-fleet-remote.png`

## Full Demo Runbook

1. Reset and start the backend stack:

   ```bash
   docker compose down -v
   docker compose up --build
   ```

2. Install and run frontend apps:

   ```bash
   pnpm install
   pnpm dev
   ```

3. Verify REST endpoints:

   ```powershell
   .\scripts\verify-api.ps1
   ```

4. If a Kaggle raw CSV is available locally, import it:

   ```bash
   python scripts/import_historical_data.py --csv data/raw/<kaggle-file>.csv
   python scripts/check_data_quality.py
   ```

5. Verify GraphQL:

   ```bash
   curl -X POST http://localhost:8080/graphql ^
     -H "Content-Type: application/json" ^
     -d "{\"query\":\"query { deliveryAnalytics { summary { totalDeliveries delayedDeliveries averageDelayMinutes onTimeRate } } }\"}"
   ```

6. Verify routes:

   - `http://localhost:5173/dashboard`
   - `http://localhost:5173/deliveries`
   - `http://localhost:5173/alerts`
   - `http://localhost:5173/analytics`
   - `http://localhost:5173/fleet`
   - `http://localhost:5173/fleet/vehicles/<vehicle-id>`
   - `http://localhost:5174`
   - `http://localhost:5175`
   - `http://localhost:5176`
   - `http://localhost:5177`
   - `http://localhost:8501`

## Completion Rule

The project should only be called fully portfolio-ready after these are all true:

- Frontend lint/test/build pass.
- Backend CI Maven job is green.
- Clean Docker demo starts.
- API verifier passes.
- GraphQL smoke checks pass.
- Screenshots are committed under `docs/screenshots/`.
- React Profiler values are recorded.
- Either 5k+ Kaggle import is verified, or README clearly says large dataset verification is pending.
