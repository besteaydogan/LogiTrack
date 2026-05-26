package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.AlertDto;
import com.logitrack.backendapi.dto.DashboardSummaryResponse;
import com.logitrack.backendapi.dto.StatusSummaryDto;
import com.logitrack.backendapi.entity.AlertStatus;
import com.logitrack.backendapi.entity.DeliveryStatus;
import com.logitrack.backendapi.entity.VehicleStatus;
import com.logitrack.backendapi.repository.AlertRepository;
import com.logitrack.backendapi.repository.DeliveryRepository;
import com.logitrack.backendapi.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

  private final DeliveryRepository deliveryRepository;
  private final VehicleRepository vehicleRepository;
  private final AlertRepository alertRepository;

  public DashboardService(
      DeliveryRepository deliveryRepository,
      VehicleRepository vehicleRepository,
      AlertRepository alertRepository
  ) {
    this.deliveryRepository = deliveryRepository;
    this.vehicleRepository = vehicleRepository;
    this.alertRepository = alertRepository;
  }

  public DashboardSummaryResponse getSummary() {
    List<DeliveryStatus> activeStatuses = List.of(
        DeliveryStatus.CREATED,
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.DELAYED
    );

    List<StatusSummaryDto> statusSummary = Arrays.stream(DeliveryStatus.values())
        .map(status -> new StatusSummaryDto(status.name(), deliveryRepository.countByStatus(status)))
        .toList();

    List<AlertDto> recentAlerts = alertRepository
        .findTop5ByStatusOrderByCreatedAtDesc(AlertStatus.UNRESOLVED)
        .stream()
        .map(AlertDto::from)
        .toList();

    return new DashboardSummaryResponse(
        deliveryRepository.count(),
        deliveryRepository.countByStatusIn(activeStatuses),
        deliveryRepository.countByStatus(DeliveryStatus.DELAYED),
        deliveryRepository.countByStatus(DeliveryStatus.DELIVERED),
        vehicleRepository.countByStatusIn(List.of(VehicleStatus.ACTIVE, VehicleStatus.IDLE)),
        alertRepository.countByStatus(AlertStatus.UNRESOLVED),
        statusSummary,
        recentAlerts
    );
  }
}
