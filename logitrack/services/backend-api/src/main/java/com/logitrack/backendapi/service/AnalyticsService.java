package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.AnalyticsSummaryMetricsDto;
import com.logitrack.backendapi.dto.AnalyticsSummaryResponse;
import com.logitrack.backendapi.dto.DelayTrendDto;
import com.logitrack.backendapi.dto.DriverPerformanceDto;
import com.logitrack.backendapi.dto.RegionBreakdownDto;
import com.logitrack.backendapi.dto.VehiclePerformanceDto;
import com.logitrack.backendapi.repository.DeliveryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AnalyticsService {

  private final DeliveryRepository deliveryRepository;

  public AnalyticsService(DeliveryRepository deliveryRepository) {
    this.deliveryRepository = deliveryRepository;
  }

  public AnalyticsSummaryResponse getSummary(LocalDate from, LocalDate to, String region) {
    String normalizedRegion = normalizeRegion(region);
    DeliveryRepository.AnalyticsSummaryProjection summary =
        deliveryRepository.getAnalyticsSummary(from, to, normalizedRegion);

    return new AnalyticsSummaryResponse(
        new AnalyticsSummaryMetricsDto(
            summary.getTotalDeliveries(),
            summary.getDelayedDeliveries(),
            round(summary.getAverageDelayMinutes()),
            onTimeRate(summary.getTotalDeliveries(), summary.getDelayedDeliveries())
        ),
        deliveryRepository.getDelayTrend(from, to, normalizedRegion)
            .stream()
            .map(row -> new DelayTrendDto(
                row.getDate().toString(),
                row.getTotalDeliveries(),
                row.getDelayedDeliveries(),
                round(row.getAverageDelayMinutes())
            ))
            .toList(),
        deliveryRepository.getRegionBreakdown(from, to, normalizedRegion)
            .stream()
            .map(row -> new RegionBreakdownDto(
                row.getRegion(),
                row.getTotalDeliveries(),
                row.getDelayedDeliveries(),
                round(row.getAverageDelayMinutes()),
                delayRate(row.getTotalDeliveries(), row.getDelayedDeliveries())
            ))
            .toList(),
        deliveryRepository.getDriverPerformance(from, to, normalizedRegion)
            .stream()
            .map(row -> new DriverPerformanceDto(
                row.getDriverId(),
                row.getDriverName(),
                row.getTotalDeliveries(),
                row.getDelayedDeliveries(),
                round(row.getAverageDelayMinutes()),
                onTimeRate(row.getTotalDeliveries(), row.getDelayedDeliveries())
            ))
            .toList(),
        deliveryRepository.getVehiclePerformance(from, to, normalizedRegion)
            .stream()
            .map(row -> new VehiclePerformanceDto(
                row.getVehicleId(),
                row.getPlate(),
                row.getTotalDeliveries(),
                row.getDelayedDeliveries(),
                round(row.getAverageDelayMinutes()),
                onTimeRate(row.getTotalDeliveries(), row.getDelayedDeliveries())
            ))
            .toList()
    );
  }

  private String normalizeRegion(String region) {
    return region == null || region.isBlank() ? null : region.trim();
  }

  static double onTimeRate(long totalDeliveries, long delayedDeliveries) {
    if (totalDeliveries == 0) {
      return 0;
    }

    return round(((double) (totalDeliveries - delayedDeliveries) / totalDeliveries) * 100);
  }

  static double delayRate(long totalDeliveries, long delayedDeliveries) {
    if (totalDeliveries == 0) {
      return 0;
    }

    return round(((double) delayedDeliveries / totalDeliveries) * 100);
  }

  static double round(double value) {
    return Math.round(value * 10.0) / 10.0;
  }
}
