package com.logitrack.backendapi.dto;

import java.time.OffsetDateTime;

public record ServerMetricsMessage(
    String type,
    OffsetDateTime timestamp,
    double cpuUsagePercent,
    long memoryUsedBytes,
    long memoryMaxBytes,
    double memoryUsagePercent,
    int liveThreads,
    long uptimeSeconds,
    long sequence
) {
}
