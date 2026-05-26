package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.AnalyticsSummaryMetricsDto;
import com.logitrack.backendapi.dto.AnalyticsSummaryResponse;
import com.logitrack.backendapi.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
class AnalyticsControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private AnalyticsService analyticsService;

  @Test
  void returnsAnalyticsSummaryShape() throws Exception {
    Mockito.when(analyticsService.getSummary(isNull(), isNull(), isNull()))
        .thenReturn(new AnalyticsSummaryResponse(
            new AnalyticsSummaryMetricsDto(10, 2, 12.4, 80.0),
            List.of(),
            List.of(),
            List.of(),
            List.of()
        ));

    mockMvc.perform(get("/api/analytics/summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.summary.totalDeliveries").value(10))
        .andExpect(jsonPath("$.delayTrend").isArray())
        .andExpect(jsonPath("$.regionBreakdown").isArray())
        .andExpect(jsonPath("$.driverPerformance").isArray())
        .andExpect(jsonPath("$.vehiclePerformance").isArray());
  }

  @Test
  void forwardsFilterParameters() throws Exception {
    LocalDate from = LocalDate.of(2026, 5, 1);
    LocalDate to = LocalDate.of(2026, 5, 25);

    Mockito.when(analyticsService.getSummary(eq(from), eq(to), eq("Ankara")))
        .thenReturn(new AnalyticsSummaryResponse(
            new AnalyticsSummaryMetricsDto(0, 0, 0, 0),
            List.of(),
            List.of(),
            List.of(),
            List.of()
        ));

    mockMvc.perform(get("/api/analytics/summary")
            .param("from", "2026-05-01")
            .param("to", "2026-05-25")
            .param("region", "Ankara"))
        .andExpect(status().isOk());

    Mockito.verify(analyticsService).getSummary(from, to, "Ankara");
  }
}
