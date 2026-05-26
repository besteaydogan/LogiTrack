package com.logitrack.backendapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "drivers")
public class Driver {

  @Id
  private String id;

  @Column(nullable = false)
  private String name;

  private String phone;

  @Column(nullable = false)
  private Double rating;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DriverStatus status;

  protected Driver() {
  }

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getPhone() {
    return phone;
  }

  public Double getRating() {
    return rating;
  }

  public DriverStatus getStatus() {
    return status;
  }
}
