package com.logitrack.backendapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "regions")
public class Region {

  @Id
  private String id;

  @Column(nullable = false)
  private String city;

  @Column(nullable = false)
  private String district;

  @Column(name = "risk_score", nullable = false)
  private Integer riskScore;

  protected Region() {
  }

  public String getId() {
    return id;
  }

  public String getCity() {
    return city;
  }

  public String getDistrict() {
    return district;
  }

  public Integer getRiskScore() {
    return riskScore;
  }
}
