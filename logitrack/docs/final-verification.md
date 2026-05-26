# Final Verification

Verification date: 2026-05-25

This document is the Phase 14 runbook and evidence table for the portfolio demo.

## Local Verification Results

| Gate | Command / Evidence | Status | Notes |
|---|---|---|---|
| Frontend lint | `pnpm lint` | Passed | Shell and all remotes linted |
| Frontend tests | `pnpm test` | Passed | 8 test files, 21 tests |
| Frontend production build | `pnpm build` | Passed | Plotly creates a large analytics chunk; tracked under Phase 13 performance notes |
| Historical import parser | `python scripts/import_historical_data.py --csv data/sample/historical_deliveries_sample.csv --dry-run` | Passed | 5 sample rows normalized |
| Backend local Maven | `mvn test package` | Not run locally | Maven CLI is not installed in the local environment; CI is the canonical Maven gate |
| Backend Docker build | `docker compose build backend-api analytics-service` | Passed | Spring GraphQL schema loaded and Streamlit image built |
| GitHub Actions | `.github/workflows/ci.yml` | Requires GitHub run evidence | Verify green jobs after pushing latest commit |
| Runtime smoke | `docker compose up -d postgres backend-api analytics-service` | Passed | Services started; existing redpanda/simulator/consumer were already running locally |
| API smoke | `scripts/verify-api.ps1` | Passed | Health, dashboard, deliveries, alerts, vehicles, analytics |
| GraphQL smoke | `POST /graphql` deliveryAnalytics query | Passed | Returned summary and delay trend data |
| Streamlit smoke | `Invoke-WebRequest http://localhost:8501` | Passed | HTTP 200 |
| Browser route smoke | Shell and standalone remotes | Requires browser capture | Capture screenshots listed below |

## Full Demo Runbook

1. Reset and start the stack:

   ```bash
   docker compose down -v
   docker compose up --build
   ```

2. Import historical dataset after downloading Kaggle CSV into `data/raw/`:

   ```bash
   python scripts/import_historical_data.py --csv data/raw/<kaggle-file>.csv
   python scripts/check_data_quality.py
   ```

3. Start frontend apps:

   ```bash
   pnpm dev
   ```

4. Verify API:

   ```powershell
   .\scripts\verify-api.ps1
   ```

5. Verify routes:

   - `http://localhost:5173/`
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

## Functional Proof Checklist

| Area | Acceptance proof |
|---|---|
| Historical dataset | At least 5,000 delivery rows imported without duplicates |
| Analytics | GraphQL analytics query returns imported data; Plotly trend and D3 heatmap render |
| Fleet map | Markers come from `/api/vehicles`, status markers and legend are visible, selected panel opens |
| Fleet live | `vehicle.location.updated` reaches PostgreSQL through consumer and `/api/live/vehicles` moves marker snapshots |
| Vehicle detail | `/fleet/vehicles/:id` loads `GET /api/vehicles/{id}` data |
| Streamlit | `analytics-service` starts on port `8501` and queries PostgreSQL |
| Performance | Virtualized tables are enabled for high-volume tables; React Profiler captures are recorded |
| CI/CD | Latest GitHub Actions frontend and backend jobs are green |

## Required Screenshots

Store final screenshots under `docs/screenshots/`:

- Dashboard overview
- Deliveries virtualized table
- Alerts resolve flow
- Advanced Analytics with Plotly trend
- D3 region heatmap
- Route efficiency dashboard
- Fleet Map with status legend
- Fleet selected vehicle panel
- Vehicle Detail
- Streamlit analytics-service
- Shell route loading remote apps

## CV-Ready Bullets

- Built a LogiTrack Control Tower with React, TypeScript, Vite Module Federation, Spring Boot, PostgreSQL, Redpanda, Python simulator/consumer services, SSE, GraphQL, Plotly, D3, Streamlit, and Docker Compose.
- Implemented Kaggle historical CSV import, idempotent PostgreSQL loading, data quality checks, REST and GraphQL analytics, route efficiency scoring, and high-volume table virtualization.
- Delivered a Fleet Map with React Leaflet, status-based markers, selected vehicle panel, API-backed vehicle detail routing, live vehicle snapshot SSE, and throttled marker updates.
- Added CI, API verification scripts, architecture/data/micro-frontend docs, and a reproducible local full-stack demo runbook.
