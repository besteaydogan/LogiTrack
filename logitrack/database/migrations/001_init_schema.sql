CREATE TABLE regions (
  id VARCHAR(32) PRIMARY KEY,
  city VARCHAR(80) NOT NULL,
  district VARCHAR(80) NOT NULL,
  risk_score INTEGER NOT NULL
);

CREATE TABLE drivers (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40),
  rating DOUBLE PRECISION NOT NULL,
  status VARCHAR(32) NOT NULL
);

CREATE TABLE warehouses (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  district VARCHAR(80) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE vehicles (
  id VARCHAR(32) PRIMARY KEY,
  plate VARCHAR(32) NOT NULL,
  type VARCHAR(60) NOT NULL,
  capacity INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL,
  current_driver_id VARCHAR(32) REFERENCES drivers(id),
  last_latitude DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  last_seen_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE deliveries (
  id VARCHAR(32) PRIMARY KEY,
  tracking_number VARCHAR(64) NOT NULL,
  vehicle_id VARCHAR(32) NOT NULL REFERENCES vehicles(id),
  driver_id VARCHAR(32) NOT NULL REFERENCES drivers(id),
  warehouse_id VARCHAR(32) NOT NULL REFERENCES warehouses(id),
  region VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE vehicle_location_events (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id VARCHAR(32) NOT NULL REFERENCES vehicles(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed INTEGER,
  fuel_level INTEGER,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE delivery_events (
  id BIGSERIAL PRIMARY KEY,
  delivery_id VARCHAR(32) NOT NULL REFERENCES deliveries(id),
  event_type VARCHAR(80) NOT NULL,
  old_status VARCHAR(32),
  new_status VARCHAR(32),
  event_time TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE alerts (
  id VARCHAR(32) PRIMARY KEY,
  alert_type VARCHAR(80) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  delivery_id VARCHAR(32) REFERENCES deliveries(id),
  vehicle_id VARCHAR(32) REFERENCES vehicles(id),
  region VARCHAR(120) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_region ON deliveries(region);
CREATE INDEX idx_alerts_status_created_at ON alerts(status, created_at DESC);
CREATE INDEX idx_vehicles_status ON vehicles(status);
