package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.dto.WarehouseDto;
import com.logitrack.backendapi.repository.WarehouseRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class WarehouseService {

  private final WarehouseRepository warehouseRepository;

  public WarehouseService(WarehouseRepository warehouseRepository) {
    this.warehouseRepository = warehouseRepository;
  }

  public PageResponse<WarehouseDto> list(Integer page, Integer pageSize) {
    Pageable pageable = Pagination.pageable(page, pageSize, Sort.by("name").ascending());
    return PageResponse.from(warehouseRepository.findAll(pageable), WarehouseDto::from);
  }
}
