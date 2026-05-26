# Data Quality

LogiTrack keeps deterministic demo data for the live pipeline and adds Kaggle historical CSV import in Phase 9. The two paths share the same PostgreSQL schema so REST analytics can read seed, simulator, and imported historical records through one API.

## Runtime Sources

| Source | Purpose | Status |
|---|---|---|
| PostgreSQL seed SQL | Initial vehicles, drivers, warehouses, deliveries, alerts, and location history | Active |
| Python data simulator | Realtime logistics events for location, delivery status, delay, and alert flows | Active |
| Redpanda/Kafka-compatible topics | Event transport between simulator and consumer | Active |
| Kaggle logistics CSV | Historical enrichment for analytics | Active Phase 9 path |
| OpenStreetMap/Overpass | Map context and warehouse/destination enrichment | Scheduled for Phase 10 where needed |

## Normalization

- IDs are stable strings so frontend route and table state remain predictable.
- Timestamps use ISO-compatible values and are stored by PostgreSQL/Spring Boot as offset date-time values.
- Vehicle coordinates are stored on the current vehicle row and copied into `vehicle_location_events` for history.
- Delivery status, priority, alert severity, and vehicle status are enum-backed values in the backend and TypeScript types.

## Synthetic Fields

Some operational fields are intentionally synthetic: vehicle plates, driver names, warehouse records, route regions, priorities, alert messages, delay values, and sample coordinates. They support a realistic control tower demo rather than represent a real carrier dataset.

## Phase 9 Quality Checks

Historical imports are validated with:

```bash
python scripts/import_historical_data.py --csv data/sample/historical_deliveries_sample.csv --dry-run
python scripts/import_historical_data.py --csv data/sample/historical_deliveries_sample.csv
python scripts/check_data_quality.py
```

The quality script checks:

- Duplicate delivery tracking numbers
- Missing delivery region or status values
- Delivery to vehicle/driver foreign-key orphans
- Negative delay minutes
- Vehicle rows without coordinates
- Date range and status distribution overview

Critical checks must return zero failures before Phase 9 can be marked complete. Warning checks are allowed only when the README or final verification document explains why the data is still safe for the demo.

## Current Limitations

- Kaggle raw CSV files are not committed to Git; developers download them into `data/raw/`.
- The committed sample fixture proves the import path but does not satisfy the 5k-row acceptance gate by itself.
- Map enrichment is limited to stored vehicle coordinates and OpenStreetMap tile rendering.
- The simulator is not a production GPS or IoT stream.
- Fleet live updates use bounded snapshot polling in the frontend until Phase 10 adds a dedicated vehicle SSE stream.
