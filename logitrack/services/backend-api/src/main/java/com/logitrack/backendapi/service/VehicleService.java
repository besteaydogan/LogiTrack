package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.dto.VehicleDto;
import com.logitrack.backendapi.entity.Vehicle;
import com.logitrack.backendapi.entity.VehicleStatus;
import com.logitrack.backendapi.exception.ResourceNotFoundException;
import com.logitrack.backendapi.repository.VehicleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class VehicleService {

  private final VehicleRepository vehicleRepository;

  public VehicleService(VehicleRepository vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  public PageResponse<VehicleDto> list(String status, Integer page, Integer pageSize) {
    Pageable pageable = Pagination.pageable(page, pageSize, Sort.by("id").ascending());
    Page<Vehicle> vehicles = status == null || status.isBlank()
        ? vehicleRepository.findByLastSeenAtIsNotNull(pageable)
        : vehicleRepository.findByStatusAndLastSeenAtIsNotNull(VehicleStatus.valueOf(status.toUpperCase()), pageable);

    return PageResponse.from(vehicles, VehicleDto::from);
  }

  public VehicleDto getById(String id) {
    return vehicleRepository.findById(id)
        .map(VehicleDto::from)
        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + id));
  }
}
