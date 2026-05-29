package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.LiveFleetEventDto;
import com.logitrack.backendapi.dto.SimulationTickResponse;
import com.logitrack.backendapi.entity.Alert;
import com.logitrack.backendapi.entity.AlertSeverity;
import com.logitrack.backendapi.entity.AlertStatus;
import com.logitrack.backendapi.entity.Delivery;
import com.logitrack.backendapi.entity.DeliveryPriority;
import com.logitrack.backendapi.entity.DeliveryStatus;
import com.logitrack.backendapi.entity.Vehicle;
import com.logitrack.backendapi.entity.VehicleStatus;
import com.logitrack.backendapi.repository.AlertRepository;
import com.logitrack.backendapi.repository.DeliveryRepository;
import com.logitrack.backendapi.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SimulationServiceTest {

  @Mock
  private AlertRepository alertRepository;

  @Mock
  private DeliveryRepository deliveryRepository;

  @Mock
  private LiveFleetEventPublisher liveFleetEventPublisher;

  @Mock
  private VehicleRepository vehicleRepository;

  private SimulationService simulationService;
  private Delivery delivery;
  private Vehicle vehicle;

  @BeforeEach
  void setUp() {
    vehicle = vehicle("VHL-KGL-004");
    delivery = delivery("DLV-KGL-004998", DeliveryStatus.IN_TRANSIT, vehicle);
    simulationService = new SimulationService(alertRepository, deliveryRepository, liveFleetEventPublisher, vehicleRepository);
  }

  @Test
  void tickUpdatesVehicleLocationAndPublishesEvent() {
    when(vehicleRepository.findByStatusIn(any())).thenReturn(List.of(vehicle));
    when(deliveryRepository.findByStatusIn(any())).thenReturn(List.of(delivery));

    SimulationTickResponse response = simulationService.tick();

    assertThat(response.eventType()).isEqualTo("vehicle.location.updated");
    assertThat(vehicle.getLastLatitude()).isNotEqualTo(40.9903);
    assertThat(vehicle.getLastLongitude()).isNotEqualTo(29.0290);
    assertThat(vehicle.getLastSeenAt()).isNotNull();

    ArgumentCaptor<LiveFleetEventDto> eventCaptor = ArgumentCaptor.forClass(LiveFleetEventDto.class);
    verify(liveFleetEventPublisher).publish(eventCaptor.capture());
    assertThat(eventCaptor.getValue().eventType()).isEqualTo("vehicle.location.updated");
  }

  @Test
  void fifthTickDelaysDeliveryAndCreatesAlert() {
    when(vehicleRepository.findByStatusIn(any())).thenReturn(List.of(vehicle));
    when(deliveryRepository.findByStatusIn(any())).thenAnswer(invocation -> {
      Collection<?> statuses = invocation.getArgument(0);
      return statuses.size() == 2 ? List.of(delivery) : List.of();
    });
    when(alertRepository.countByIdStartingWith("ALT-SIM-")).thenReturn(0L);
    when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

    SimulationTickResponse response = null;
    for (int index = 0; index < 5; index += 1) {
      response = simulationService.tick();
    }

    assertThat(response).isNotNull();
    assertThat(response.eventType()).isEqualTo("alert.created");
    assertThat(response.alertId()).isEqualTo("ALT-SIM-000001");
    assertThat(delivery.getStatus()).isEqualTo(DeliveryStatus.DELAYED);
    assertThat(delivery.getDelayMinutes()).isGreaterThan(0);
  }

  private Vehicle vehicle(String id) {
    Vehicle nextVehicle = instantiate(Vehicle.class);
    ReflectionTestUtils.setField(nextVehicle, "id", id);
    ReflectionTestUtils.setField(nextVehicle, "plate", "34 LGT 004");
    ReflectionTestUtils.setField(nextVehicle, "type", "Van");
    ReflectionTestUtils.setField(nextVehicle, "capacity", 12);
    ReflectionTestUtils.setField(nextVehicle, "status", VehicleStatus.ACTIVE);
    ReflectionTestUtils.setField(nextVehicle, "lastLatitude", 40.9903);
    ReflectionTestUtils.setField(nextVehicle, "lastLongitude", 29.0290);
    ReflectionTestUtils.setField(nextVehicle, "lastSeenAt", OffsetDateTime.parse("2026-05-26T18:00:00Z"));
    return nextVehicle;
  }

  private Delivery delivery(String id, DeliveryStatus status, Vehicle vehicle) {
    Delivery nextDelivery = instantiate(Delivery.class);
    ReflectionTestUtils.setField(nextDelivery, "id", id);
    ReflectionTestUtils.setField(nextDelivery, "trackingNumber", "KGL-004998");
    ReflectionTestUtils.setField(nextDelivery, "vehicle", vehicle);
    ReflectionTestUtils.setField(nextDelivery, "region", "Istanbul-Kadikoy");
    ReflectionTestUtils.setField(nextDelivery, "status", status);
    ReflectionTestUtils.setField(nextDelivery, "priority", DeliveryPriority.HIGH);
    ReflectionTestUtils.setField(nextDelivery, "estimatedDeliveryTime", OffsetDateTime.parse("2026-05-26T20:00:00Z"));
    ReflectionTestUtils.setField(nextDelivery, "delayMinutes", 0);
    ReflectionTestUtils.setField(nextDelivery, "lastUpdatedAt", OffsetDateTime.parse("2026-05-26T18:00:00Z"));
    return nextDelivery;
  }

  private <T> T instantiate(Class<T> type) {
    try {
      var constructor = type.getDeclaredConstructor();
      constructor.setAccessible(true);
      return constructor.newInstance();
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Could not instantiate " + type.getSimpleName(), exception);
    }
  }
}
