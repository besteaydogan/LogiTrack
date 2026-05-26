package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.AlertDto;
import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.service.AlertService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

  private final AlertService alertService;

  public AlertController(AlertService alertService) {
    this.alertService = alertService;
  }

  @GetMapping
  public PageResponse<AlertDto> list(
      @RequestParam(required = false) String severity,
      @RequestParam(required = false) Boolean resolved,
      @RequestParam(required = false) String alertType,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize
  ) {
    return alertService.list(severity, resolved, alertType, page, pageSize);
  }

  @PatchMapping("/{id}/resolve")
  public AlertDto resolve(@PathVariable String id) {
    return alertService.resolve(id);
  }
}
