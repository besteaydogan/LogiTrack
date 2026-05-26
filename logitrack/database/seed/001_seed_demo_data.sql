INSERT INTO regions (id, city, district, risk_score) VALUES
  ('REG-ANK-CAN', 'Ankara', 'Cankaya', 72),
  ('REG-IST-KAD', 'Istanbul', 'Kadikoy', 81),
  ('REG-IST-SIS', 'Istanbul', 'Sisli', 66),
  ('REG-IZM-KON', 'Izmir', 'Konak', 58),
  ('REG-BUR-NIL', 'Bursa', 'Nilufer', 49);

INSERT INTO drivers (id, name, phone, rating, status) VALUES
  ('DRV-001', 'Ayse Demir', '+90 555 100 0001', 4.8, 'ASSIGNED'),
  ('DRV-002', 'Mert Kaya', '+90 555 100 0002', 4.6, 'ASSIGNED'),
  ('DRV-003', 'Elif Yilmaz', '+90 555 100 0003', 4.9, 'ASSIGNED'),
  ('DRV-004', 'Can Arslan', '+90 555 100 0004', 4.4, 'AVAILABLE'),
  ('DRV-005', 'Deniz Acar', '+90 555 100 0005', 4.5, 'ASSIGNED');

INSERT INTO warehouses (id, name, city, district, latitude, longitude, capacity) VALUES
  ('WH-ANK-01', 'Ankara Main Hub', 'Ankara', 'Cankaya', 39.9208, 32.8541, 180),
  ('WH-IST-01', 'Istanbul East Hub', 'Istanbul', 'Kadikoy', 40.9903, 29.0290, 240);

INSERT INTO vehicles
  (id, plate, type, capacity, status, current_driver_id, last_latitude, last_longitude, last_seen_at)
VALUES
  ('VHL-001', '06 LGT 001', 'Van', 1200, 'ACTIVE', 'DRV-001', 39.9212, 32.8539, '2026-05-20T21:25:00Z'),
  ('VHL-002', '34 LGT 002', 'Truck', 2600, 'ACTIVE', 'DRV-002', 40.9901, 29.0302, '2026-05-20T21:24:00Z'),
  ('VHL-003', '35 LGT 003', 'Van', 1100, 'IDLE', 'DRV-003', 38.4192, 27.1287, '2026-05-20T21:20:00Z'),
  ('VHL-004', '16 LGT 004', 'Van', 1000, 'ACTIVE', 'DRV-004', 40.1826, 29.0665, '2026-05-20T21:23:00Z'),
  ('VHL-005', '06 LGT 005', 'Truck', 3000, 'MAINTENANCE', NULL, 39.9250, 32.8400, '2026-05-20T20:55:00Z'),
  ('VHL-006', '34 LGT 006', 'Van', 1300, 'OFFLINE', NULL, 41.0600, 28.9870, '2026-05-20T20:40:00Z'),
  ('VHL-007', '35 LGT 007', 'Van', 1250, 'ACTIVE', 'DRV-005', 38.4310, 27.1400, '2026-05-20T21:26:00Z'),
  ('VHL-008', '06 LGT 008', 'Truck', 2800, 'IDLE', NULL, 39.9301, 32.8602, '2026-05-20T21:10:00Z');

INSERT INTO deliveries
  (id, tracking_number, vehicle_id, driver_id, warehouse_id, region, status, priority,
   estimated_delivery_time, actual_delivery_time, delay_minutes, last_updated_at)
VALUES
  ('DLV-5001', 'TRK-2026-5001', 'VHL-001', 'DRV-001', 'WH-ANK-01', 'Ankara-Cankaya', 'IN_TRANSIT', 'NORMAL', '2026-05-20T22:00:00Z', NULL, 0, '2026-05-20T21:15:00Z'),
  ('DLV-5002', 'TRK-2026-5002', 'VHL-002', 'DRV-002', 'WH-IST-01', 'Istanbul-Kadikoy', 'DELAYED', 'HIGH', '2026-05-20T21:00:00Z', NULL, 19, '2026-05-20T21:19:00Z'),
  ('DLV-5003', 'TRK-2026-5003', 'VHL-003', 'DRV-003', 'WH-IST-01', 'Istanbul-Sisli', 'DELIVERED', 'NORMAL', '2026-05-20T20:30:00Z', '2026-05-20T20:24:00Z', 0, '2026-05-20T20:24:00Z'),
  ('DLV-5004', 'TRK-2026-5004', 'VHL-004', 'DRV-004', 'WH-ANK-01', 'Bursa-Nilufer', 'ASSIGNED', 'LOW', '2026-05-20T23:10:00Z', NULL, 0, '2026-05-20T21:03:00Z'),
  ('DLV-5005', 'TRK-2026-5005', 'VHL-007', 'DRV-005', 'WH-IST-01', 'Izmir-Konak', 'IN_TRANSIT', 'URGENT', '2026-05-20T21:45:00Z', NULL, 0, '2026-05-20T21:22:00Z'),
  ('DLV-5006', 'TRK-2026-5006', 'VHL-001', 'DRV-001', 'WH-ANK-01', 'Ankara-Cankaya', 'CREATED', 'NORMAL', '2026-05-21T08:30:00Z', NULL, 0, '2026-05-20T20:58:00Z'),
  ('DLV-5007', 'TRK-2026-5007', 'VHL-002', 'DRV-002', 'WH-IST-01', 'Istanbul-Kadikoy', 'DELAYED', 'URGENT', '2026-05-20T20:55:00Z', NULL, 31, '2026-05-20T21:26:00Z'),
  ('DLV-5008', 'TRK-2026-5008', 'VHL-003', 'DRV-003', 'WH-ANK-01', 'Ankara-Cankaya', 'DELIVERED', 'LOW', '2026-05-20T19:20:00Z', '2026-05-20T19:18:00Z', 0, '2026-05-20T19:18:00Z'),
  ('DLV-5009', 'TRK-2026-5009', 'VHL-004', 'DRV-004', 'WH-IST-01', 'Istanbul-Sisli', 'IN_TRANSIT', 'HIGH', '2026-05-20T22:15:00Z', NULL, 0, '2026-05-20T21:12:00Z'),
  ('DLV-5010', 'TRK-2026-5010', 'VHL-007', 'DRV-005', 'WH-ANK-01', 'Bursa-Nilufer', 'CANCELLED', 'NORMAL', '2026-05-20T21:40:00Z', NULL, 0, '2026-05-20T20:30:00Z'),
  ('DLV-5011', 'TRK-2026-5011', 'VHL-001', 'DRV-001', 'WH-ANK-01', 'Ankara-Cankaya', 'DELIVERED', 'HIGH', '2026-05-20T18:30:00Z', '2026-05-20T18:35:00Z', 5, '2026-05-20T18:35:00Z'),
  ('DLV-5012', 'TRK-2026-5012', 'VHL-002', 'DRV-002', 'WH-IST-01', 'Istanbul-Kadikoy', 'IN_TRANSIT', 'NORMAL', '2026-05-20T22:40:00Z', NULL, 0, '2026-05-20T21:18:00Z'),
  ('DLV-5013', 'TRK-2026-5013', 'VHL-003', 'DRV-003', 'WH-IST-01', 'Izmir-Konak', 'ASSIGNED', 'LOW', '2026-05-21T09:00:00Z', NULL, 0, '2026-05-20T20:42:00Z'),
  ('DLV-5014', 'TRK-2026-5014', 'VHL-004', 'DRV-004', 'WH-ANK-01', 'Bursa-Nilufer', 'DELAYED', 'HIGH', '2026-05-20T21:10:00Z', NULL, 16, '2026-05-20T21:26:00Z'),
  ('DLV-5015', 'TRK-2026-5015', 'VHL-007', 'DRV-005', 'WH-IST-01', 'Istanbul-Sisli', 'DELIVERED', 'NORMAL', '2026-05-20T20:00:00Z', '2026-05-20T19:52:00Z', 0, '2026-05-20T19:52:00Z'),
  ('DLV-5016', 'TRK-2026-5016', 'VHL-001', 'DRV-001', 'WH-ANK-01', 'Ankara-Cankaya', 'CREATED', 'NORMAL', '2026-05-21T10:00:00Z', NULL, 0, '2026-05-20T21:01:00Z'),
  ('DLV-5017', 'TRK-2026-5017', 'VHL-002', 'DRV-002', 'WH-IST-01', 'Istanbul-Kadikoy', 'DELIVERED', 'HIGH', '2026-05-20T18:10:00Z', '2026-05-20T18:08:00Z', 0, '2026-05-20T18:08:00Z'),
  ('DLV-5018', 'TRK-2026-5018', 'VHL-003', 'DRV-003', 'WH-ANK-01', 'Izmir-Konak', 'IN_TRANSIT', 'URGENT', '2026-05-20T22:05:00Z', NULL, 0, '2026-05-20T21:24:00Z'),
  ('DLV-5019', 'TRK-2026-5019', 'VHL-004', 'DRV-004', 'WH-IST-01', 'Istanbul-Sisli', 'ASSIGNED', 'NORMAL', '2026-05-21T08:00:00Z', NULL, 0, '2026-05-20T20:36:00Z'),
  ('DLV-5020', 'TRK-2026-5020', 'VHL-007', 'DRV-005', 'WH-ANK-01', 'Bursa-Nilufer', 'DELAYED', 'HIGH', '2026-05-20T21:05:00Z', NULL, 22, '2026-05-20T21:27:00Z'),
  ('DLV-5021', 'TRK-2026-5021', 'VHL-001', 'DRV-001', 'WH-ANK-01', 'Ankara-Cankaya', 'DELIVERED', 'LOW', '2026-05-20T17:30:00Z', '2026-05-20T17:25:00Z', 0, '2026-05-20T17:25:00Z'),
  ('DLV-5022', 'TRK-2026-5022', 'VHL-002', 'DRV-002', 'WH-IST-01', 'Istanbul-Kadikoy', 'IN_TRANSIT', 'NORMAL', '2026-05-20T23:00:00Z', NULL, 0, '2026-05-20T21:16:00Z'),
  ('DLV-5023', 'TRK-2026-5023', 'VHL-003', 'DRV-003', 'WH-IST-01', 'Izmir-Konak', 'CREATED', 'NORMAL', '2026-05-21T11:15:00Z', NULL, 0, '2026-05-20T20:12:00Z'),
  ('DLV-5024', 'TRK-2026-5024', 'VHL-004', 'DRV-004', 'WH-ANK-01', 'Bursa-Nilufer', 'DELIVERED', 'NORMAL', '2026-05-20T16:40:00Z', '2026-05-20T16:47:00Z', 7, '2026-05-20T16:47:00Z'),
  ('DLV-5025', 'TRK-2026-5025', 'VHL-007', 'DRV-005', 'WH-IST-01', 'Istanbul-Sisli', 'IN_TRANSIT', 'HIGH', '2026-05-20T22:25:00Z', NULL, 0, '2026-05-20T21:21:00Z');

INSERT INTO alerts
  (id, alert_type, severity, status, message, delivery_id, vehicle_id, region, created_at, resolved_at)
VALUES
  ('ALT-9001', 'DELIVERY_DELAY', 'HIGH', 'UNRESOLVED', 'Delivery DLV-5002 is delayed by 19 minutes.', 'DLV-5002', 'VHL-002', 'Istanbul-Kadikoy', '2026-05-20T21:19:00Z', NULL),
  ('ALT-9002', 'DELIVERY_DELAY', 'CRITICAL', 'UNRESOLVED', 'Delivery DLV-5007 is delayed by 31 minutes.', 'DLV-5007', 'VHL-002', 'Istanbul-Kadikoy', '2026-05-20T21:26:00Z', NULL),
  ('ALT-9003', 'VEHICLE_OFFLINE', 'CRITICAL', 'UNRESOLVED', 'Vehicle VHL-006 has not reported location for 45 minutes.', NULL, 'VHL-006', 'Istanbul-Sisli', '2026-05-20T21:20:00Z', NULL),
  ('ALT-9004', 'DELIVERY_DELAY', 'MEDIUM', 'UNRESOLVED', 'Delivery DLV-5014 is delayed by 16 minutes.', 'DLV-5014', 'VHL-004', 'Bursa-Nilufer', '2026-05-20T21:26:00Z', NULL),
  ('ALT-9005', 'DELIVERY_DELAY', 'HIGH', 'UNRESOLVED', 'Delivery DLV-5020 is delayed by 22 minutes.', 'DLV-5020', 'VHL-007', 'Bursa-Nilufer', '2026-05-20T21:27:00Z', NULL),
  ('ALT-9006', 'ROUTE_UPDATED', 'LOW', 'UNRESOLVED', 'Route updated for DLV-5018 due to traffic density.', 'DLV-5018', 'VHL-003', 'Izmir-Konak', '2026-05-20T21:24:00Z', NULL),
  ('ALT-9007', 'MAINTENANCE_REQUIRED', 'MEDIUM', 'RESOLVED', 'Vehicle VHL-005 maintenance window confirmed.', NULL, 'VHL-005', 'Ankara-Cankaya', '2026-05-20T19:00:00Z', '2026-05-20T19:30:00Z'),
  ('ALT-9008', 'DELIVERY_DELAY', 'LOW', 'RESOLVED', 'Delivery DLV-5011 arrived 5 minutes late.', 'DLV-5011', 'VHL-001', 'Ankara-Cankaya', '2026-05-20T18:35:00Z', '2026-05-20T18:45:00Z');

INSERT INTO vehicle_location_events
  (vehicle_id, latitude, longitude, speed, fuel_level, event_time)
VALUES
  ('VHL-001', 39.9212, 32.8539, 42, 78, '2026-05-20T21:25:00Z'),
  ('VHL-002', 40.9901, 29.0302, 34, 61, '2026-05-20T21:24:00Z'),
  ('VHL-003', 38.4192, 27.1287, 0, 55, '2026-05-20T21:20:00Z'),
  ('VHL-004', 40.1826, 29.0665, 51, 69, '2026-05-20T21:23:00Z'),
  ('VHL-007', 38.4310, 27.1400, 47, 74, '2026-05-20T21:26:00Z');

INSERT INTO delivery_events
  (delivery_id, event_type, old_status, new_status, event_time)
VALUES
  ('DLV-5002', 'delivery.delayed', 'IN_TRANSIT', 'DELAYED', '2026-05-20T21:19:00Z'),
  ('DLV-5007', 'delivery.delayed', 'IN_TRANSIT', 'DELAYED', '2026-05-20T21:26:00Z'),
  ('DLV-5014', 'delivery.delayed', 'IN_TRANSIT', 'DELAYED', '2026-05-20T21:26:00Z'),
  ('DLV-5020', 'delivery.delayed', 'IN_TRANSIT', 'DELAYED', '2026-05-20T21:27:00Z'),
  ('DLV-5017', 'delivery.status.changed', 'IN_TRANSIT', 'DELIVERED', '2026-05-20T18:08:00Z');
