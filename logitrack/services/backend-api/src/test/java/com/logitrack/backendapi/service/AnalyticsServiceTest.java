package com.logitrack.backendapi.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsServiceTest {

  @Test
  void calculatesOnTimeRate() {
    assertThat(AnalyticsService.onTimeRate(10, 2)).isEqualTo(80.0);
  }

  @Test
  void calculatesDelayRate() {
    assertThat(AnalyticsService.delayRate(10, 2)).isEqualTo(20.0);
  }

  @Test
  void handlesZeroDeliveries() {
    assertThat(AnalyticsService.onTimeRate(0, 0)).isZero();
    assertThat(AnalyticsService.delayRate(0, 0)).isZero();
  }

  @Test
  void roundsToOneDecimalPlace() {
    assertThat(AnalyticsService.round(66.666)).isEqualTo(66.7);
  }
}
