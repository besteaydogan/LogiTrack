package com.logitrack.backendapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "delivery_events")
public class DeliveryEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "delivery_id", nullable = false)
  private Delivery delivery;

  @Column(name = "event_type", nullable = false)
  private String eventType;

  @Column(name = "old_status")
  private String oldStatus;

  @Column(name = "new_status")
  private String newStatus;

  @Column(name = "event_time", nullable = false)
  private OffsetDateTime eventTime;

  protected DeliveryEvent() {
  }
}
