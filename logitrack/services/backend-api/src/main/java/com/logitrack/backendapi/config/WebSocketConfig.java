package com.logitrack.backendapi.config;

import com.logitrack.backendapi.websocket.ServerMetricsWebSocketHandler;
import com.logitrack.backendapi.websocket.LiveOperationsWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.Arrays;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  private final String[] allowedOrigins;
  private final LiveOperationsWebSocketHandler liveOperationsWebSocketHandler;
  private final ServerMetricsWebSocketHandler serverMetricsWebSocketHandler;

  public WebSocketConfig(
      @Value("${logitrack.cors.allowed-origin}") String allowedOrigin,
      LiveOperationsWebSocketHandler liveOperationsWebSocketHandler,
      ServerMetricsWebSocketHandler serverMetricsWebSocketHandler
  ) {
    this.allowedOrigins = Arrays.stream(allowedOrigin.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isBlank())
        .toArray(String[]::new);
    this.liveOperationsWebSocketHandler = liveOperationsWebSocketHandler;
    this.serverMetricsWebSocketHandler = serverMetricsWebSocketHandler;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(liveOperationsWebSocketHandler, "/ws/live-operations")
        .setAllowedOrigins(allowedOrigins);
    registry.addHandler(serverMetricsWebSocketHandler, "/ws/server-metrics")
        .setAllowedOrigins(allowedOrigins);
  }
}
