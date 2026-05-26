package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.AlertDto;
import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.entity.Alert;
import com.logitrack.backendapi.entity.AlertSeverity;
import com.logitrack.backendapi.entity.AlertStatus;
import com.logitrack.backendapi.exception.ResourceNotFoundException;
import com.logitrack.backendapi.repository.AlertRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class AlertService {

  private final AlertRepository alertRepository;

  public AlertService(AlertRepository alertRepository) {
    this.alertRepository = alertRepository;
  }

  public PageResponse<AlertDto> list(
      String severity,
      Boolean resolved,
      String alertType,
      Integer page,
      Integer pageSize
  ) {
    Pageable pageable = Pagination.pageable(page, pageSize, Sort.by("createdAt").descending());

    Specification<Alert> specification = Specification
        .where(hasSeverity(severity))
        .and(hasResolved(resolved))
        .and(hasAlertType(alertType));

    return PageResponse.from(alertRepository.findAll(specification, pageable), AlertDto::from);
  }

  @Transactional
  public AlertDto resolve(String id) {
    Alert alert = alertRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));

    if (alert.getStatus() == AlertStatus.UNRESOLVED) {
      alert.resolve(OffsetDateTime.now());
    }

    return AlertDto.from(alert);
  }

  private Specification<Alert> hasSeverity(String severity) {
    return (root, query, criteriaBuilder) -> severity == null || severity.isBlank()
        ? null
        : criteriaBuilder.equal(root.get("severity"), AlertSeverity.valueOf(severity.toUpperCase()));
  }

  private Specification<Alert> hasResolved(Boolean resolved) {
    return (root, query, criteriaBuilder) -> {
      if (resolved == null) {
        return null;
      }
      AlertStatus status = resolved ? AlertStatus.RESOLVED : AlertStatus.UNRESOLVED;
      return criteriaBuilder.equal(root.get("status"), status);
    };
  }

  private Specification<Alert> hasAlertType(String alertType) {
    return (root, query, criteriaBuilder) -> alertType == null || alertType.isBlank()
        ? null
        : criteriaBuilder.equal(criteriaBuilder.lower(root.get("alertType")), alertType.toLowerCase());
  }
}
