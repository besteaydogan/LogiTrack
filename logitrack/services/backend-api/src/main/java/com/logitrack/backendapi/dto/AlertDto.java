package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Alert;

import java.time.OffsetDateTime;

public record AlertDto(
    String id,
    String alertType,
    String severity,
    String status,
    String message,
    String deliveryId,
    String vehicleId,
    String region,
    OffsetDateTime createdAt,
    OffsetDateTime resolvedAt
) {

  public static AlertDto from(Alert alert) {
    return new AlertDto(
        alert.getId(),
        alert.getAlertType(),
        alert.getSeverity().name(),
        alert.getStatus().name(),
        alert.getMessage(),
        alert.getDelivery() == null ? null : alert.getDelivery().getId(),
        alert.getVehicle() == null ? null : alert.getVehicle().getId(),
        alert.getRegion(),
        alert.getCreatedAt(),
        alert.getResolvedAt()
    );
  }
}
