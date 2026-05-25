# LogiTrack Control Tower

LogiTrack Control Tower is a frontend-focused portfolio project for monitoring logistics operations in near real time. The product goal is to show how a control tower can track delivery status, active alerts, fleet activity, and operational KPIs from a single dashboard.

The project is intentionally planned in phases. Phase 1 keeps the scope light and decision-oriented so Phase 2 can start with a clear frontend direction instead of getting blocked by backend, Kafka, or infrastructure work.

## Target Role

This project is designed to demonstrate skills expected from a Frontend Developer working with:

- React
- TypeScript
- Real-time data flows
- Data visualization
- Dashboard UX
- API integration
- Performance-aware UI development

## Product Goal

LogiTrack helps an operations team answer questions such as:

- How many deliveries are active, delayed, or completed?
- Which deliveries need attention now?
- Which alerts are unresolved?
- Which vehicles or regions are becoming risky?
- What operational data should be visible before deeper analytics are added?

## Success Criteria

The project is considered successful when it can clearly demonstrate a working logistics operations dashboard with realistic data shapes and a phased path toward real-time infrastructure.

Phase 1 success criteria:

- Project purpose, target role, and MVP scope are documented.
- Dataset strategy is documented in `docs/dataset-plan.md`.
- High-level architecture and core entities are documented in `docs/architecture.md`.
- Initial frontend-facing API contract is documented in `docs/api-contract.md`.
- Phase 2 can start without needing backend, Kafka, database, or Docker implementation.

Overall portfolio success criteria:

- Dashboard Overview, Delivery Tracking, and Alert Center work with typed data.
- Real-time behavior can be demonstrated through SSE or WebSocket-style events.
- Later phases can add Fleet Map, Analytics, PostgreSQL, Kafka, and backend APIs without changing the initial product direction.
- README and docs explain the project clearly enough for CV or interview review.

## MVP Screen Order

The product will be built from the most useful operational screens first.

1. Dashboard Overview
2. Delivery Tracking
3. Alert Center
4. Fleet Map
5. Analytics

Phase 2 will focus on the first three screens:

- Dashboard Overview
- Delivery Tracking
- Alert Center

Fleet Map and Analytics are second-wave features. They are important for the final portfolio value, but they should not slow down the first working dashboard.

## Phase Strategy

### Current Project Status

As of the latest audit, Phase 1 through Phase 5 are treated as completed: planning docs, frontend foundation, PostgreSQL/Spring Boot REST foundation, Redpanda-backed realtime pipeline, live dashboard/alerts, and analytics are implemented.

Phase 6 is partially completed. Frontend build and tests pass, route-level lazy loading, chart data windowing, coalesced SSE updates, focused frontend tests, frontend API client tests, and Docker-backed backend/API verification are in place. Manual React DevTools performance measurement remains open. Phase 7 runtime micro-frontend work is in progress with shell-hosted routing and standalone remotes for analytics, fleet, delivery management, and alert center.

Current runtime data comes from PostgreSQL seed data plus Python simulator events. Phase 9 adds the implemented Kaggle historical import path that feeds the same PostgreSQL analytics model. The remaining official backlog continues through advanced Fleet Map, advanced analytics, internal analytics service, large dataset performance, and final proof.

Official remaining backlog:

- `docs/phase-9-14-official-backlog.md`
- `docs/github-issue-kanban-cards.md`

### Phase 1: Planning

Phase 1 defines the project scope, architecture direction, dataset strategy, core entities, and first API contract. It does not implement UI, backend services, Kafka, database migrations, Docker services, or micro-frontends.

Phase 1 outputs:

- `README.md`
- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/dataset-plan.md`

### Phase 2: Frontend Foundation

Phase 2 starts the visible product with React, TypeScript, and Vite. The first screens will use typed mock JSON and API-shaped data so the frontend can move quickly before the backend exists.

Initial focus:

- App layout
- Routing
- Shared UI primitives
- Mock data
- Dashboard Overview
- Delivery Tracking
- Alert Center

Phase 2 implementation is based on a pnpm workspace. The active frontend app is `apps/shell`, and the package name is `@logitrack/shell`. Other app folders remain placeholders for later phases.

Run the frontend from the repository root:

```bash
pnpm install
pnpm dev
```

Quality checks from the repository root:

```bash
pnpm lint
pnpm build
```

Run the full REST-backed application from the repository root:

```bash
docker compose up --build
pnpm install
pnpm dev
```

The frontend reads `VITE_API_BASE_URL` when provided and otherwise uses `http://localhost:8080`.

Phase 2 includes:

- pnpm workspace setup
- React + TypeScript + Vite shell app
- React Router routes for Dashboard, Deliveries, Alerts, and Not Found
- Sidebar, header, and content layout
- Shared UI components: Button, Card, Badge, PageHeader, EmptyState
- TypeScript API/entity types based on Phase 1 docs
- Typed mock data for dashboard, deliveries, and alerts
- Dashboard Overview with KPI cards, recent alerts, and one Recharts status summary

Phase 2 intentionally does not include:

- Real API requests
- Authentication
- Backend, database, Docker, or Kafka setup
- Fleet Map or Analytics
- Micro-frontend remotes
- Shared package extraction

### Phase 3A: Backend REST + PostgreSQL Foundation

The backend REST and database foundation has been completed ahead of the original kanban order. The kanban lists some REST work under Phase 4, but this project now treats the completed Spring Boot REST API and PostgreSQL setup as `Phase 3A`.

Phase 3A includes:

- PostgreSQL schema and seed data
- Spring Boot backend API
- Docker Compose for backend and PostgreSQL
- REST endpoints for dashboard summary, vehicles, deliveries, alerts, and alert resolve

### Phase 3B and Later

Later phases add the deeper system pieces:

- Python data simulator
- Kafka-backed event pipeline
- Stream consumer
- SSE or WebSocket live updates
- Fleet Map
- Analytics
- Performance optimizations
- Micro-frontend architecture

## Technology Direction

Early frontend:

- React
- TypeScript
- Vite
- Mock JSON data
- SSE or WebSocket simulator

Later system layers:

- Spring Boot
- PostgreSQL
- Kafka
- Python simulator
- Docker Compose

Kafka is intentionally postponed until the later real-time pipeline phase. The first backend goal is a working Spring Boot REST API backed by PostgreSQL.

### Phase 3: Spring Boot + PostgreSQL REST Foundation

Phase 3 adds the first real backend and database foundation. The frontend still uses mock data until Phase 4, but the API is ready for integration.

Run the backend and PostgreSQL from the repository root:

```bash
docker compose up --build
```

Phase 3 services:

- PostgreSQL on `localhost:55432`
- Spring Boot backend on `localhost:8080`

Useful endpoint checks:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/dashboard/summary
curl http://localhost:8080/api/deliveries
curl http://localhost:8080/api/alerts
curl http://localhost:8080/api/vehicles
```

PostgreSQL initializes schema and seed data from:

- `database/migrations/001_init_schema.sql`
- `database/seed/001_seed_demo_data.sql`

PostgreSQL init scripts run only when the database volume is first created. To reset the demo database:

```bash
docker compose down -v
docker compose up --build
```

Phase 3 intentionally does not include Kafka, WebSocket/SSE, authentication, frontend API integration, or advanced analytics.

### Phase 3B: Realtime Data Pipeline Foundation

Phase 3B adds a Kafka-compatible event pipeline with Redpanda, a Python data simulator, and a stream consumer that writes events to PostgreSQL.

Pipeline services:

- Redpanda on `localhost:19092`
- Python data simulator in `services/data-simulator`
- Python stream consumer in `services/stream-consumer`

Kafka-compatible topics:

- `vehicle-location-updated`
- `delivery-status-changed`
- `delivery-delayed`
- `alert-created`

Run the full pipeline:

```bash
docker compose up --build
```

The simulator produces logistics events, the consumer writes them to PostgreSQL, and the existing REST endpoints read the updated database state.

### Phase 4A: Frontend REST Integration

The React shell now uses TanStack Query and the Spring Boot REST API instead of mock data for the main dashboard, deliveries, and alerts flows.

Phase 4A includes:

- `QueryClientProvider` at the app root
- API client functions under `src/services/api`
- REST-backed Dashboard Overview
- REST-backed Delivery Tracking table
- REST-backed Alert Center table
- Alert resolve action through `PATCH /api/alerts/{id}/resolve`
- Loading, error, and empty states for API-backed screens

### Phase 4B: Live Dashboard + Alerts

The first live update version uses Server-Sent Events.

Live endpoints:

- `GET /api/live/dashboard`
- `GET /api/live/alerts`

The dashboard and alert center subscribe to these endpoints and update their TanStack Query cache as events arrive. Alert Center also includes a severity filter for `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.

### Phase 5: Analytics

Phase 5 adds historical delivery analytics after the live dashboard. It uses REST aggregation from the backend instead of mock data and keeps predictive analytics out of scope.

Analytics endpoint:

```bash
curl "http://localhost:8080/api/analytics/summary"
curl "http://localhost:8080/api/analytics/summary?region=Ankara"
curl "http://localhost:8080/api/analytics/summary?from=2026-05-01&to=2026-05-25"
curl "http://localhost:8080/api/analytics/summary?from=2026-05-01&to=2026-05-25&region=Ankara"
```

Phase 5 includes:

- `/analytics` route and sidebar navigation
- Date range and region filters connected to `GET /api/analytics/summary`
- Delay trend chart from backend `delayTrend` data
- Region delay analysis from backend `regionBreakdown` data
- Driver and vehicle performance tables using the shared table component
- Filtered CSV export for driver and vehicle performance tables

Verification:

```bash
docker compose build backend-api
docker compose up -d
pnpm lint
pnpm build
```

### Phase 6: Performance & Testing

Phase 6 hardens the Phase 4 and Phase 5 work with automated frontend tests, backend analytics tests, route-level lazy loading, chart data windowing, and coalesced live update cache writes.

Frontend verification:

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:frontend
```

Backend verification uses Docker Compose as the primary path:

```powershell
docker compose build backend-api
docker compose up -d
.\scripts\verify-api.ps1
```

Local Maven verification is optional for developers who have Maven installed:

```bash
mvn test
```

Phase 6 includes:

- Vitest, React Testing Library, jsdom, and focused frontend tests
- Shared table, CSV helper, analytics state, filter, route, and API client tests
- Docker-backed backend/API endpoint verification
- Backend analytics controller and calculation tests when Maven is available
- Lazy-loaded Dashboard, Deliveries, Alerts, and Analytics routes
- Lightweight route loading fallback
- Coalesced SSE cache updates for dashboard and alert streams
- Chart data windowing helper for bounded chart rendering

Table virtualization is implemented in the shared table component and enabled on high-volume delivery, alert, analytics, and fleet tables. React Profiler captures still need to be refreshed with a 10k+ imported dataset before publishing final screenshots.

Live map marker throttling is implemented together with the vehicle live SSE endpoint.

#### Performance Notes

Measured with React DevTools Profiler. Manual profiler captures should be refreshed before publishing final screenshots.

| Screen | Initial render | Re-render behavior | Notes | Result |
|---|---:|---|---|---|
| Dashboard | Pending manual capture | SSE cache updates are coalesced before query cache writes | Lazy-loaded route with bounded dashboard sections | Pending |
| Alerts | Pending manual capture | Severity/filter changes should rerender the alert table area | Paginated list with virtualization enabled for high-volume rows | Pending |
| Analytics | Pending manual capture | Filter changes rerender charts and performance tables | Chart data windowing limits render cost | Pending |

The project does not claim table virtualization until Phase 13 is implemented and verified.

### Phase 7: Runtime Micro-Frontend

Phase 7 introduces runtime micro-frontends with Vite Module Federation. The shell remains the host application, while Analytics, Fleet Dashboard, Delivery Management, and Alert Center run as standalone remotes and can also be loaded inside the shell.

Detailed micro-frontend notes live in `docs/micro-frontend.md`.

Phase 7 route ownership:

- `/` and `/dashboard`: Shell-hosted operations dashboard
- `/deliveries`: Delivery Management remote
- `/alerts`: Alert Center remote
- `/analytics`: Analytics remote
- `/fleet`: Fleet Dashboard remote
- `/fleet/vehicles/:id`: Fleet Dashboard remote vehicle detail

Development ports:

- Shell host: `http://localhost:5173`
- Analytics remote: `http://localhost:5174`
- Fleet Dashboard remote: `http://localhost:5175`
- Delivery Management remote: `http://localhost:5176`
- Alert Center remote: `http://localhost:5177`

Development commands:

```bash
pnpm dev
pnpm dev:standalone
pnpm dev:shell
pnpm dev:analytics
pnpm dev:fleet
pnpm dev:delivery
pnpm dev:alerts
```

Use `pnpm dev` for the integrated shell plus remote demo. It builds the remotes first and then serves preview output so `/assets/remoteEntry.js` exists for the shell.

Use `pnpm dev:standalone` only when developing standalone remotes directly. Vite dev mode serves each remote app, but it does not emit the built federation `remoteEntry.js` file that the shell imports.

Production preview commands:

```bash
pnpm build
pnpm preview:shell
pnpm preview:analytics
pnpm preview:fleet
pnpm preview:delivery
pnpm preview:alerts
```

Shared workspace packages:

- `@logitrack/types` owns shared logistics entity, DTO, and API response types.
- `@logitrack/api-client` owns API configuration, fetch wrappers, logistics API functions, query keys, and SSE helpers.
- `@logitrack/ui` owns reusable UI primitives only: Button, Card, Badge, Table, PageHeader, EmptyState, StateMessage, LazyPage, and RemoteErrorFallback.

Provider rule:

- The shell owns the global `QueryClientProvider`.
- Federated remote page exports do not create their own `QueryClientProvider`; they render under the shell provider.
- Standalone remote `main.tsx` files may use a local `QueryClientProvider` only for isolated remote development.

Fleet Dashboard is backed by `GET /api/vehicles` and renders a React Leaflet map with OpenStreetMap tiles, status-based vehicle markers, marker popups, a selected vehicle side panel, `/fleet/vehicles/:id` detail routing, and a live vehicle SSE stream.

### Phase 8: Fleet Map and Vehicle Detail

Fleet Map is implemented inside the Fleet Dashboard remote and works both inside the shell and as a standalone remote.

Implemented:

- React Leaflet map with OpenStreetMap tiles
- Vehicle markers from `/api/vehicles`
- Marker popup with vehicle plate, type, status, driver, and last update time
- Selected vehicle panel with detail navigation
- Vehicle detail route using `GET /api/vehicles/{id}`
- Responsive map/detail layout
- Loading, error, and empty states

Current Fleet Map scope:

- Vehicle positions refresh through TanStack Query polling and the Phase 10 live SSE stream when available.
- Warehouse and destination markers are not included yet.
- Vehicle speed/fuel history chart is part of the Phase 10/11 advanced completion path.

### Phase 10: Advanced Fleet Map Completion

Implemented Phase 10 Fleet Map proof points:

- Markers come from real `/api/vehicles` data.
- Markers are visually separated by vehicle status: active, idle, maintenance, and offline.
- A marker legend is rendered on top of the map.
- Clicking a marker opens the selected vehicle side panel.
- `/fleet/vehicles/:id` uses `GET /api/vehicles/{id}` for real API detail data.
- `GET /api/live/vehicles` streams latest vehicle snapshots over SSE.
- Simulator `vehicle.location.updated` events update PostgreSQL through the stream consumer, and the live SSE snapshot moves markers as vehicle coordinates change.
- `apps/fleet-dashboard/src/markerUpdateBuffer.ts` throttles live marker cache updates before rendering.
- Loading, error, and empty states are preserved for map and detail views.

### Phase 11: Advanced Analytics Upgrade

Implemented Phase 11 analytics proof points:

- Spring GraphQL endpoint at `POST /graphql`.
- `deliveryAnalytics` GraphQL query backed by the existing PostgreSQL analytics aggregation service.
- Analytics remote consumes GraphQL through `@logitrack/api-client`.
- Plotly delay trend chart renders backend delay trend data.
- D3 region heatmap renders backend region breakdown data.
- Route efficiency dashboard derives a filter-aware efficiency score from vehicle performance metrics.
- REST `/api/analytics/summary` remains available for API smoke checks and backwards compatibility.

### Phase 12: Internal Analytics Service

Phase 12 adds a separate Streamlit service for internal data review:

```bash
docker compose up --build analytics-service
```

Open `http://localhost:8501`.

The service uses `DATABASE_URL` and queries PostgreSQL directly. It includes:

- Data quality overview
- Delay distribution
- Region breakdown
- Driver rankings
- Vehicle rankings

The service is intended for internal portfolio/demo verification and does not replace the customer-facing React Analytics remote.

### Phase 9-14 Official Backlog

The remaining project work is not treated as future work. It is tracked as official phases:

- Phase 9 — Historical Dataset Integration
- Phase 10 — Advanced Fleet Map Completion
- Phase 11 — Advanced Analytics Upgrade
- Phase 12 — Internal Analytics Service
- Phase 13 — Large Dataset Performance
- Phase 14 — Final CI/CD, Documentation & Demo Proof

Backlog and issue cards:

- `docs/phase-9-14-official-backlog.md`
- `docs/github-issue-kanban-cards.md`

### Phase 9: Historical Dataset Integration

Primary dataset: [Logistics Operations Database](https://www.kaggle.com/datasets/yogape/logistics-operations-database)

Fallback dataset: [Logistics Operations & Risk Dataset](https://www.kaggle.com/datasets/programmer3/logistics-operations-and-risk-dataset)

Phase 9 import workflow:

```bash
python scripts/import_historical_data.py --csv data/sample/historical_deliveries_sample.csv --dry-run
python scripts/import_historical_data.py --csv data/raw/<kaggle-file>.csv
python scripts/check_data_quality.py
```

The importer maps Kaggle CSV rows to LogiTrack regions, drivers, warehouses, vehicles, deliveries, delivery events, and vehicle location events. It uses deterministic IDs and PostgreSQL upserts, so re-running the import does not create duplicate deliveries.

Phase 9 acceptance requires at least 5,000 imported historical delivery records, zero critical data quality failures, and analytics verification through `/api/analytics/summary`.

### Data Strategy

The current portfolio-ready data strategy is deterministic seed data plus realtime simulator events.

- PostgreSQL seed data initializes vehicles, drivers, warehouses, deliveries, alerts, and location records.
- Python simulator events flow through Redpanda/Kafka-compatible topics.
- Python stream consumer persists live changes back into PostgreSQL.
- Kaggle historical CSV import is implemented as the Phase 9 path and should only be claimed as complete after the 5k-row acceptance criteria pass.

More detail:

- `docs/dataset-plan.md`
- `docs/data-quality.md`
- `docs/data-lineage.md`
- `docs/dataset-selection.md` after Phase 9 starts

### Documentation Index

- `docs/architecture.md`: system architecture and data pipeline notes
- `docs/api-contract.md`: REST and SSE contract
- `docs/micro-frontend.md`: shell/remotes/shared package boundaries
- `docs/dataset-selection.md`: selected Kaggle dataset, fallback dataset, access rules, and entity mapping
- `docs/diagrams.md`: architecture, data pipeline, and micro-frontend diagrams
- `docs/final-verification.md`: Phase 14 demo runbook and verification evidence table
- `docs/phase-9-14-official-backlog.md`: official remaining phases and acceptance criteria
- `docs/github-issue-kanban-cards.md`: issue-ready kanban cards
- `docs/data-quality.md`: current data quality and planned Phase 9 checks
- `docs/data-lineage.md`: simulator and Kaggle import data flows

### Deployment

The primary deployment target for this portfolio version is a local Docker demo for backend, PostgreSQL, Redpanda, simulator, and consumer, plus local Vite dev/preview for frontend micro-frontends.

Hosted frontend/backend deployment is outside Phase 14 unless explicitly added to the board. The current official proof target is a reproducible full-stack local Docker demo plus GitHub Actions green verification.

### Known Limitations

- Authentication is outside the portfolio scope.
- Fleet live updates use snapshot polling until Phase 10 lands the live vehicle SSE stream.
- Kaggle historical data import has a working Phase 9 script path; raw Kaggle files are not committed and the 5k import gate must still be verified with a downloaded dataset.
- GraphQL, Plotly, D3 heatmap, and route efficiency scoring are implemented in Phase 11; screenshots still need to be captured in Phase 14.
- Streamlit internal analytics service is implemented in Phase 12 and runs on port `8501`.
- Table virtualization is implemented through `@tanstack/react-virtual` in the shared table component and enabled for high-volume delivery, alert, analytics, and fleet tables.
- Hosted deployment is not part of the current verified delivery path.

### CV-Ready Summary

LogiTrack Control Tower | React, TypeScript, Spring Boot, PostgreSQL, Redpanda, SSE, Micro-Frontend

- Built a realtime logistics operations dashboard with shell-hosted runtime micro-frontends for deliveries, alerts, analytics, and fleet monitoring.
- Implemented REST-backed KPI, delivery, alert, analytics, Fleet Map, and vehicle detail views with TanStack Query and typed shared packages.
- Added a Kafka-compatible event simulation pipeline with Redpanda, Python producer/consumer services, PostgreSQL persistence, and SSE live dashboard/alert updates.
- Hardened the project with focused frontend tests, backend tests, CI, API verification script, performance notes, and architecture/data documentation.

## Phase 1 Boundaries

The following are intentionally out of scope for Phase 1:

- UI implementation
- Detailed wireframes
- Kafka setup
- Backend implementation
- Database migrations
- Docker Compose service setup
- Micro-frontend setup
- Separate data model or wireframe documents

Core entity information lives in `docs/architecture.md` for now. API response shapes live in `docs/api-contract.md`.
