package com.logitrack.backendapi.dto;

public record VehiclePerformanceDto(
    String vehicleId,
    String plate,
    long totalDeliveries,
    long delayedDeliveries,
    double averageDelayMinutes,
    double onTimeRate
) {
}
