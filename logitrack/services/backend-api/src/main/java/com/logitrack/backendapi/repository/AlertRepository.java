package com.logitrack.backendapi.repository;

import com.logitrack.backendapi.entity.Alert;
import com.logitrack.backendapi.entity.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, String>, JpaSpecificationExecutor<Alert> {

  long countByStatus(AlertStatus status);

  List<Alert> findTop5ByStatusOrderByCreatedAtDesc(AlertStatus status);

  long countByIdStartingWith(String prefix);
}
