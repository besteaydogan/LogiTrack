# Wireframes

These wireframes close the Phase 1 planning gap with low-fidelity screen structure only. They do not define Figma frames, detailed UI design, colors, typography, or final component styling.

## Dashboard Overview

- Purpose: Give operations a fast summary of delivery health, active fleet state, and unresolved alerts.
- Main components: KPI card row, delivery status chart, recent alerts panel, refresh/live connection indicator in later phases.
- Data shown: Total deliveries, active deliveries, delayed deliveries, completed deliveries, active vehicles, active alerts, delivery status counts, latest unresolved alerts.
- Endpoint: `GET /api/dashboard/summary`; later live updates from `/api/live/dashboard`.
- Phase: MVP.
- Out of scope: Drill-down analytics, map markers, advanced filters, editable alert actions.

```text
+---------------------------------------------------------------+
| Dashboard Overview                         [Refresh / Live]   |
+---------------------------------------------------------------+
| Total | Active | Delayed | Completed | Vehicles | Alerts      |
+---------------------------------------------------------------+
| Delivery status summary chart     | Recent alerts             |
| CREATED / ASSIGNED / IN_TRANSIT   | severity + message + time |
| DELAYED / DELIVERED / CANCELLED   |                           |
+---------------------------------------------------------------+
```

## Delivery Tracking

- Purpose: Show the working list of deliveries that operations can scan for status, region, priority, ETA, and delays.
- Main components: Page header, delivery table, empty/error/loading states, later filters.
- Data shown: Tracking number, status, priority, region, vehicle, driver, ETA, delay minutes, last updated time.
- Endpoint: `GET /api/deliveries`.
- Phase: MVP.
- Out of scope: Sorting, pagination UI, bulk actions, route details, timeline drawer.

```text
+---------------------------------------------------------------+
| Delivery Tracking                                             |
+---------------------------------------------------------------+
| Tracking # | Status | Priority | Region | Vehicle | Driver    |
| ETA        | Delay  | Updated                                  |
+---------------------------------------------------------------+
| TRK-...    | ...    | ...      | ...    | ...     | ...       |
+---------------------------------------------------------------+
```

## Alert Center

- Purpose: Let operations review and resolve active logistics issues.
- Main components: Severity filter in live phase, alert table, resolve action, loading/error/empty states.
- Data shown: Severity, status, alert type, message, delivery, vehicle, region, created time, resolved time.
- Endpoint: `GET /api/alerts`, `PATCH /api/alerts/{id}/resolve`; later live updates from `/api/live/alerts`.
- Phase: MVP for list and resolve; severity filter is Phase 4B.
- Out of scope: Assignment workflow, comments, SLA timers, notification preferences.

```text
+---------------------------------------------------------------+
| Alert Center                          [Severity filter later] |
+---------------------------------------------------------------+
| Severity | Status | Type | Region | Related IDs | Created     |
| Message                                      | [Resolve]      |
+---------------------------------------------------------------+
```

## Fleet Map

- Purpose: Give a geographic view of vehicle positions and fleet risk once live location data exists.
- Main components: Map canvas, vehicle marker layer, side summary, vehicle detail preview.
- Data shown: Vehicle location, status, driver, last seen time, fuel/speed from event stream.
- Endpoint: `GET /api/vehicles`, `GET /api/vehicles/{id}`; later live location events.
- Phase: Later phase.
- Out of scope: Turn-by-turn routing, geofencing, route optimization, live marker throttling in the first map pass.

```text
+---------------------------------------------------------------+
| Fleet Map                                                     |
+-----------------------------------------+---------------------+
| Map with vehicle markers                | Fleet summary       |
|                                         | Selected vehicle    |
|                                         | Last seen / status  |
+-----------------------------------------+---------------------+
```

## Analytics

- Purpose: Show delivery performance trends after stable delivery and alert data exists.
- Main components: Trend chart, region analysis chart, driver/vehicle performance table, date range controls.
- Data shown: Delay trends, region delay distribution, driver performance, vehicle performance.
- Endpoint: Later `GET /api/metrics/history` plus delivery-derived analytics endpoints.
- Phase: Later phase.
- Out of scope: CSV export in first MVP, predictive analytics, configurable dashboards.

```text
+---------------------------------------------------------------+
| Analytics                                   [Date] [Region]   |
+---------------------------------------------------------------+
| Delay trend chart                                             |
+-----------------------------+---------------------------------+
| Region delay analysis       | Driver / vehicle performance    |
+-----------------------------+---------------------------------+
```
