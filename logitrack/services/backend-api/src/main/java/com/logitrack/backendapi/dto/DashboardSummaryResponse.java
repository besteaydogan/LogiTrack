package com.logitrack.backendapi.dto;

import java.util.List;

public record DashboardSummaryResponse(
    long totalDeliveries,
    long activeDeliveries,
    long delayedDeliveries,
    long completedDeliveries,
    long activeVehicles,
    long activeAlerts,
    List<StatusSummaryDto> statusSummary,
    List<AlertDto> recentAlerts
) {
}
