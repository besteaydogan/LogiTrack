# Kaggle Dataset Integration

LogiTrack uses the Kaggle Delivery Logistics dataset as an offline historical source for local demos. Raw Kaggle files stay local and are ignored by Git.

## Source Dataset

- Source: https://www.kaggle.com/datasets/ayeshaseherr/delivery-logistics-dataset
- Local raw path: `data/raw/kaggle/delivery-logistics/original.csv`
- Observed shape: 25,000 rows and 15 columns

Observed columns:

```text
delivery_id, delivery_partner, package_type, vehicle_type, delivery_mode,
region, weather_condition, distance_km, package_weight_kg,
delivery_time_hours, expected_time_hours, delayed, delivery_status,
delivery_rating, delivery_cost
```

## Transform Rules

The ETL normalizes source columns to lowercase snake_case and writes schema-compatible CSVs under `data/processed/kaggle`.

Supported LogiTrack demo regions are:

```text
Ankara-Cankaya
Istanbul-Kadikoy
Istanbul-Sisli
Izmir-Konak
Bursa-Nilufer
```

If a source region is not one of these values, the ETL assigns it deterministically to one fixed region using seeded hashing. The same input row and seed produce the same region.

Status precedence is:

```text
CANCELLED > DELAYED > DELIVERED > IN_TRANSIT > ASSIGNED > CREATED
```

`delayed=true` with positive `delay_minutes` becomes `DELAYED` unless the source status is cancelled.

Timestamps are generated because the CSV has duration fields, not event dates:

```text
created_at = 2026-05-01T08:00:00Z + row_index minutes
estimated_delivery_time = created_at + expected_time_hours
actual_delivery_time = created_at + delivery_time_hours for DELIVERED or DELAYED rows
```

## Unused / Future Enrichment Columns

- `delivery_partner`: not persisted in the MVP schema; candidate carrier metadata.
- `package_type`: used only as a light priority signal.
- `package_weight_kg`: contributes to generated vehicle capacity.
- `delivery_cost`: not persisted in the MVP schema.
- `delivery_rating`: not persisted in the MVP schema; candidate future driver or route quality metric.

## Demo Size

The ETL supports the full 25k-row dataset, but the default demo import uses 5k rows to keep local seed/import and frontend rendering fast.

Run:

```powershell
python services\data-etl\kaggle_import\transform_kaggle_dataset.py --input data\raw\kaggle\delivery-logistics\original.csv --output data\processed\kaggle --max-rows 5000 --seed 42
```

Then copy the generated CSVs into `database/seed` using the `kaggle_*.csv` filenames expected by `database/seed/import_kaggle_seed.sql`.
