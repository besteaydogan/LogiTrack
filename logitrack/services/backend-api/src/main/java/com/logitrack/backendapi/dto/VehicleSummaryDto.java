package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Vehicle;

public record VehicleSummaryDto(String id, String plate) {

  public static VehicleSummaryDto from(Vehicle vehicle) {
    return new VehicleSummaryDto(vehicle.getId(), vehicle.getPlate());
  }
}
