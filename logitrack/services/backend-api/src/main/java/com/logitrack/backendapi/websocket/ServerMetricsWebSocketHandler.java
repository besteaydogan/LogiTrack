package com.logitrack.backendapi.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.backendapi.service.ServerMetricsService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Component
public class ServerMetricsWebSocketHandler extends TextWebSocketHandler {

  private static final long METRIC_INTERVAL_SECONDS = 2;

  private final Map<String, ScheduledFuture<?>> scheduledSessions = new ConcurrentHashMap<>();
  private final ObjectMapper objectMapper;
  private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(2);
  private final ServerMetricsService serverMetricsService;

  public ServerMetricsWebSocketHandler(ObjectMapper objectMapper, ServerMetricsService serverMetricsService) {
    this.objectMapper = objectMapper;
    this.serverMetricsService = serverMetricsService;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    ScheduledFuture<?> future = executor.scheduleAtFixedRate(
        () -> sendMetrics(session),
        0,
        METRIC_INTERVAL_SECONDS,
        TimeUnit.SECONDS
    );
    scheduledSessions.put(session.getId(), future);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    cancel(session);
  }

  @Override
  public void handleTransportError(WebSocketSession session, Throwable exception) {
    cancel(session);
  }

  private void sendMetrics(WebSocketSession session) {
    if (!session.isOpen()) {
      cancel(session);
      return;
    }

    try {
      session.sendMessage(new TextMessage(objectMapper.writeValueAsString(serverMetricsService.snapshot())));
    } catch (IOException | IllegalStateException exception) {
      cancel(session);
    }
  }

  private void cancel(WebSocketSession session) {
    ScheduledFuture<?> future = scheduledSessions.remove(session.getId());

    if (future != null) {
      future.cancel(true);
    }
  }
}
