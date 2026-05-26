package com.logitrack.backendapi.repository;

import com.logitrack.backendapi.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<Region, String> {
}
