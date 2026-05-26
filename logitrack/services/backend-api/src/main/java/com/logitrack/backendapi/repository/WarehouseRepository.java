package com.logitrack.backendapi.repository;

import com.logitrack.backendapi.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, String> {
}
