package com.logitrack.backendapi.dto;

public record AnalyticsSummaryMetricsDto(
    long totalDeliveries,
    long delayedDeliveries,
    double averageDelayMinutes,
    double onTimeRate
) {
}
