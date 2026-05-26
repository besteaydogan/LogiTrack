package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.DeliveryDto;
import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.entity.Delivery;
import com.logitrack.backendapi.entity.DeliveryPriority;
import com.logitrack.backendapi.entity.DeliveryStatus;
import com.logitrack.backendapi.repository.DeliveryRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class DeliveryService {

  private final DeliveryRepository deliveryRepository;

  public DeliveryService(DeliveryRepository deliveryRepository) {
    this.deliveryRepository = deliveryRepository;
  }

  public PageResponse<DeliveryDto> list(
      String status,
      String region,
      String priority,
      Integer page,
      Integer pageSize
  ) {
    Pageable pageable = Pagination.pageable(page, pageSize, Sort.by("lastUpdatedAt").descending());

    Specification<Delivery> specification = Specification
        .where(hasStatus(status))
        .and(hasRegion(region))
        .and(hasPriority(priority));

    return PageResponse.from(deliveryRepository.findAll(specification, pageable), DeliveryDto::from);
  }

  private Specification<Delivery> hasStatus(String status) {
    return (root, query, criteriaBuilder) -> status == null || status.isBlank()
        ? null
        : criteriaBuilder.equal(root.get("status"), DeliveryStatus.valueOf(status.toUpperCase()));
  }

  private Specification<Delivery> hasRegion(String region) {
    return (root, query, criteriaBuilder) -> region == null || region.isBlank()
        ? null
        : criteriaBuilder.equal(criteriaBuilder.lower(root.get("region")), region.toLowerCase());
  }

  private Specification<Delivery> hasPriority(String priority) {
    return (root, query, criteriaBuilder) -> priority == null || priority.isBlank()
        ? null
        : criteriaBuilder.equal(root.get("priority"), DeliveryPriority.valueOf(priority.toUpperCase()));
  }
}
