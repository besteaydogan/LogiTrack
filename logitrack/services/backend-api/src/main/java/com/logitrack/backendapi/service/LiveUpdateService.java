package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.AlertDto;
import com.logitrack.backendapi.dto.DashboardSummaryResponse;
import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.dto.VehicleDto;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class LiveUpdateService {

  private static final long TIMEOUT_MS = TimeUnit.MINUTES.toMillis(30);
  private static final long INTERVAL_SECONDS = 3;

  private final DashboardService dashboardService;
  private final AlertService alertService;
  private final VehicleService vehicleService;

  public LiveUpdateService(DashboardService dashboardService, AlertService alertService, VehicleService vehicleService) {
    this.dashboardService = dashboardService;
    this.alertService = alertService;
    this.vehicleService = vehicleService;
  }

  public DashboardSummaryResponse dashboardSummary() {
    return dashboardService.getSummary();
  }

  public PageResponse<AlertDto> alerts() {
    return alertService.list(null, null, null, 1, 25);
  }

  public PageResponse<VehicleDto> vehicles() {
    return vehicleService.list(null, 1, 100);
  }

  public <T> SseEmitter stream(Supplier<T> supplier) {
    SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
    ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

    Runnable emit = () -> {
      try {
        emitter.send(SseEmitter.event().name("message").data(supplier.get()));
      } catch (IOException | IllegalStateException exception) {
        emitter.completeWithError(exception);
      }
    };

    executor.scheduleAtFixedRate(emit, 0, INTERVAL_SECONDS, TimeUnit.SECONDS);

    Runnable shutdown = executor::shutdownNow;
    emitter.onCompletion(shutdown);
    emitter.onTimeout(shutdown);
    emitter.onError(error -> shutdown.run());

    return emitter;
  }
}
