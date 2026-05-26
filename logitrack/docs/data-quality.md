# Data Quality

LogiTrack uses deterministic seed data, live simulator events, and a Kaggle-compatible historical import path. All three paths target the same PostgreSQL schema so dashboard, fleet, REST analytics, GraphQL analytics, and Streamlit panels can read a common operational model.

## Source Status

| Source | Purpose | Status | Evidence |
|---|---|---|---|
| PostgreSQL seed SQL | Initial demo vehicles, drivers, warehouses, deliveries, alerts, and locations | Active | `database/seed/001_seed_demo_data.sql` |
| Python data simulator | Realtime location, status, delay, and alert events | Active | `services/data-simulator` |
| Redpanda/Kafka-compatible topics | Event transport between simulator and consumer | Active | `docker-compose.yml` |
| Python stream consumer | Persists simulator events into PostgreSQL | Active | `services/stream-consumer` |
| Kaggle historical CSV | Higher-volume historical analytics data | Importer implemented, large import evidence pending | `scripts/import_historical_data.py` |
| OpenStreetMap tiles | Fleet Map visual context | Active | React Leaflet tile layer |
| OpenStreetMap/Overpass enrichment | Warehouse/destination enrichment | Planned | Not part of current verified dataset |

## Kaggle Import Status

The repository includes:

- A sample CSV fixture: `data/sample/historical_deliveries_sample.csv`
- An idempotent importer: `scripts/import_historical_data.py`
- A data quality checker: `scripts/check_data_quality.py`
- Processed-output support under `data/processed/`

The repository does not include raw Kaggle CSV files. Download raw files into `data/raw/` locally.

Phase 9 is not complete until a local Kaggle CSV import proves:

- At least 5,000 historical delivery rows in PostgreSQL.
- Re-running the import does not create duplicate delivery tracking numbers.
- `scripts/check_data_quality.py` exits successfully with zero critical failures.
- Analytics endpoints return imported records.

## Import Commands

Dry-run with committed sample data:

```bash
python scripts/import_historical_data.py --csv data/sample/historical_deliveries_sample.csv --dry-run
```

Import local raw Kaggle data:

```bash
python scripts/import_historical_data.py --csv data/raw/<kaggle-file>.csv
```

Run quality checks:

```bash
python scripts/check_data_quality.py
```

## Quality Checks

The quality script currently checks:

| Check | Severity | Purpose |
|---|---|---|
| Duplicate delivery tracking numbers | Critical | Prevent duplicate imported deliveries |
| Missing delivery region | Critical | Ensure analytics/filtering can group rows |
| Missing delivery timestamp | Critical | Ensure analytics can filter and trend deliveries |
| Missing delivery status | Critical | Ensure dashboard and tables can classify deliveries |
| Invalid delivery status | Critical | Ensure imported rows match backend enum values |
| Delivery vehicle foreign-key orphans | Critical | Ensure deliveries point to real vehicles |
| Delivery driver foreign-key orphans | Critical | Ensure deliveries point to real drivers |
| Negative delay minutes | Critical | Prevent invalid delay metrics |
| Missing vehicle coordinates | Warning | Identify rows that cannot appear on Fleet Map |
| Invalid vehicle coordinates | Critical | Prevent latitude/longitude values outside valid ranges |
| Date range overview | Informational | Confirm source data time span |
| Status distribution overview | Informational | Confirm imported statuses are plausible |

The script exposes duplicate delivery ID, duplicate tracking number, missing timestamp, invalid status, missing region, invalid coordinates, and negative delay checks as separate rows.

## Normalization Rules

- Source IDs are converted into deterministic IDs with stable prefixes such as `DLV`, `DRV`, `VHL`, `WH`, and `REG`.
- Dates are parsed from common ISO, day-first, and month-first formats, then normalized to timezone-aware timestamps.
- Delivery statuses are mapped into LogiTrack enum values: `CREATED`, `ASSIGNED`, `IN_TRANSIT`, `DELAYED`, `DELIVERED`, `CANCELLED`.
- Priorities are mapped into `LOW`, `NORMAL`, `HIGH`, and `URGENT`.
- Delay minutes are clamped to zero or greater.
- Missing coordinates default to Istanbul-centered sample coordinates unless a source column provides a location.

## Kaggle Column Mapping

The importer accepts multiple aliases so it can work with the selected primary dataset or fallback CSV.

| LogiTrack entity/field | Source aliases |
|---|---|
| Delivery source key | `order_id`, `shipment_id`, `delivery_id`, `tracking_number`, `tracking_id`, `id` |
| Tracking number | `tracking_number`, `tracking_id`, `shipment_id` |
| City | `city`, `destination_city`, `region`, `delivery_city` |
| District | `district`, `destination_district`, `area`, `zone` |
| Estimated delivery time | `estimated_delivery_time`, `estimated_arrival`, `eta`, `planned_delivery_time`, `delivery_date` |
| Actual delivery time | `actual_delivery_time`, `delivered_at`, `actual_arrival`, `delivery_completed_at` |
| Delay minutes | `delay_minutes`, `delay`, `late_minutes` |
| Latitude | `latitude`, `lat`, `last_latitude`, `destination_latitude` |
| Longitude | `longitude`, `lng`, `lon`, `last_longitude`, `destination_longitude` |
| Driver | `driver_name`, `driver`, `courier_name` |
| Driver phone | `driver_phone`, `phone` |
| Driver rating | `driver_rating`, `rating` |
| Vehicle plate | `vehicle_plate`, `plate`, `truck_id`, `vehicle_id` |
| Vehicle type | `vehicle_type`, `truck_type`, `vehicle_category` |
| Vehicle capacity | `vehicle_capacity`, `capacity` |
| Delivery status | `status`, `delivery_status` |
| Priority | `priority`, `shipment_priority` |
| Risk score | `risk_score`, `risk` |

## Synthetic Fields

The importer generates safe synthetic values when a source file does not include every operational field:

- Driver names and IDs
- Vehicle plates and IDs
- Warehouse names and coordinates
- Region IDs
- Driver ratings
- Vehicle capacity
- Delivery priority
- Risk score
- Current vehicle status
- Last update timestamp

Synthetic values are deterministic where possible so repeated imports remain stable.

## Ignored Columns

Columns outside the alias list are ignored by the importer. This keeps the import path tolerant of Kaggle dataset variation and avoids overfitting the schema to one CSV export.

## Current Limitations

- 5k+ Kaggle import evidence is pending.
- Raw Kaggle files are not committed to Git.
- The current quality checker covers the requested critical checks, but its output still needs to be captured after a real 5k+ import.
- The simulator is not a production GPS/IoT stream.
- Real company logistics data is not used.
