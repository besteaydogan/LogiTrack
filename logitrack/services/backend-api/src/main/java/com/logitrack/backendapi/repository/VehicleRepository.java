package com.logitrack.backendapi.repository;

import com.logitrack.backendapi.entity.Vehicle;
import com.logitrack.backendapi.entity.VehicleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {

  Page<Vehicle> findByStatus(VehicleStatus status, Pageable pageable);

  Page<Vehicle> findByLastSeenAtIsNotNull(Pageable pageable);

  Page<Vehicle> findByStatusAndLastSeenAtIsNotNull(VehicleStatus status, Pageable pageable);

  long countByStatusIn(Collection<VehicleStatus> statuses);

  long countByStatusInAndLastSeenAtIsNotNull(Collection<VehicleStatus> statuses);

  List<Vehicle> findByStatusIn(Collection<VehicleStatus> statuses);
}
