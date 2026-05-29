package com.logitrack.backendapi.repository;

import com.logitrack.backendapi.entity.Delivery;
import com.logitrack.backendapi.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface DeliveryRepository
    extends JpaRepository<Delivery, String>, JpaSpecificationExecutor<Delivery> {

  long countByStatus(DeliveryStatus status);

  long countByStatusIn(Collection<DeliveryStatus> statuses);

  List<Delivery> findTop5ByStatusOrderByLastUpdatedAtDesc(DeliveryStatus status);

  List<Delivery> findByStatusIn(Collection<DeliveryStatus> statuses);

  @Query(value = "SELECT COUNT(*) FROM historical_deliveries", nativeQuery = true)
  long countHistoricalDeliveries();

  @Query(value = """
      SELECT
        COUNT(*) AS totalDeliveries,
        COUNT(*) FILTER (WHERE d.delay_minutes > 0) AS delayedDeliveries,
        COALESCE(AVG(NULLIF(d.delay_minutes, 0)), 0) AS averageDelayMinutes
      FROM historical_deliveries d
      WHERE CAST(d.last_updated_at AS date) >= COALESCE(CAST(:fromDate AS date), CAST(d.last_updated_at AS date))
        AND CAST(d.last_updated_at AS date) <= COALESCE(CAST(:toDate AS date), CAST(d.last_updated_at AS date))
        AND LOWER(d.region) LIKE CONCAT(LOWER(COALESCE(CAST(:region AS text), d.region)), '%')
      """, nativeQuery = true)
  AnalyticsSummaryProjection getAnalyticsSummary(
      @Param("fromDate") LocalDate fromDate,
      @Param("toDate") LocalDate toDate,
      @Param("region") String region
  );

  @Query(value = """
      SELECT
        CAST(d.last_updated_at AS date) AS date,
        COUNT(*) AS totalDeliveries,
        COUNT(*) FILTER (WHERE d.delay_minutes > 0) AS delayedDeliveries,
        COALESCE(AVG(NULLIF(d.delay_minutes, 0)), 0) AS averageDelayMinutes
      FROM historical_deliveries d
      WHERE CAST(d.last_updated_at AS date) >= COALESCE(CAST(:fromDate AS date), CAST(d.last_updated_at AS date))
        AND CAST(d.last_updated_at AS date) <= COALESCE(CAST(:toDate AS date), CAST(d.last_updated_at AS date))
        AND LOWER(d.region) LIKE CONCAT(LOWER(COALESCE(CAST(:region AS text), d.region)), '%')
      GROUP BY CAST(d.last_updated_at AS date)
      ORDER BY CAST(d.last_updated_at AS date)
      """, nativeQuery = true)
  List<DelayTrendProjection> getDelayTrend(
      @Param("fromDate") LocalDate fromDate,
      @Param("toDate") LocalDate toDate,
      @Param("region") String region
  );

  @Query(value = """
      SELECT
        d.region AS region,
        COUNT(*) AS totalDeliveries,
        COUNT(*) FILTER (WHERE d.delay_minutes > 0) AS delayedDeliveries,
        COALESCE(AVG(NULLIF(d.delay_minutes, 0)), 0) AS averageDelayMinutes
      FROM historical_deliveries d
      WHERE CAST(d.last_updated_at AS date) >= COALESCE(CAST(:fromDate AS date), CAST(d.last_updated_at AS date))
        AND CAST(d.last_updated_at AS date) <= COALESCE(CAST(:toDate AS date), CAST(d.last_updated_at AS date))
        AND LOWER(d.region) LIKE CONCAT(LOWER(COALESCE(CAST(:region AS text), d.region)), '%')
      GROUP BY d.region
      ORDER BY delayedDeliveries DESC, d.region
      """, nativeQuery = true)
  List<RegionBreakdownProjection> getRegionBreakdown(
      @Param("fromDate") LocalDate fromDate,
      @Param("toDate") LocalDate toDate,
      @Param("region") String region
  );

  @Query(value = """
      SELECT
        dr.id AS driverId,
        dr.name AS driverName,
        COUNT(*) AS totalDeliveries,
        COUNT(*) FILTER (WHERE d.delay_minutes > 0) AS delayedDeliveries,
        COALESCE(AVG(NULLIF(d.delay_minutes, 0)), 0) AS averageDelayMinutes
      FROM historical_deliveries d
      JOIN drivers dr ON dr.id = d.driver_id
      WHERE CAST(d.last_updated_at AS date) >= COALESCE(CAST(:fromDate AS date), CAST(d.last_updated_at AS date))
        AND CAST(d.last_updated_at AS date) <= COALESCE(CAST(:toDate AS date), CAST(d.last_updated_at AS date))
        AND LOWER(d.region) LIKE CONCAT(LOWER(COALESCE(CAST(:region AS text), d.region)), '%')
      GROUP BY dr.id, dr.name
      ORDER BY delayedDeliveries ASC, totalDeliveries DESC, dr.name
      """, nativeQuery = true)
  List<DriverPerformanceProjection> getDriverPerformance(
      @Param("fromDate") LocalDate fromDate,
      @Param("toDate") LocalDate toDate,
      @Param("region") String region
  );

  @Query(value = """
      SELECT
        v.id AS vehicleId,
        v.plate AS plate,
        COUNT(*) AS totalDeliveries,
        COUNT(*) FILTER (WHERE d.delay_minutes > 0) AS delayedDeliveries,
        COALESCE(AVG(NULLIF(d.delay_minutes, 0)), 0) AS averageDelayMinutes
      FROM historical_deliveries d
      JOIN vehicles v ON v.id = d.vehicle_id
      WHERE CAST(d.last_updated_at AS date) >= COALESCE(CAST(:fromDate AS date), CAST(d.last_updated_at AS date))
        AND CAST(d.last_updated_at AS date) <= COALESCE(CAST(:toDate AS date), CAST(d.last_updated_at AS date))
        AND LOWER(d.region) LIKE CONCAT(LOWER(COALESCE(CAST(:region AS text), d.region)), '%')
      GROUP BY v.id, v.plate
      ORDER BY delayedDeliveries ASC, totalDeliveries DESC, v.plate
      """, nativeQuery = true)
  List<VehiclePerformanceProjection> getVehiclePerformance(
      @Param("fromDate") LocalDate fromDate,
      @Param("toDate") LocalDate toDate,
      @Param("region") String region
  );

  interface AnalyticsSummaryProjection {
    long getTotalDeliveries();

    long getDelayedDeliveries();

    double getAverageDelayMinutes();
  }

  interface DelayTrendProjection {
    LocalDate getDate();

    long getTotalDeliveries();

    long getDelayedDeliveries();

    double getAverageDelayMinutes();
  }

  interface RegionBreakdownProjection {
    String getRegion();

    long getTotalDeliveries();

    long getDelayedDeliveries();

    double getAverageDelayMinutes();
  }

  interface DriverPerformanceProjection {
    String getDriverId();

    String getDriverName();

    long getTotalDeliveries();

    long getDelayedDeliveries();

    double getAverageDelayMinutes();
  }

  interface VehiclePerformanceProjection {
    String getVehicleId();

    String getPlate();

    long getTotalDeliveries();

    long getDelayedDeliveries();

    double getAverageDelayMinutes();
  }
}
