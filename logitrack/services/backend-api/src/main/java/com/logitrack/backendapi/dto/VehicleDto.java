package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Vehicle;

import java.time.OffsetDateTime;

public record VehicleDto(
    String id,
    String plate,
    String type,
    Integer capacity,
    String status,
    DriverSummaryDto currentDriver,
    Double lastLatitude,
    Double lastLongitude,
    OffsetDateTime lastSeenAt
) {

  public static VehicleDto from(Vehicle vehicle) {
    return new VehicleDto(
        vehicle.getId(),
        vehicle.getPlate(),
        vehicle.getType(),
        vehicle.getCapacity(),
        vehicle.getStatus().name(),
        vehicle.getCurrentDriver() == null ? null : DriverSummaryDto.from(vehicle.getCurrentDriver()),
        vehicle.getLastLatitude(),
        vehicle.getLastLongitude(),
        vehicle.getLastSeenAt()
    );
  }
}
