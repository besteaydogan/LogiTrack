# Phase 9-14 Official Backlog

This document is the official implementation backlog for the remaining LogiTrack Control Tower work. These items are not future-work placeholders; they are planned project phases that must be completed in order.

## Overall Priority Order

1. Phase 9 — Historical Dataset Integration
2. Phase 10 — Advanced Fleet Map Completion
3. Phase 11 — Advanced Analytics Upgrade
4. Phase 12 — Internal Analytics Service
5. Phase 13 — Large Dataset Performance
6. Phase 14 — Final CI/CD, Documentation & Demo Proof

## Dataset Decision

Primary dataset:

- Kaggle: Logistics Operations Database
- URL: `https://www.kaggle.com/datasets/yogape/logistics-operations-database`
- Reason: multi-table CSV structure maps naturally to deliveries, drivers, vehicles, operations, performance, maintenance, and historical analytics.

Fallback dataset:

- Kaggle: Logistics Operations & Risk Dataset
- URL: `https://www.kaggle.com/datasets/programmer3/logistics-operations-and-risk-dataset`
- Reason: smaller analytics-friendly dataset with ETA variation, delivery deviation, fuel, traffic, fatigue, status, and risk columns.

## Phase 9 — Historical Dataset Integration

### Purpose

Import a Kaggle historical logistics dataset into PostgreSQL while preserving the existing seed + simulator demo path. Analytics must run on imported historical data.

### Technical Work

- Document dataset selection, source, license/access notes, file list, and selected columns.
- Create `data/raw`, `data/processed`, and `data/sample`.
- Define Kaggle CSV to LogiTrack entity mapping.
- Implement idempotent Python import script.
- Import historical deliveries, drivers, vehicles, warehouses/regions, delivery events, and alerts where available.
- Add data quality checks for nulls, duplicates, date ranges, enum values, foreign keys, and status distribution.
- Update data lineage from Kaggle CSV to processed CSV to PostgreSQL to API to Analytics.
- Verify Analytics with imported historical records.

### File/Directory Changes

- `docs/dataset-selection.md`
- `docs/data-quality.md`
- `docs/data-lineage.md`
- `data/raw/.gitkeep`
- `data/processed/.gitkeep`
- `data/sample/`
- `scripts/import_historical_data.py`
- `scripts/check_data_quality.py`
- Optional migration for import metadata if needed.

### Test and Verification

- Run import script in dry-run mode.
- Run import script against PostgreSQL.
- Run data quality script and confirm zero critical errors.
- Verify `/api/analytics/summary` with no filters.
- Verify `/api/analytics/summary?region=...`.
- Verify `/api/analytics/summary?from=...&to=...`.
- Confirm driver and vehicle performance tables use imported records.

### Acceptance Criteria

- At least 5,000 historical delivery records are imported.
- Import is repeatable without duplicate records.
- Analytics shows imported data instead of only seed records.
- Dataset selection and lineage are linked from README.

## Phase 10 — Advanced Fleet Map Completion

### Purpose

Complete Fleet Map as a real operations map with status-based markers, live vehicle updates, throttled marker movement, selected vehicle panel, detail integration, tests, and proof.

### Technical Work

- Add backend live vehicle location SSE endpoint: `GET /api/live/vehicles`.
- Stream current vehicle snapshots or latest location events to frontend.
- Add shared vehicle live event types.
- Add API client helper for vehicle live subscription.
- Add status-based marker classes and marker legend.
- Keep selected vehicle side panel and Vehicle Detail route integrated.
- Add throttled marker update buffer with a default 1000 ms flush interval.
- Update Fleet Map from SSE while preserving REST fallback.
- Add Fleet Map tests and screenshots.

### File/Directory Changes

- Backend live controller/service changes under `services/backend-api`.
- `packages/types/src/index.ts`
- `packages/api-client/src/live.ts`
- `apps/fleet-dashboard/src/FleetDashboardPage.tsx`
- `apps/fleet-dashboard/src/markerUpdateBuffer.ts`
- `apps/fleet-dashboard/src/*.test.tsx`
- `docs/screenshots/fleet-map.png`
- `docs/screenshots/vehicle-detail.png`

### Test and Verification

- Backend test for `GET /api/live/vehicles`.
- Unit test for marker status mapping.
- Unit test for marker update throttling.
- Interaction test for selected vehicle panel.
- Shell route smoke for `/fleet` and `/fleet/vehicles/:id`.
- Simulator event to stream-consumer to PostgreSQL to SSE to marker movement smoke.

### Acceptance Criteria

- Markers come from real `/api/vehicles` data.
- Markers are visually separated by status and a legend is visible.
- Marker click opens selected vehicle panel.
- Vehicle Detail uses real `/api/vehicles/{id}` API data.
- `vehicle.location.updated` events move markers without page refresh.
- Marker updates are throttled and covered by tests.
- Loading, error, and empty states remain intact.

## Phase 11 — Advanced Analytics Upgrade

### Purpose

Upgrade Analytics from REST-only charts to GraphQL-backed advanced analytics with Plotly trend visualization, D3 heatmap, and route efficiency dashboard.

### Technical Work

- Add Spring GraphQL dependency and schema.
- Add GraphQL resolver for `deliveryAnalytics`, `regionHeatmap`, and `routeEfficiency`.
- Add frontend GraphQL client in Analytics remote.
- Add Plotly delay trend chart.
- Add D3 region heatmap with tooltip.
- Add route efficiency metrics: planned duration, actual duration, delay minutes, efficiency score.
- Add route efficiency KPI and table.
- Update API contract and README.

### File/Directory Changes

- `services/backend-api/pom.xml`
- GraphQL schema under backend resources.
- Backend analytics DTOs/resolvers/services/tests.
- `packages/types/src/index.ts`
- `packages/api-client/src/`
- `apps/analytics/src/`
- `docs/api-contract.md`
- `docs/screenshots/advanced-analytics.png`

### Test and Verification

- GraphQL resolver tests.
- Frontend GraphQL client tests.
- Plotly chart render smoke.
- D3 heatmap render and tooltip test.
- Route efficiency calculation test.
- Screenshot verification for advanced analytics.

### Acceptance Criteria

- GraphQL endpoint is live and documented.
- Analytics consumes at least one GraphQL query.
- Plotly and D3 visualizations render imported data.
- Route efficiency metrics are filter-aware.
- README and CV can honestly mention GraphQL, Plotly, and D3.

## Phase 12 — Internal Analytics Service

### Purpose

Add a separate Streamlit analytics service that reads PostgreSQL and presents internal data quality and operations analytics.

### Technical Work

- Scaffold Streamlit service.
- Connect to PostgreSQL through `DATABASE_URL`.
- Add data quality overview.
- Add delay distribution.
- Add region breakdown.
- Add driver rankings.
- Add vehicle rankings.
- Add Dockerfile and Docker Compose service.
- Document service usage.

### File/Directory Changes

- `services/analytics-service/app.py`
- `services/analytics-service/requirements.txt`
- `services/analytics-service/Dockerfile`
- `docker-compose.yml`
- `.env.example`
- `docs/screenshots/internal-analytics-service.png`
- README service instructions.

### Test and Verification

- `docker compose up --build analytics-service`.
- Open `http://localhost:8501`.
- Confirm service queries PostgreSQL, not static mock data.
- Confirm empty database state has readable fallback.

### Acceptance Criteria

- Analytics service starts from Docker Compose.
- At least five panels are visible.
- Panels use real PostgreSQL data.
- README documents port, environment variables, and purpose.

## Phase 13 — Large Dataset Performance

### Purpose

Improve frontend and backend performance after large historical data import.

### Technical Work

- Add table virtualization with `@tanstack/react-virtual` for high-volume deliveries and analytics tables.
- Harden backend pagination, page size limits, filters, and stable sorting.
- Add backend-side chart aggregation for large datasets.
- Add large dataset test/import profile.
- Record React Profiler before/after measurements.
- Update README performance notes.

### File/Directory Changes

- Delivery and analytics table components.
- Backend repository/service pagination and aggregation queries.
- Tests for filters, pagination, aggregation, and virtualized tables.
- README Performance Notes.
- Optional large dataset sample under `data/sample`.

### Test and Verification

- 10k+ delivery dataset table scroll smoke.
- Backend filter/pagination tests.
- Analytics aggregation tests.
- React Profiler measurements for Dashboard, Deliveries, Alerts, Analytics, and Fleet.

### Acceptance Criteria

- Large table scroll remains usable.
- API list endpoints return bounded responses.
- Charts do not render huge raw arrays.
- README includes before/after profiler notes with real values.

## Phase 14 — Final CI/CD, Documentation & Demo Proof

### Purpose

Produce final portfolio proof: green CI, reproducible full-stack demo, route verification, screenshots, diagrams, final verification document, and CV-ready bullets.

### Technical Work

- Verify GitHub Actions green on latest commit.
- Run full-stack Docker demo.
- Verify shell and all remotes.
- Capture screenshots.
- Add final architecture, data pipeline, and micro-frontend diagrams.
- Create final verification runbook.
- Update README and CV bullets.

### File/Directory Changes

- `docs/final-verification.md`
- `docs/screenshots/`
- `docs/architecture.md`
- `docs/data-lineage.md`
- `docs/micro-frontend.md`
- README final sections.

### Test and Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- backend Maven tests through CI
- `docker compose down -v`
- `docker compose up --build`
- `scripts/verify-api.ps1`
- Browser smoke for each shell route and standalone remote.
- GitHub Actions frontend/backend jobs green.

### Acceptance Criteria

- CI green evidence exists.
- Full-stack Docker demo is documented and reproducible.
- README includes screenshots and diagrams.
- `docs/final-verification.md` includes a dated checklist.
- CV bullets mention only implemented technologies.
