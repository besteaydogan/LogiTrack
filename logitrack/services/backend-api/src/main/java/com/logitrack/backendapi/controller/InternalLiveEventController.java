package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.LiveFleetEventDto;
import com.logitrack.backendapi.service.LiveFleetEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/live-events")
public class InternalLiveEventController {

  private final LiveFleetEventPublisher liveFleetEventPublisher;

  public InternalLiveEventController(LiveFleetEventPublisher liveFleetEventPublisher) {
    this.liveFleetEventPublisher = liveFleetEventPublisher;
  }

  @PostMapping
  public ResponseEntity<Void> publish(@RequestBody LiveFleetEventDto event) {
    liveFleetEventPublisher.publish(event);
    return ResponseEntity.noContent().build();
  }
}
