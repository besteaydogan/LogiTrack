# Dataset Plan

This document defines the Phase 1 data strategy for LogiTrack Control Tower. The goal is to give the frontend enough realistic data shape to begin Phase 2 without blocking on backend, Kafka, or database implementation.

## Strategy by Phase

### Phase 1-2: Mock JSON and Simulator Shape

The first working frontend should use typed mock JSON that follows the planned API contract. This keeps the project focused on building the visible dashboard first.

Phase 2 data should support:

- Dashboard KPI cards
- Delivery table rows
- Alert list items
- Status and severity filters
- Basic live-update simulation through SSE or WebSocket-shaped events

No Kafka dependency is required in Phase 1 or Phase 2.

### Phase 3+: Kafka-Backed Event Pipeline

After the frontend foundation is working, the project can introduce the real-time data pipeline:

1. Python data simulator generates logistics events.
2. Kafka topics receive event streams.
3. Stream consumer validates and persists events.
4. PostgreSQL stores operational records and event history.
5. Backend API exposes REST data and live updates.
6. Frontend consumes initial data and real-time changes.

Kafka is a later architecture layer, not a Phase 1 decision blocker.

## Current Data Lineage

The working application currently uses two concrete data sources:

- PostgreSQL seed data from `database/seed/001_seed_demo_data.sql` for the initial operational records.
- Python generated realtime events from `services/data-simulator`, consumed through Redpanda/Kafka and persisted by `services/stream-consumer`.

The project document's hybrid dataset strategy is now formalized in the official Phase 9-14 backlog:

- Phase 9 historical data: Kaggle Logistics Operations Database as primary dataset.
- Phase 10 map enrichment/live completion: advanced Fleet Map work.
- Optional performance data: NYC TLC Trip Record Data only if larger stress-test data is needed.

Kaggle, OpenStreetMap/Overpass enrichment, and NYC TLC data are not integrated into the current runtime pipeline yet. Kaggle import is scheduled as Phase 9, not a future-work placeholder.

## Candidate Historical Data Sources

The project can use a hybrid strategy because one public dataset is unlikely to cover every logistics dashboard need.

| Source | Use | Notes |
| --- | --- | --- |
| Kaggle delivery/logistics datasets | Historical deliveries, delivery status, delay analysis, sample tables | Primary candidate for portfolio-friendly data. Dataset choice can be finalized before Phase 3. |
| NYC TLC Trip Record Data | High-volume route and duration data | Optional performance dataset. Taxi trips can be modeled as delivery trips for stress testing tables and charts. |
| OpenStreetMap and Overpass API | City, region, warehouse, and delivery location context | Useful for future Fleet Map work. Not needed for the first three MVP screens. |
| Generated simulator data | Real-time vehicle, delivery, and alert events | Main source for live dashboard behavior. |

## Initial Event Types

The first event model should stay small and frontend-friendly.

### `vehicle.location.updated`

Used later by Fleet Map and vehicle status widgets.

```json
{
  "eventType": "vehicle.location.updated",
  "vehicleId": "VHL-102",
  "latitude": 39.9208,
  "longitude": 32.8541,
  "speed": 48,
  "status": "ON_DELIVERY",
  "fuelLevel": 72,
  "timestamp": "2026-05-20T21:10:00Z"
}
```

### `delivery.status.changed`

Used by Delivery Tracking and Dashboard Overview.

```json
{
  "eventType": "delivery.status.changed",
  "deliveryId": "DLV-5012",
  "oldStatus": "IN_TRANSIT",
  "newStatus": "DELIVERED",
  "timestamp": "2026-05-20T21:12:00Z"
}
```

### `delivery.delayed`

Used by Dashboard Overview, Delivery Tracking, and Alert Center.

```json
{
  "eventType": "delivery.delayed",
  "deliveryId": "DLV-5018",
  "vehicleId": "VHL-018",
  "region": "Ankara-Cankaya",
  "delayMinutes": 17,
  "severity": "WARNING",
  "timestamp": "2026-05-20T21:15:00Z"
}
```

### `alert.created`

Used by Alert Center and dashboard alert counters.

```json
{
  "eventType": "alert.created",
  "alertId": "ALT-9001",
  "deliveryId": "DLV-5018",
  "vehicleId": "VHL-018",
  "alertType": "DELIVERY_DELAY",
  "severity": "WARNING",
  "message": "Delivery DLV-5018 is delayed by 17 minutes.",
  "timestamp": "2026-05-20T21:15:30Z"
}
```

## Assumptions and Limitations

- Phase 2 can use manually created mock JSON as long as it matches `docs/api-contract.md`.
- Real-time behavior can be simulated before Kafka exists.
- Current runtime data is seed data plus simulator events; public historical and map datasets are planned but not integrated yet.
- Public datasets may need cleaning, normalization, or synthetic expansion.
- Fleet Map requires location quality that many logistics datasets may not provide directly.
- Analytics should wait until the first operational screens are usable.
- Dataset choice should support portfolio clarity more than academic completeness.
