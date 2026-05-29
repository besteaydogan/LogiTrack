package com.logitrack.backendapi.dto;

import java.time.OffsetDateTime;

public record LiveFleetEventDto(
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
    OffsetDateTime timestamp,
    Integer sequence,
    String simulationRunId,
    Integer processedRecords,
    Integer totalRecords,
    Integer simulationIntervalSeconds,
    String trackingNumber,
    String driverId,
    String warehouseId,
    String priority,
    OffsetDateTime estimatedDeliveryTime,
    OffsetDateTime actualDeliveryTime
) {
}
