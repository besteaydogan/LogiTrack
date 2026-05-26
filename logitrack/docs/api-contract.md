# API Contract

This document describes the current LogiTrack backend contract used by the shell and runtime remote apps. The active backend exposes REST endpoints under `/api`, Server-Sent Events endpoints for live snapshots, and a Spring GraphQL endpoint for analytics.

## Conventions

- REST base path: `/api`
- GraphQL path: `/graphql`
- Response format: JSON
- Timestamps: ISO 8601 strings
- List endpoints return `{ items, page, pageSize, totalItems, totalPages }`
- Frontend default API base URL: `http://localhost:8080`

## Error Response

REST errors use the backend `ApiErrorResponse` shape:

```json
{
  "error": "Not Found",
  "message": "Vehicle was not found.",
  "path": "/api/vehicles/VHL-404",
  "timestamp": "2026-05-26T09:30:00Z"
}
```

GraphQL errors use the standard GraphQL `errors` array:

```json
{
  "errors": [
    {
      "message": "Validation error",
      "path": ["deliveryAnalytics"]
    }
  ]
}
```

## REST Endpoints

### `GET /api/health`

Returns backend health.

```json
{
  "status": "UP",
  "service": "backend-api"
}
```

### `GET /api/dashboard/summary`

Returns dashboard KPIs, delivery status counts, and recent alerts.

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
      "status": "IN_TRANSIT",
      "count": 34
    },
    {
      "status": "DELAYED",
      "count": 9
    }
  ],
  "recentAlerts": [
    {
      "id": "ALT-9001",
      "alertType": "DELIVERY_DELAY",
      "severity": "HIGH",
      "status": "OPEN",
      "message": "Delivery DLV-5018 is delayed by 17 minutes.",
      "deliveryId": "DLV-5018",
      "vehicleId": "VHL-018",
      "region": "Ankara-Cankaya",
      "createdAt": "2026-05-20T21:15:30Z",
      "resolvedAt": null
    }
  ]
}
```

### `GET /api/deliveries`

Returns paginated deliveries for Delivery Management.

Query parameters:

- `status`
- `region`
- `priority`
- `page`
- `pageSize`

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

Returns paginated alerts for Alert Center.

Query parameters:

- `severity`
- `resolved`
- `alertType`
- `page`
- `pageSize`

```json
{
  "items": [
    {
      "id": "ALT-9001",
      "alertType": "DELIVERY_DELAY",
      "severity": "HIGH",
      "status": "OPEN",
      "message": "Delivery DLV-5018 is delayed by 17 minutes.",
      "deliveryId": "DLV-5018",
      "vehicleId": "VHL-018",
      "region": "Ankara-Cankaya",
      "createdAt": "2026-05-20T21:15:30Z",
      "resolvedAt": null
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 6,
  "totalPages": 1
}
```

### `PATCH /api/alerts/{id}/resolve`

Marks an alert as resolved and returns the updated alert.

```json
{
  "id": "ALT-9001",
  "alertType": "DELIVERY_DELAY",
  "severity": "HIGH",
  "status": "RESOLVED",
  "message": "Delivery DLV-5018 is delayed by 17 minutes.",
  "deliveryId": "DLV-5018",
  "vehicleId": "VHL-018",
  "region": "Ankara-Cankaya",
  "createdAt": "2026-05-20T21:15:30Z",
  "resolvedAt": "2026-05-26T09:30:00Z"
}
```

### `GET /api/vehicles`

Returns paginated vehicles for Fleet Map.

Query parameters:

- `status`
- `region`
- `page`
- `pageSize`

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

### `GET /api/vehicles/{id}`

Returns a single vehicle for `/fleet/vehicles/:id`.

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

### `GET /api/analytics/summary`

Returns REST analytics aggregation. This endpoint remains available for smoke checks and backwards compatibility while the Analytics remote uses GraphQL.

Query parameters:

- `from`
- `to`
- `region`

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

## SSE Endpoints

SSE endpoints emit JSON snapshot events through `EventSource`.

### `GET /api/live/dashboard`

Streams the same shape as `GET /api/dashboard/summary`.

### `GET /api/live/alerts`

Streams the same paginated alert list shape as `GET /api/alerts`.

### `GET /api/live/vehicles`

Streams the same paginated vehicle list shape as `GET /api/vehicles`.

The Fleet Map buffers vehicle snapshot events before writing to TanStack Query cache so marker movement does not trigger a render for every incoming event.

Example event payload:

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
      "lastLatitude": 39.934,
      "lastLongitude": 32.861,
      "lastSeenAt": "2026-05-26T09:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalItems": 1,
  "totalPages": 1
}
```

## GraphQL Contract

### `POST /graphql`

The Analytics remote calls `deliveryAnalytics(from, to, region)`.

Request:

```json
{
  "query": "query DeliveryAnalytics($from: String, $to: String, $region: String) { deliveryAnalytics(from: $from, to: $to, region: $region) { summary { totalDeliveries delayedDeliveries averageDelayMinutes onTimeRate } delayTrend { date totalDeliveries delayedDeliveries averageDelayMinutes } regionBreakdown { region totalDeliveries delayedDeliveries averageDelayMinutes delayRate } driverPerformance { driverId driverName totalDeliveries delayedDeliveries averageDelayMinutes onTimeRate } vehiclePerformance { vehicleId plate totalDeliveries delayedDeliveries averageDelayMinutes onTimeRate } } }",
  "variables": {
    "from": "2026-05-01",
    "to": "2026-05-25",
    "region": "Ankara"
  }
}
```

Response:

```json
{
  "data": {
    "deliveryAnalytics": {
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
  }
}
```

Smoke scenarios:

- no variables
- `region`
- `from` + `to`
- `from` + `to` + `region`
