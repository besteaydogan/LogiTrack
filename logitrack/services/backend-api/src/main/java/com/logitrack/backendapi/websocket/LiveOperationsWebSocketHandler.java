package com.logitrack.backendapi.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.backendapi.dto.LiveFleetEventDto;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class LiveOperationsWebSocketHandler extends TextWebSocketHandler {

  private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
  private final ObjectMapper objectMapper;

  public LiveOperationsWebSocketHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    sessions.add(session);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    sessions.remove(session);
  }

  @Override
  public void handleTransportError(WebSocketSession session, Throwable exception) {
    sessions.remove(session);
  }

  public void publish(LiveFleetEventDto event) {
    for (WebSocketSession session : sessions) {
      if (!session.isOpen()) {
        sessions.remove(session);
        continue;
      }

      try {
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(event)));
      } catch (IOException | IllegalStateException exception) {
        sessions.remove(session);
      }
    }
  }
}
