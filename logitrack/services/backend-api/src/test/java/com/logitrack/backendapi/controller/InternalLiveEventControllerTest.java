package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.LiveFleetEventDto;
import com.logitrack.backendapi.service.LiveFleetEventPublisher;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalLiveEventController.class)
class InternalLiveEventControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private LiveFleetEventPublisher liveFleetEventPublisher;

  @Test
  void publishesLiveFleetEvent() throws Exception {
    mockMvc.perform(post("/api/internal/live-events")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "eventType": "vehicle.location.updated",
                  "vehicleId": "VHL-KGL-004",
                  "deliveryId": "DLV-KGL-004998",
                  "alertId": null,
                  "region": "Istanbul-Kadikoy",
                  "latitude": 40.9911,
                  "longitude": 29.0302,
                  "status": "ACTIVE",
                  "speed": 42,
                  "delayMinutes": null,
                  "severity": null,
                  "message": "Vehicle VHL-KGL-004 location updated.",
                  "timestamp": "2026-05-26T18:20:00Z",
                  "sequence": 2
                }
                """))
        .andExpect(status().isNoContent());

    ArgumentCaptor<LiveFleetEventDto> eventCaptor = ArgumentCaptor.forClass(LiveFleetEventDto.class);
    Mockito.verify(liveFleetEventPublisher).publish(eventCaptor.capture());

    LiveFleetEventDto event = eventCaptor.getValue();
    assertThat(event.eventType()).isEqualTo("vehicle.location.updated");
    assertThat(event.vehicleId()).isEqualTo("VHL-KGL-004");
    assertThat(event.deliveryId()).isEqualTo("DLV-KGL-004998");
    assertThat(event.latitude()).isEqualTo(40.9911);
    assertThat(event.timestamp()).isNotNull();
    assertThat(event.sequence()).isEqualTo(2);
  }
}
