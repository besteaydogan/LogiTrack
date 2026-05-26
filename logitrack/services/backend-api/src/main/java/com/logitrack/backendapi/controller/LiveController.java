package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.service.LiveUpdateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/live")
public class LiveController {

  private final LiveUpdateService liveUpdateService;

  public LiveController(LiveUpdateService liveUpdateService) {
    this.liveUpdateService = liveUpdateService;
  }

  @GetMapping("/dashboard")
  public SseEmitter dashboard() {
    return liveUpdateService.stream(liveUpdateService::dashboardSummary);
  }

  @GetMapping("/alerts")
  public SseEmitter alerts() {
    return liveUpdateService.stream(liveUpdateService::alerts);
  }

  @GetMapping("/vehicles")
  public SseEmitter vehicles() {
    return liveUpdateService.stream(liveUpdateService::vehicles);
  }
}
