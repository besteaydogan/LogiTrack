package com.logitrack.backendapi.dto;

public record DelayTrendDto(
    String date,
    long totalDeliveries,
    long delayedDeliveries,
    double averageDelayMinutes
) {
}
