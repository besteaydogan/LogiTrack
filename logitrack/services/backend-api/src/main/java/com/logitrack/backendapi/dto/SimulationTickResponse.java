package com.logitrack.backendapi.dto;

import java.time.OffsetDateTime;

public record SimulationTickResponse(
    String eventType,
    String vehicleId,
    String deliveryId,
    String alertId,
    String region,
    Double latitude,
    Double longitude,
    String status,
    Integer speed,
    Integer delayMinutes,
    String severity,
    String message,
    OffsetDateTime timestamp
) {
  public static SimulationTickResponse from(LiveFleetEventDto event) {
    return new SimulationTickResponse(
        event.eventType(),
        event.vehicleId(),
        event.deliveryId(),
        event.alertId(),
        event.region(),
        event.latitude(),
        event.longitude(),
        event.status(),
        event.speed(),
        event.delayMinutes(),
        event.severity(),
        event.message(),
        event.timestamp()
    );
  }
}
