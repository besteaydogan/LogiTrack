package com.logitrack.backendapi.repository;

import com.logitrack.backendapi.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverRepository extends JpaRepository<Driver, String> {
}
