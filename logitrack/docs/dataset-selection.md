# Dataset Selection

Phase 9 makes the historical dataset path an implemented part of LogiTrack rather than a future-work note.

## Official Dataset

Primary dataset: [Logistics Operations Database](https://www.kaggle.com/datasets/yogape/logistics-operations-database)

Selection reasons:

- Multi-table logistics shape that is closer to LogiTrack than a single flat KPI file.
- CSV-based workflow, which fits the `data/raw` to `data/processed` import path.
- Operational fields can map naturally to deliveries, drivers, vehicles, maintenance/fuel-adjacent analytics, and regional performance.
- Large enough to make Phase 13 performance work meaningful after import.

Fallback dataset: [Logistics Operations & Risk Dataset](https://www.kaggle.com/datasets/programmer3/logistics-operations-and-risk-dataset)

Fallback is used only if the primary Kaggle dataset is unavailable, inaccessible, or does not contain enough delivery-level records for the acceptance gate.

## Access And Licensing

Kaggle dataset files are not committed to the repository. Download the CSV files locally into `data/raw/` after accepting Kaggle terms for the selected dataset. Large raw and processed CSV files are ignored by Git; the repository keeps only a small sample fixture in `data/sample/`.

## Repository Data Layout

| Path | Purpose | Git policy |
|---|---|---|
| `data/raw/` | Manually downloaded Kaggle CSV files | Ignored except `.gitkeep` |
| `data/processed/` | Normalized CSV output produced by the importer | Ignored except `.gitkeep` |
| `data/sample/` | Small deterministic import fixture | Committed |

## Entity Mapping

The importer accepts common logistics CSV column names and normalizes them into the current PostgreSQL model:

| Kaggle / CSV concept | LogiTrack table.field |
|---|---|
| Order or shipment identifier | `deliveries.id`, `deliveries.tracking_number` |
| City and district | `regions.city`, `regions.district`, `deliveries.region`, `warehouses.city`, `warehouses.district` |
| Delivery status | `deliveries.status` |
| Priority | `deliveries.priority` |
| Estimated and actual delivery timestamps | `deliveries.estimated_delivery_time`, `deliveries.actual_delivery_time` |
| Delay minutes or ETA variance | `deliveries.delay_minutes` |
| Driver name, phone, rating | `drivers.name`, `drivers.phone`, `drivers.rating` |
| Vehicle plate and type | `vehicles.plate`, `vehicles.type` |
| Latitude and longitude | `vehicles.last_latitude`, `vehicles.last_longitude`, `vehicle_location_events` |

When a source file is missing operational fields required by LogiTrack, the importer derives stable deterministic values from the shipment/order key. Derived values are prefixed with `HIST` where practical so imported historical records remain distinguishable from seed and simulator records.

## Phase 9 Acceptance Proof

The Phase 9 gate is complete only when:

- At least 5,000 historical deliveries are imported into PostgreSQL.
- `scripts/import_historical_data.py` can be run repeatedly without duplicate deliveries.
- `scripts/check_data_quality.py` returns zero critical errors.
- `/api/analytics/summary` shows meaningful imported historical delivery results.
- This document and the lineage/quality docs are linked from the README.
