# API Contract

This document defines the first frontend-facing API contract for LogiTrack Control Tower. Phase 2 can implement these shapes as typed mock JSON before the backend exists.

The contract is intentionally small. Dashboard Overview, Delivery Tracking, and Alert Center are the first priority screens.

## Conventions

- Base path: `/api`
- Response format: JSON
- Timestamps: ISO 8601 UTC strings
- Pagination is planned for list endpoints, but Phase 2 mock data can start with simple arrays.
- Kafka topic contracts are not finalized in Phase 1.

## Priority Endpoints

### `GET /api/health`

Returns backend health.

Example response:

```json
{
  "status": "UP",
  "service": "backend-api"
}
```

### `GET /api/dashboard/summary`

Returns KPI values and compact dashboard summaries.

Example response:

```json
{
  "totalDeliveries": 128,
  "activeDeliveries": 46,
  "delayedDeliveries": 9,
  "completedDeliveries": 73,
  "activeVehicles": 32,
  "activeAlerts": 6,
  "statusSummary": [
    {
      "status": "CREATED",
      "count": 12
    },
    {
      "status": "IN_TRANSIT",
      "count": 34
    },
    {
      "status": "DELAYED",
      "count": 9
    },
    {
      "status": "DELIVERED",
      "count": 73
    }
  ],
  "recentAlerts": [
    {
      "id": "ALT-9001",
      "severity": "HIGH",
      "alertType": "DELIVERY_DELAY",
      "message": "Delivery DLV-5018 is delayed by 17 minutes.",
      "deliveryId": "DLV-5018",
      "vehicleId": "VHL-018",
      "createdAt": "2026-05-20T21:15:30Z",
      "resolvedAt": null
    }
  ]
}
```

### `GET /api/deliveries`

Returns deliveries for the Delivery Tracking screen.

Planned query parameters:

- `status`
- `region`
- `priority`
- `page`
- `pageSize`

Example response:

```json
{
  "items": [
    {
      "id": "DLV-5018",
      "trackingNumber": "TRK-2026-5018",
      "status": "DELAYED",
      "priority": "HIGH",
      "region": "Ankara-Cankaya",
      "vehicle": {
        "id": "VHL-018",
        "plate": "06 LGT 018"
      },
      "driver": {
        "id": "DRV-044",
        "name": "Ayse Demir"
      },
      "warehouse": {
        "id": "WH-ANK-01",
        "name": "Ankara Main Hub"
      },
      "estimatedDeliveryTime": "2026-05-20T21:00:00Z",
      "actualDeliveryTime": null,
      "delayMinutes": 17,
      "lastUpdatedAt": "2026-05-20T21:17:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 128,
  "totalPages": 13
}
```

### `GET /api/alerts`

Returns alerts for the Alert Center.

Planned query parameters:

- `severity`
- `resolved`
- `alertType`
- `page`
- `pageSize`

Example response:

```json
{
  "items": [
    {
      "id": "ALT-9001",
      "alertType": "DELIVERY_DELAY",
      "severity": "HIGH",
      "message": "Delivery DLV-5018 is delayed by 17 minutes.",
      "deliveryId": "DLV-5018",
      "vehicleId": "VHL-018",
      "region": "Ankara-Cankaya",
      "createdAt": "2026-05-20T21:15:30Z",
      "resolvedAt": null
    },
    {
      "id": "ALT-9002",
      "alertType": "VEHICLE_OFFLINE",
      "severity": "CRITICAL",
      "message": "Vehicle VHL-027 has not reported location for 12 minutes.",
      "deliveryId": null,
      "vehicleId": "VHL-027",
      "region": "Istanbul-Kadikoy",
      "createdAt": "2026-05-20T21:19:00Z",
      "resolvedAt": null
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 6,
  "totalPages": 1
}
```

List endpoints use `page=1`, `pageSize=10`, and max `pageSize=100` by default.

## Second-Wave Endpoints

These endpoints are planned after the first three screens are usable.

### `GET /api/vehicles`

Supports Fleet Map and vehicle status views.

Planned query parameters:

- `status`
- `region`
- `page`
- `pageSize`

Example item shape:

```json
{
  "id": "VHL-001",
  "plate": "06 LGT 001",
  "type": "Box Truck",
  "capacity": 1200,
  "status": "ACTIVE",
  "currentDriver": {
    "id": "DRV-001",
    "name": "Ayse Demir"
  },
  "lastLatitude": 39.9334,
  "lastLongitude": 32.8597,
  "lastSeenAt": "2026-05-25T12:00:00Z"
}
```

### `GET /api/vehicles/{id}`

Supports the Fleet Vehicle Detail route at `/fleet/vehicles/:id`. The response uses the same vehicle shape as the list item.

### `GET /api/live/vehicles`

Streams live Fleet Map snapshots as Server-Sent Events. Each event uses the same paginated response shape as `GET /api/vehicles`.

The stream is backed by PostgreSQL vehicle rows. Simulator `vehicle.location.updated` events are persisted by the stream consumer, then the backend emits the latest vehicle snapshots over SSE. Frontend markers throttle and batch these events before updating the map cache.

Example event data:

```json
{
  "items": [
    {
      "id": "VHL-001",
      "plate": "06 LGT 001",
      "type": "Box Truck",
      "capacity": 1200,
      "status": "ACTIVE",
      "currentDriver": {
        "id": "DRV-001",
        "name": "Ayse Demir"
      },
      "lastLatitude": 39.9334,
      "lastLongitude": 32.8597,
      "lastSeenAt": "2026-05-25T12:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalItems": 1,
  "totalPages": 1
}
```

### `GET /api/metrics/history`

Supports later analytics charts.

Planned query parameters:

- `from`
- `to`
- `region`
- `metric`

### `GET /api/analytics/summary`

Returns Phase 5 historical analytics from backend aggregation queries.

Planned query parameters:

- `from`
- `to`
- `region`

Example response:

```json
{
  "summary": {
    "totalDeliveries": 120,
    "delayedDeliveries": 18,
    "averageDelayMinutes": 14.6,
    "onTimeRate": 85.0
  },
  "delayTrend": [
    {
      "date": "2026-05-20",
      "totalDeliveries": 30,
      "delayedDeliveries": 5,
      "averageDelayMinutes": 12.4
    }
  ],
  "regionBreakdown": [
    {
      "region": "Ankara-Cankaya",
      "totalDeliveries": 40,
      "delayedDeliveries": 8,
      "averageDelayMinutes": 16.2,
      "delayRate": 20.0
    }
  ],
  "driverPerformance": [
    {
      "driverId": "DRV-001",
      "driverName": "Ayse Demir",
      "totalDeliveries": 32,
      "delayedDeliveries": 3,
      "averageDelayMinutes": 8.5,
      "onTimeRate": 90.6
    }
  ],
  "vehiclePerformance": [
    {
      "vehicleId": "VHL-101",
      "plate": "06 ABC 123",
      "totalDeliveries": 28,
      "delayedDeliveries": 4,
      "averageDelayMinutes": 11.3,
      "onTimeRate": 85.7
    }
  ]
}
```

### `POST /graphql`

Phase 11 adds a Spring GraphQL analytics query while keeping the REST analytics endpoint active.

Query:

```graphql
query DeliveryAnalytics($from: String, $to: String, $region: String) {
  deliveryAnalytics(from: $from, to: $to, region: $region) {
    summary {
      totalDeliveries
      delayedDeliveries
      averageDelayMinutes
      onTimeRate
    }
    delayTrend {
      date
      totalDeliveries
      delayedDeliveries
      averageDelayMinutes
    }
    regionBreakdown {
      region
      totalDeliveries
      delayedDeliveries
      averageDelayMinutes
      delayRate
    }
    driverPerformance {
      driverId
      driverName
      totalDeliveries
      delayedDeliveries
      averageDelayMinutes
      onTimeRate
    }
    vehiclePerformance {
      vehicleId
      plate
      totalDeliveries
      delayedDeliveries
      averageDelayMinutes
      onTimeRate
    }
  }
}
```

The Analytics remote consumes this query for the Plotly delay trend, D3 region heatmap, driver/vehicle performance tables, and route efficiency dashboard.

## Live Update Event Shapes

Phase 2 can simulate these through SSE or WebSocket messages. Kafka transport details are intentionally deferred.

### Vehicle Location Update

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

### Delivery Status Changed

```json
{
  "eventType": "delivery.status.changed",
  "deliveryId": "DLV-5012",
  "oldStatus": "IN_TRANSIT",
  "newStatus": "DELIVERED",
  "timestamp": "2026-05-20T21:12:00Z"
}
```

### Delivery Delayed

```json
{
  "eventType": "delivery.delayed",
  "deliveryId": "DLV-5018",
  "vehicleId": "VHL-018",
  "region": "Ankara-Cankaya",
  "delayMinutes": 17,
  "severity": "HIGH",
  "timestamp": "2026-05-20T21:15:00Z"
}
```

### Alert Created

```json
{
  "eventType": "alert.created",
  "alertId": "ALT-9001",
  "deliveryId": "DLV-5018",
  "vehicleId": "VHL-018",
  "alertType": "DELIVERY_DELAY",
  "severity": "HIGH",
  "message": "Delivery DLV-5018 is delayed by 17 minutes.",
  "timestamp": "2026-05-20T21:15:30Z"
}
```

## Frontend Mock Data Guidance

Phase 2 mock data should follow these response shapes closely. That will make the later backend integration mostly a data-source change instead of a UI rewrite.

Recommended first mock files when Phase 2 starts:

- `dashboardSummary`
- `deliveries`
- `alerts`

Vehicles can be added when Fleet Map becomes active.
