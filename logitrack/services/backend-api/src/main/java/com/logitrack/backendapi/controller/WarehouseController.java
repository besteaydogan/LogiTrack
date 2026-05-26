package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.dto.WarehouseDto;
import com.logitrack.backendapi.service.WarehouseService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {

  private final WarehouseService warehouseService;

  public WarehouseController(WarehouseService warehouseService) {
    this.warehouseService = warehouseService;
  }

  @GetMapping
  public PageResponse<WarehouseDto> list(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize
  ) {
    return warehouseService.list(page, pageSize);
  }
}
