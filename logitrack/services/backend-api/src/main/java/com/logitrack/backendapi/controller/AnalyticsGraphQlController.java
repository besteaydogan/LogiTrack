package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.AnalyticsSummaryResponse;
import com.logitrack.backendapi.service.AnalyticsService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;

@Controller
public class AnalyticsGraphQlController {

  private final AnalyticsService analyticsService;

  public AnalyticsGraphQlController(AnalyticsService analyticsService) {
    this.analyticsService = analyticsService;
  }

  @QueryMapping
  public AnalyticsSummaryResponse deliveryAnalytics(
      @Argument String from,
      @Argument String to,
      @Argument String region
  ) {
    return analyticsService.getSummary(parseDate(from), parseDate(to), region);
  }

  private LocalDate parseDate(String value) {
    return value == null || value.isBlank() ? null : LocalDate.parse(value);
  }
}
