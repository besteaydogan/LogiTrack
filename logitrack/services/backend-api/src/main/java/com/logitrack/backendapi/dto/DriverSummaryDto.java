package com.logitrack.backendapi.dto;

import com.logitrack.backendapi.entity.Driver;

public record DriverSummaryDto(String id, String name) {

  public static DriverSummaryDto from(Driver driver) {
    return new DriverSummaryDto(driver.getId(), driver.getName());
  }
}
