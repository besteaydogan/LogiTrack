package com.logitrack.backendapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "vehicles")
public class Vehicle {

  @Id
  private String id;

  @Column(nullable = false)
  private String plate;

  @Column(nullable = false)
  private String type;

  @Column(nullable = false)
  private Integer capacity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private VehicleStatus status;

  @ManyToOne
  @JoinColumn(name = "current_driver_id")
  private Driver currentDriver;

  @Column(name = "last_latitude")
  private Double lastLatitude;

  @Column(name = "last_longitude")
  private Double lastLongitude;

  @Column(name = "last_seen_at")
  private OffsetDateTime lastSeenAt;

  protected Vehicle() {
  }

  public String getId() {
    return id;
  }

  public String getPlate() {
    return plate;
  }

  public String getType() {
    return type;
  }

  public Integer getCapacity() {
    return capacity;
  }

  public VehicleStatus getStatus() {
    return status;
  }

  public Driver getCurrentDriver() {
    return currentDriver;
  }

  public Double getLastLatitude() {
    return lastLatitude;
  }

  public Double getLastLongitude() {
    return lastLongitude;
  }

  public OffsetDateTime getLastSeenAt() {
    return lastSeenAt;
  }

  public void updateSimulationLocation(
      Double lastLatitude,
      Double lastLongitude,
      OffsetDateTime lastSeenAt,
      VehicleStatus status
  ) {
    this.lastLatitude = lastLatitude;
    this.lastLongitude = lastLongitude;
    this.lastSeenAt = lastSeenAt;
    this.status = status;
  }
}
