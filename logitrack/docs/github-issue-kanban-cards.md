# GitHub Issue / Kanban Cards

Use these issue cards to create the Phase 9-14 GitHub backlog. Recommended board columns: Backlog, Ready, In Progress, Review, Done.

| Order | Title | Labels | Priority | Phase | Acceptance Summary |
|---:|---|---|---|---|---|
| 1 | `[Phase 9] Select Kaggle logistics dataset and document selection` | `docs,data,phase-9` | High | 9 | Dataset decision documented and README-linked |
| 2 | `[Phase 9] Create data raw/processed/sample structure` | `data,repo-cleanup,phase-9` | High | 9 | Data folders and sample fixture exist |
| 3 | `[Phase 9] Map Kaggle CSV columns to LogiTrack entities` | `data,database,backend,phase-9` | High | 9 | Mapping doc covers deliveries, drivers, vehicles, regions, events |
| 4 | `[Phase 9] Implement idempotent historical import script` | `python,database,data,phase-9` | High | 9 | 5k+ records imported without duplicates |
| 5 | `[Phase 9] Add data quality validation script` | `data,testing,phase-9` | Medium | 9 | Quality script returns zero critical errors |
| 6 | `[Phase 9] Verify Analytics with imported historical data` | `analytics,backend,frontend,phase-9` | High | 9 | Analytics endpoint and UI show imported data |
| 7 | `[Phase 10] Add live vehicle location SSE endpoint` | `backend,realtime,map,phase-10` | High | 10 | `/api/live/vehicles` streams current vehicle updates |
| 8 | `[Phase 10] Add vehicle live types and API client subscription` | `types,api-client,realtime,phase-10` | High | 10 | Shared type and API helper exist |
| 9 | `[Phase 10] Implement status-based markers and legend` | `frontend,map,phase-10` | High | 10 | Marker color/class differs by vehicle status |
| 10 | `[Phase 10] Finalize selected vehicle panel and detail navigation` | `frontend,map,phase-10` | High | 10 | Marker click opens panel and detail route uses API |
| 11 | `[Phase 10] Add throttled marker update buffer` | `performance,frontend,map,phase-10` | High | 10 | Buffered updates flush latest vehicle position only |
| 12 | `[Phase 10] Add Fleet Map tests and screenshots` | `testing,docs,map,phase-10` | High | 10 | Functional tests and README proof screenshots exist |
| 13 | `[Phase 11] Add Spring GraphQL analytics endpoint` | `backend,graphql,analytics,phase-11` | High | 11 | GraphQL endpoint exposes analytics queries |
| 14 | `[Phase 11] Add frontend GraphQL client for analytics remote` | `frontend,graphql,analytics,phase-11` | High | 11 | Analytics remote consumes GraphQL |
| 15 | `[Phase 11] Replace delay trend with Plotly chart` | `frontend,analytics,visualization,phase-11` | Medium | 11 | Plotly trend chart renders imported data |
| 16 | `[Phase 11] Add D3 region heatmap` | `frontend,d3,analytics,phase-11` | High | 11 | Heatmap and tooltip render real backend data |
| 17 | `[Phase 11] Implement route efficiency metrics and dashboard` | `backend,frontend,analytics,phase-11` | High | 11 | KPI and table are filter-aware |
| 18 | `[Phase 11] Add advanced analytics tests and screenshots` | `testing,docs,analytics,phase-11` | High | 11 | Tests and screenshots cover GraphQL/Plotly/D3 |
| 19 | `[Phase 12] Scaffold Streamlit analytics-service` | `python,analytics-service,phase-12` | High | 12 | Streamlit app starts locally |
| 20 | `[Phase 12] Add PostgreSQL data access layer` | `python,database,phase-12` | High | 12 | Service reads PostgreSQL through `DATABASE_URL` |
| 21 | `[Phase 12] Build data quality and delay distribution views` | `analytics,streamlit,phase-12` | High | 12 | Data quality and delay panels visible |
| 22 | `[Phase 12] Build region, driver, and vehicle ranking views` | `analytics,streamlit,phase-12` | Medium | 12 | Ranking panels visible |
| 23 | `[Phase 12] Add Docker Compose integration and docs` | `devops,docs,phase-12` | High | 12 | Compose service and README instructions exist |
| 24 | `[Phase 13] Harden backend pagination, filtering, and sorting` | `backend,performance,phase-13` | High | 13 | API responses are bounded and stable |
| 25 | `[Phase 13] Add table virtualization for high-volume lists` | `frontend,performance,phase-13` | High | 13 | High-volume table scroll remains usable |
| 26 | `[Phase 13] Move chart aggregation to backend queries` | `backend,analytics,performance,phase-13` | High | 13 | Charts consume aggregated data |
| 27 | `[Phase 13] Add large dataset performance tests` | `testing,performance,phase-13` | Medium | 13 | Large dataset smoke and API tests exist |
| 28 | `[Phase 13] Record React Profiler before/after notes` | `docs,performance,phase-13` | High | 13 | README has measured before/after notes |
| 29 | `[Phase 14] Verify GitHub Actions green on latest commit` | `ci-cd,verification,phase-14` | High | 14 | Frontend and backend jobs are green |
| 30 | `[Phase 14] Run and document full-stack Docker demo` | `devops,docs,verification,phase-14` | High | 14 | Full-stack demo runbook passes |
| 31 | `[Phase 14] Verify all shell and remote routes` | `micro-frontend,testing,phase-14` | High | 14 | Shell and standalone remotes smoke-tested |
| 32 | `[Phase 14] Capture final screenshots` | `docs,screenshots,phase-14` | High | 14 | README-linked screenshots exist |
| 33 | `[Phase 14] Add final architecture/data/micro-frontend diagrams` | `docs,architecture,phase-14` | Medium | 14 | Diagrams are current and linked |
| 34 | `[Phase 14] Create docs/final-verification.md and final CV bullets` | `docs,portfolio,phase-14` | High | 14 | Final checklist and CV bullets are complete |
