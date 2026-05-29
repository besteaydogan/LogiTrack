-- Import order matters:
-- regions -> warehouses -> vehicles -> historical_deliveries. Operational
-- deliveries, alerts, simulation runs, and events are intentionally left empty
-- so the CSV replay simulator can create live state through Redpanda/Kafka.
-- Drivers are intentionally preserved from 001_seed_demo_data.sql because
-- Kaggle seed rows reference existing DRV-001 through DRV-005 records.

TRUNCATE TABLE alerts RESTART IDENTITY CASCADE;
TRUNCATE TABLE delivery_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE vehicle_location_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE deliveries RESTART IDENTITY CASCADE;
TRUNCATE TABLE simulation_runs RESTART IDENTITY CASCADE;
TRUNCATE TABLE historical_deliveries RESTART IDENTITY CASCADE;
TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE;
TRUNCATE TABLE warehouses RESTART IDENTITY CASCADE;
TRUNCATE TABLE regions RESTART IDENTITY CASCADE;

COPY regions(id, city, district, risk_score)
FROM '/docker-entrypoint-initdb.d/seed/kaggle_regions.csv'
CSV HEADER;

COPY warehouses(id, name, city, district, latitude, longitude, capacity)
FROM '/docker-entrypoint-initdb.d/seed/kaggle_warehouses.csv'
CSV HEADER;

COPY vehicles(id, plate, type, capacity, status, current_driver_id, last_latitude, last_longitude, last_seen_at)
FROM '/docker-entrypoint-initdb.d/seed/kaggle_vehicles.csv'
CSV HEADER;

UPDATE vehicles
SET last_latitude = NULL,
    last_longitude = NULL,
    last_seen_at = NULL,
    simulation_run_id = NULL;

COPY historical_deliveries(id, tracking_number, vehicle_id, driver_id, warehouse_id, region, status, priority,
  estimated_delivery_time, actual_delivery_time, delay_minutes, last_updated_at)
FROM '/docker-entrypoint-initdb.d/seed/kaggle_deliveries.csv'
CSV HEADER;
