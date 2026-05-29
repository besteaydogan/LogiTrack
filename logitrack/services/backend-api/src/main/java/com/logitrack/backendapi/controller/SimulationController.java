package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.SimulationTickResponse;
import com.logitrack.backendapi.service.SimulationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

  private final SimulationService simulationService;

  public SimulationController(SimulationService simulationService) {
    this.simulationService = simulationService;
  }

  @PostMapping("/tick")
  public SimulationTickResponse tick() {
    return simulationService.tick();
  }
}
