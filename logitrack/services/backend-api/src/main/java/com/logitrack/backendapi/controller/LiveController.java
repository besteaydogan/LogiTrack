package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.service.LiveUpdateService;
import com.logitrack.backendapi.service.LiveFleetEventPublisher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/live")
public class LiveController {

  private final LiveUpdateService liveUpdateService;
  private final LiveFleetEventPublisher liveFleetEventPublisher;

  public LiveController(LiveUpdateService liveUpdateService, LiveFleetEventPublisher liveFleetEventPublisher) {
    this.liveUpdateService = liveUpdateService;
    this.liveFleetEventPublisher = liveFleetEventPublisher;
  }

  @GetMapping("/dashboard")
  public SseEmitter dashboard() {
    return liveFleetEventPublisher.subscribeDashboard();
  }

  @GetMapping("/alerts")
  public SseEmitter alerts() {
    return liveUpdateService.stream(liveUpdateService::alerts);
  }

  @GetMapping("/vehicles")
  public SseEmitter vehicles() {
    return liveUpdateService.stream(liveUpdateService::vehicles);
  }

  @GetMapping("/fleet")
  public SseEmitter fleet() {
    return liveFleetEventPublisher.subscribe();
  }
}
