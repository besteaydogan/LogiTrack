package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.DeliveryDto;
import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.service.DeliveryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

  private final DeliveryService deliveryService;

  public DeliveryController(DeliveryService deliveryService) {
    this.deliveryService = deliveryService;
  }

  @GetMapping
  public PageResponse<DeliveryDto> list(
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String region,
      @RequestParam(required = false) String priority,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize
  ) {
    return deliveryService.list(status, region, priority, page, pageSize);
  }
}
