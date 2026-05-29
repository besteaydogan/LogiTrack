# Live Simulation Plan

## Goal

LogiTrack uses Kaggle-derived reference data as the stable baseline, but operational deliveries are replayed from `deliveries.csv` as events. The CSV file is an event source, not a ready-made dashboard table.

## Event Types

The MVP produces four event types:

- `vehicle.location.updated`
- `delivery.status.changed`
- `delivery.delayed`
- `alert.created`

Each tick always moves one vehicle. Every third tick also advances a delivery status. Every fifth tick delays a delivery and creates an unresolved delivery delay alert, with an alert-only fallback if no delay candidate exists.

## Backend Flow

```text
Python simulator
-> deliveries.csv row normalization
-> Redpanda topics
-> Python stream consumer
-> PostgreSQL vehicle/delivery/alert mutation
-> POST /api/internal/live-events
-> GET /api/live/fleet publish/subscribe SSE
-> React views update event-level UI
```

Existing snapshot SSE streams remain active:

- `GET /api/live/dashboard`
- `GET /api/live/alerts`
- `GET /api/live/vehicles`

The new event stream is:

- `GET /api/live/fleet`

The stream consumer uses this internal local-demo bridge after a successful database transaction:

- `POST /api/internal/live-events`

Kafka offsets are committed after the PostgreSQL transaction succeeds. The internal SSE publish is best-effort and is not part of Kafka delivery correctness.

## CSV Replay Semantics

- Every row emits `delivery.created`.
- Every row emits deterministic `vehicle.location.updated`.
- Delayed rows emit `delivery.delayed` and `alert.created`.
- Delivered, assigned, in-transit, and cancelled rows emit `delivery.status.changed`.
- `delivery.created` is idempotent; duplicate replays do not create duplicate delivery rows and do not regress later delivery state.
- `delivery_events` is append-only in this phase, so replayed status/delay events may duplicate audit history while current state remains stable.

## Deterministic Routes

Vehicle locations are generated from `vehicle_id`, `warehouse_id`, `region`, row sequence, delivery status, and replay seed. The route starts at the warehouse coordinate, progresses toward the region center, and adds small deterministic jitter. Same CSV plus same seed produces the same coordinates.

## Affected Tables

- `vehicles`: updates `last_latitude`, `last_longitude`, `last_seen_at`, and status.
- `deliveries`: advances status or marks a delivery delayed.
- `alerts`: inserts `DELIVERY_DELAY` alerts with `UNRESOLVED` status.

## Payload Examples

Vehicle movement:

```json
{
  "eventType": "vehicle.location.updated",
  "vehicleId": "VHL-KGL-004",
  "deliveryId": "DLV-KGL-004998",
  "region": "Istanbul-Kadikoy",
  "latitude": 40.9911,
  "longitude": 29.0302,
  "status": "ACTIVE",
  "speed": 42,
  "message": "Vehicle VHL-KGL-004 location updated.",
  "timestamp": "2026-05-26T18:20:00Z"
}
```

Delay alert:

```json
{
  "eventType": "alert.created",
  "alertId": "ALT-SIM-000001",
  "deliveryId": "DLV-KGL-004998",
  "vehicleId": "VHL-KGL-004",
  "region": "Istanbul-Kadikoy",
  "delayMinutes": 23,
  "severity": "MEDIUM",
  "message": "Delivery DLV-KGL-004998 is delayed by 23 minutes.",
  "timestamp": "2026-05-26T18:21:00Z"
}
```

## Frontend Behavior

- Dashboard shows the live simulation badge and keeps KPI snapshots updated through `/api/live/dashboard`.
- Alerts keeps the existing alert snapshot stream and highlights a newly created simulation alert.
- Fleet 2D keeps marker snapshots from `/api/live/vehicles` and applies immediate marker updates from `/api/live/fleet`.
- Fleet 3D invalidates fleet, delivery, and analytics queries after event-level changes and shows alert pulses from new alerts.

## Legacy Tick Fallback

The old non-Kafka tick flow remains useful for focused backend checks:

```text
Python helper
-> POST /api/simulation/tick
-> Spring Boot SimulationService
-> PostgreSQL mutation
-> GET /api/live/fleet publish/subscribe SSE
```

The primary demo path is Redpanda, topic creation, Python producer, Python stream consumer, PostgreSQL updates, and Spring Boot SSE.
