package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Warehouse;

public record WarehouseSummaryDto(String id, String name) {

  public static WarehouseSummaryDto from(Warehouse warehouse) {
    return new WarehouseSummaryDto(warehouse.getId(), warehouse.getName());
  }
}
