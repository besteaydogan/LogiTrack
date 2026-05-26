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
@Table(name = "alerts")
public class Alert {

  @Id
  private String id;

  @Column(name = "alert_type", nullable = false)
  private String alertType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AlertSeverity severity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AlertStatus status;

  @Column(nullable = false)
  private String message;

  @ManyToOne
  @JoinColumn(name = "delivery_id")
  private Delivery delivery;

  @ManyToOne
  @JoinColumn(name = "vehicle_id")
  private Vehicle vehicle;

  @Column(nullable = false)
  private String region;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "resolved_at")
  private OffsetDateTime resolvedAt;

  protected Alert() {
  }

  public String getId() {
    return id;
  }

  public String getAlertType() {
    return alertType;
  }

  public AlertSeverity getSeverity() {
    return severity;
  }

  public AlertStatus getStatus() {
    return status;
  }

  public String getMessage() {
    return message;
  }

  public Delivery getDelivery() {
    return delivery;
  }

  public Vehicle getVehicle() {
    return vehicle;
  }

  public String getRegion() {
    return region;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getResolvedAt() {
    return resolvedAt;
  }

  public void resolve(OffsetDateTime resolvedAt) {
    this.status = AlertStatus.RESOLVED;
    this.resolvedAt = resolvedAt;
  }
}
