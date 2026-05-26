package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.dto.VehicleDto;
import com.logitrack.backendapi.service.VehicleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

  private final VehicleService vehicleService;

  public VehicleController(VehicleService vehicleService) {
    this.vehicleService = vehicleService;
  }

  @GetMapping
  public PageResponse<VehicleDto> list(
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize
  ) {
    return vehicleService.list(status, page, pageSize);
  }

  @GetMapping("/{id}")
  public VehicleDto getById(@PathVariable String id) {
    return vehicleService.getById(id);
  }
}
