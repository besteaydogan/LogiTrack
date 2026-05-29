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
@Table(name = "deliveries")
public class Delivery {

  @Id
  private String id;

  @Column(name = "tracking_number", nullable = false)
  private String trackingNumber;

  @ManyToOne(optional = false)
  @JoinColumn(name = "vehicle_id", nullable = false)
  private Vehicle vehicle;

  @ManyToOne(optional = false)
  @JoinColumn(name = "driver_id", nullable = false)
  private Driver driver;

  @ManyToOne(optional = false)
  @JoinColumn(name = "warehouse_id", nullable = false)
  private Warehouse warehouse;

  @Column(nullable = false)
  private String region;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DeliveryStatus status;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DeliveryPriority priority;

  @Column(name = "estimated_delivery_time", nullable = false)
  private OffsetDateTime estimatedDeliveryTime;

  @Column(name = "actual_delivery_time")
  private OffsetDateTime actualDeliveryTime;

  @Column(name = "delay_minutes", nullable = false)
  private Integer delayMinutes;

  @Column(name = "last_updated_at", nullable = false)
  private OffsetDateTime lastUpdatedAt;

  protected Delivery() {
  }

  public String getId() {
    return id;
  }

  public String getTrackingNumber() {
    return trackingNumber;
  }

  public Vehicle getVehicle() {
    return vehicle;
  }

  public Driver getDriver() {
    return driver;
  }

  public Warehouse getWarehouse() {
    return warehouse;
  }

  public String getRegion() {
    return region;
  }

  public DeliveryStatus getStatus() {
    return status;
  }

  public DeliveryPriority getPriority() {
    return priority;
  }

  public OffsetDateTime getEstimatedDeliveryTime() {
    return estimatedDeliveryTime;
  }

  public OffsetDateTime getActualDeliveryTime() {
    return actualDeliveryTime;
  }

  public Integer getDelayMinutes() {
    return delayMinutes;
  }

  public OffsetDateTime getLastUpdatedAt() {
    return lastUpdatedAt;
  }

  public void updateSimulationStatus(DeliveryStatus status, OffsetDateTime lastUpdatedAt) {
    this.status = status;
    this.lastUpdatedAt = lastUpdatedAt;

    if (status == DeliveryStatus.DELIVERED) {
      this.actualDeliveryTime = lastUpdatedAt;
    }
  }

  public void markSimulationDelayed(Integer delayMinutes, OffsetDateTime lastUpdatedAt) {
    this.status = DeliveryStatus.DELAYED;
    this.delayMinutes = delayMinutes;
    this.actualDeliveryTime = lastUpdatedAt;
    this.lastUpdatedAt = lastUpdatedAt;
  }
}
