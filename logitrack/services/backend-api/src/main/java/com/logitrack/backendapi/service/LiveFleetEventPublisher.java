package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.LiveFleetEventDto;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

@Service
public class LiveFleetEventPublisher {

  private static final long TIMEOUT_MS = TimeUnit.MINUTES.toMillis(30);

  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public SseEmitter subscribe() {
    SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
    emitters.add(emitter);

    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> emitters.remove(emitter));
    emitter.onError(error -> emitters.remove(emitter));

    try {
      emitter.send(SseEmitter.event().name("connected").data("fleet live stream connected"));
    } catch (IOException | IllegalStateException exception) {
      emitters.remove(emitter);
      emitter.completeWithError(exception);
    }

    return emitter;
  }

  public SseEmitter subscribeDashboard() {
    SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
    emitters.add(emitter);

    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> emitters.remove(emitter));
    emitter.onError(error -> emitters.remove(emitter));

    try {
      emitter.send(SseEmitter.event().name("connected").data("dashboard live stream connected"));
    } catch (IOException | IllegalStateException exception) {
      emitters.remove(emitter);
      emitter.completeWithError(exception);
    }

    return emitter;
  }

  public void publish(LiveFleetEventDto event) {
    for (SseEmitter emitter : emitters) {
      try {
        emitter.send(SseEmitter.event().name(event.eventType()).data(event));
      } catch (IOException | IllegalStateException exception) {
        emitters.remove(emitter);
        emitter.completeWithError(exception);
      }
    }
  }
}
