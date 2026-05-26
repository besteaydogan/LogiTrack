package com.logitrack.backendapi.dto;

import java.util.List;

public record AnalyticsSummaryResponse(
    AnalyticsSummaryMetricsDto summary,
    List<DelayTrendDto> delayTrend,
    List<RegionBreakdownDto> regionBreakdown,
    List<DriverPerformanceDto> driverPerformance,
    List<VehiclePerformanceDto> vehiclePerformance
) {
}
