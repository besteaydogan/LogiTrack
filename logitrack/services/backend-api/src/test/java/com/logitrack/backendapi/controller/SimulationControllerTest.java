package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.SimulationTickResponse;
import com.logitrack.backendapi.service.SimulationService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SimulationController.class)
class SimulationControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private SimulationService simulationService;

  @Test
  void returnsSimulationTickEvent() throws Exception {
    Mockito.when(simulationService.tick())
        .thenReturn(new SimulationTickResponse(
            "vehicle.location.updated",
            "VHL-KGL-004",
            "DLV-KGL-004998",
            null,
            "Istanbul-Kadikoy",
            40.9911,
            29.0302,
            "ACTIVE",
            42,
            null,
            null,
            "Vehicle VHL-KGL-004 location updated.",
            OffsetDateTime.parse("2026-05-26T18:20:00Z")
        ));

    mockMvc.perform(post("/api/simulation/tick"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eventType").value("vehicle.location.updated"))
        .andExpect(jsonPath("$.vehicleId").value("VHL-KGL-004"))
        .andExpect(jsonPath("$.deliveryId").value("DLV-KGL-004998"))
        .andExpect(jsonPath("$.region").value("Istanbul-Kadikoy"))
        .andExpect(jsonPath("$.latitude").value(40.9911))
        .andExpect(jsonPath("$.longitude").value(29.0302))
        .andExpect(jsonPath("$.timestamp").exists());
  }
}
