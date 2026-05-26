package com.logitrack.backendapi.dto;

public record DriverPerformanceDto(
    String driverId,
    String driverName,
    long totalDeliveries,
    long delayedDeliveries,
    double averageDelayMinutes,
    double onTimeRate
) {
}
