package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Delivery;

import java.time.OffsetDateTime;

public record DeliveryDto(
    String id,
    String trackingNumber,
    String status,
    String priority,
    String region,
    VehicleSummaryDto vehicle,
    DriverSummaryDto driver,
    WarehouseSummaryDto warehouse,
    OffsetDateTime estimatedDeliveryTime,
    OffsetDateTime actualDeliveryTime,
    Integer delayMinutes,
    OffsetDateTime lastUpdatedAt
) {

  public static DeliveryDto from(Delivery delivery) {
    return new DeliveryDto(
        delivery.getId(),
        delivery.getTrackingNumber(),
        delivery.getStatus().name(),
        delivery.getPriority().name(),
        delivery.getRegion(),
        VehicleSummaryDto.from(delivery.getVehicle()),
        DriverSummaryDto.from(delivery.getDriver()),
        WarehouseSummaryDto.from(delivery.getWarehouse()),
        delivery.getEstimatedDeliveryTime(),
        delivery.getActualDeliveryTime(),
        delivery.getDelayMinutes(),
        delivery.getLastUpdatedAt()
    );
  }
}
