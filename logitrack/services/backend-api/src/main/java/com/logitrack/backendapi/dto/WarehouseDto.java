package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Warehouse;

public record WarehouseDto(
    String id,
    String name,
    String city,
    String district,
    Double latitude,
    Double longitude,
    Integer capacity
) {

  public static WarehouseDto from(Warehouse warehouse) {
    return new WarehouseDto(
        warehouse.getId(),
        warehouse.getName(),
        warehouse.getCity(),
        warehouse.getDistrict(),
        warehouse.getLatitude(),
        warehouse.getLongitude(),
        warehouse.getCapacity()
    );
  }
}
