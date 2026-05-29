package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.LiveFleetEventDto;
import com.logitrack.backendapi.dto.SimulationTickResponse;
import com.logitrack.backendapi.entity.Alert;
import com.logitrack.backendapi.entity.AlertSeverity;
import com.logitrack.backendapi.entity.AlertStatus;
import com.logitrack.backendapi.entity.Delivery;
import com.logitrack.backendapi.entity.DeliveryStatus;
import com.logitrack.backendapi.entity.Vehicle;
import com.logitrack.backendapi.entity.VehicleStatus;
import com.logitrack.backendapi.repository.AlertRepository;
import com.logitrack.backendapi.repository.DeliveryRepository;
import com.logitrack.backendapi.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class SimulationService {

  private static final String VEHICLE_LOCATION_UPDATED = "vehicle.location.updated";
  private static final String DELIVERY_STATUS_CHANGED = "delivery.status.changed";
  private static final String DELIVERY_DELAYED = "delivery.delayed";
  private static final String ALERT_CREATED = "alert.created";
  private static final String SIM_ALERT_PREFIX = "ALT-SIM-";

  private final AlertRepository alertRepository;
  private final DeliveryRepository deliveryRepository;
  private final LiveFleetEventPublisher liveFleetEventPublisher;
  private final Random random = new Random(42);
  private final AtomicLong tickCounter = new AtomicLong();
  private final VehicleRepository vehicleRepository;

  public SimulationService(
      AlertRepository alertRepository,
      DeliveryRepository deliveryRepository,
      LiveFleetEventPublisher liveFleetEventPublisher,
      VehicleRepository vehicleRepository
  ) {
    this.alertRepository = alertRepository;
    this.deliveryRepository = deliveryRepository;
    this.liveFleetEventPublisher = liveFleetEventPublisher;
    this.vehicleRepository = vehicleRepository;
  }

  @Transactional
  public synchronized SimulationTickResponse tick() {
    long tick = tickCounter.incrementAndGet();
    OffsetDateTime timestamp = OffsetDateTime.now();
    Vehicle vehicle = selectVehicle();
    Delivery delivery = selectAnyActiveDelivery();
    LiveFleetEventDto vehicleEvent = updateVehicle(vehicle, delivery, timestamp);
    liveFleetEventPublisher.publish(vehicleEvent);

    LiveFleetEventDto primaryEvent = vehicleEvent;

    if (tick % 5 == 0) {
      Delivery delayedDelivery = selectDelayCandidate();
      primaryEvent = delayedDelivery == null
          ? createAlertOnlyEvent(vehicle, delivery, timestamp)
          : delayDelivery(delayedDelivery, timestamp);
    } else if (tick % 3 == 0) {
      Delivery statusDelivery = selectStatusCandidate();
      if (statusDelivery != null) {
        primaryEvent = advanceDelivery(statusDelivery, timestamp);
      }
    }

    if (!primaryEvent.eventType().equals(VEHICLE_LOCATION_UPDATED)) {
      liveFleetEventPublisher.publish(primaryEvent);
    }

    return SimulationTickResponse.from(primaryEvent);
  }

  private Vehicle selectVehicle() {
    List<Vehicle> candidates = new ArrayList<>(vehicleRepository.findByStatusIn(List.of(VehicleStatus.ACTIVE, VehicleStatus.IDLE)));
    if (candidates.isEmpty()) {
      candidates = new ArrayList<>(vehicleRepository.findAll());
    }

    if (candidates.isEmpty()) {
      throw new IllegalStateException("Simulation requires at least one vehicle.");
    }

    candidates.sort(Comparator.comparing(Vehicle::getId));
    return candidates.get(random.nextInt(candidates.size()));
  }

  private Delivery selectAnyActiveDelivery() {
    List<Delivery> deliveries = new ArrayList<>(deliveryRepository.findByStatusIn(List.of(
        DeliveryStatus.CREATED,
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.DELAYED
    )));
    deliveries.sort(Comparator.comparing(Delivery::getLastUpdatedAt).thenComparing(Delivery::getId));
    return deliveries.isEmpty() ? null : deliveries.get(random.nextInt(deliveries.size()));
  }

  private Delivery selectStatusCandidate() {
    List<Delivery> deliveries = new ArrayList<>(deliveryRepository.findByStatusIn(List.of(
        DeliveryStatus.CREATED,
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.IN_TRANSIT
    )));
    deliveries.sort(Comparator.comparing(Delivery::getLastUpdatedAt).thenComparing(Delivery::getId));
    return deliveries.isEmpty() ? null : deliveries.get(random.nextInt(deliveries.size()));
  }

  private Delivery selectDelayCandidate() {
    List<Delivery> deliveries = new ArrayList<>(deliveryRepository.findByStatusIn(List.of(
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.IN_TRANSIT
    )));
    deliveries.sort(Comparator.comparing(Delivery::getLastUpdatedAt).thenComparing(Delivery::getId));
    return deliveries.isEmpty() ? null : deliveries.get(random.nextInt(deliveries.size()));
  }

  private LiveFleetEventDto updateVehicle(Vehicle vehicle, Delivery delivery, OffsetDateTime timestamp) {
    double latitude = boundedCoordinate(defaultLatitude(vehicle), randomOffset(), 35.0, 43.0);
    double longitude = boundedCoordinate(defaultLongitude(vehicle), randomOffset(), 25.0, 45.0);
    vehicle.updateSimulationLocation(latitude, longitude, timestamp, VehicleStatus.ACTIVE);

    String region = delivery == null ? "Operations" : delivery.getRegion();
    String message = "Vehicle " + vehicle.getId() + " location updated.";

    return new LiveFleetEventDto(
        VEHICLE_LOCATION_UPDATED,
        vehicle.getId(),
        delivery == null ? null : delivery.getId(),
        null,
        region,
        latitude,
        longitude,
        vehicle.getStatus().name(),
        25 + random.nextInt(56),
        null,
        null,
        message,
        timestamp,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );
  }

  private LiveFleetEventDto advanceDelivery(Delivery delivery, OffsetDateTime timestamp) {
    DeliveryStatus nextStatus = nextStatus(delivery.getStatus());
    delivery.updateSimulationStatus(nextStatus, timestamp);

    String message = "Delivery " + delivery.getId() + " status changed to " + nextStatus.name() + ".";
    return new LiveFleetEventDto(
        DELIVERY_STATUS_CHANGED,
        delivery.getVehicle().getId(),
        delivery.getId(),
        null,
        delivery.getRegion(),
        delivery.getVehicle().getLastLatitude(),
        delivery.getVehicle().getLastLongitude(),
        nextStatus.name(),
        null,
        delivery.getDelayMinutes(),
        null,
        message,
        timestamp,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );
  }

  private LiveFleetEventDto delayDelivery(Delivery delivery, OffsetDateTime timestamp) {
    int delayMinutes = 5 + random.nextInt(40);
    AlertSeverity severity = severityForDelay(delayMinutes);
    delivery.markSimulationDelayed(delayMinutes, timestamp);

    String message = "Delivery " + delivery.getId() + " is delayed by " + delayMinutes + " minutes.";
    LiveFleetEventDto delayedEvent = new LiveFleetEventDto(
        DELIVERY_DELAYED,
        delivery.getVehicle().getId(),
        delivery.getId(),
        null,
        delivery.getRegion(),
        delivery.getVehicle().getLastLatitude(),
        delivery.getVehicle().getLastLongitude(),
        DeliveryStatus.DELAYED.name(),
        null,
        delayMinutes,
        severity.name(),
        message,
        timestamp,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );
    liveFleetEventPublisher.publish(delayedEvent);

    Alert alert = createSimulationAlert(delivery, delivery.getVehicle(), delivery.getRegion(), severity, message, timestamp);
    return alertCreatedEvent(alert, delivery, delayMinutes, timestamp);
  }

  private LiveFleetEventDto createAlertOnlyEvent(Vehicle vehicle, Delivery delivery, OffsetDateTime timestamp) {
    String region = delivery == null ? "Operations" : delivery.getRegion();
    String message = "Operations alert generated for " + vehicle.getId() + ".";
    Alert alert = createSimulationAlert(delivery, vehicle, region, AlertSeverity.LOW, message, timestamp);
    return alertCreatedEvent(alert, delivery, null, timestamp);
  }

  private Alert createSimulationAlert(
      Delivery delivery,
      Vehicle vehicle,
      String region,
      AlertSeverity severity,
      String message,
      OffsetDateTime timestamp
  ) {
    Alert alert = new Alert(
        nextAlertId(),
        "DELIVERY_DELAY",
        severity,
        AlertStatus.UNRESOLVED,
        message,
        delivery,
        vehicle,
        region,
        timestamp
    );
    return alertRepository.save(alert);
  }

  private LiveFleetEventDto alertCreatedEvent(Alert alert, Delivery delivery, Integer delayMinutes, OffsetDateTime timestamp) {
    return new LiveFleetEventDto(
        ALERT_CREATED,
        alert.getVehicle() == null ? null : alert.getVehicle().getId(),
        delivery == null ? null : delivery.getId(),
        alert.getId(),
        alert.getRegion(),
        alert.getVehicle() == null ? null : alert.getVehicle().getLastLatitude(),
        alert.getVehicle() == null ? null : alert.getVehicle().getLastLongitude(),
        null,
        null,
        delayMinutes,
        alert.getSeverity().name(),
        alert.getMessage(),
        timestamp,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );
  }

  private String nextAlertId() {
    long sequence = alertRepository.countByIdStartingWith(SIM_ALERT_PREFIX) + 1;
    String id = SIM_ALERT_PREFIX + String.format("%06d", sequence);

    while (alertRepository.existsById(id)) {
      sequence += 1;
      id = SIM_ALERT_PREFIX + String.format("%06d", sequence);
    }

    return id;
  }

  private DeliveryStatus nextStatus(DeliveryStatus status) {
    return switch (status) {
      case CREATED -> DeliveryStatus.ASSIGNED;
      case ASSIGNED -> DeliveryStatus.IN_TRANSIT;
      case IN_TRANSIT -> DeliveryStatus.DELIVERED;
      case DELAYED, DELIVERED, CANCELLED -> status;
    };
  }

  private AlertSeverity severityForDelay(int delayMinutes) {
    if (delayMinutes >= 30) {
      return AlertSeverity.HIGH;
    }

    if (delayMinutes >= 10) {
      return AlertSeverity.MEDIUM;
    }

    return AlertSeverity.LOW;
  }

  private double randomOffset() {
    return -0.002 + (random.nextDouble() * 0.004);
  }

  private double defaultLatitude(Vehicle vehicle) {
    return vehicle.getLastLatitude() == null ? 39.9334 : vehicle.getLastLatitude();
  }

  private double defaultLongitude(Vehicle vehicle) {
    return vehicle.getLastLongitude() == null ? 32.8597 : vehicle.getLastLongitude();
  }

  private double boundedCoordinate(double coordinate, double offset, double min, double max) {
    return Math.max(min, Math.min(max, coordinate + offset));
  }
}
