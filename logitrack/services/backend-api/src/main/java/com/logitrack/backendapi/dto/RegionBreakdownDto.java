package com.logitrack.backendapi.dto;

public record RegionBreakdownDto(
    String region,
    long totalDeliveries,
    long delayedDeliveries,
    double averageDelayMinutes,
    double delayRate
) {
}
