package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.service.LiveFleetEventPublisher;
import com.logitrack.backendapi.service.LiveUpdateService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.assertj.core.api.Assertions.assertThat;

class LiveControllerTest {

  @Test
  void dashboardUsesEventDrivenLivePublisher() {
    LiveUpdateService liveUpdateService = Mockito.mock(LiveUpdateService.class);
    LiveFleetEventPublisher liveFleetEventPublisher = Mockito.mock(LiveFleetEventPublisher.class);
    SseEmitter emitter = new SseEmitter();

    Mockito.when(liveFleetEventPublisher.subscribeDashboard()).thenReturn(emitter);

    LiveController controller = new LiveController(liveUpdateService, liveFleetEventPublisher);

    assertThat(controller.dashboard()).isSameAs(emitter);
    Mockito.verify(liveFleetEventPublisher).subscribeDashboard();
    Mockito.verifyNoInteractions(liveUpdateService);
  }
}
