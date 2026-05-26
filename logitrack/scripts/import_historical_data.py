#!/usr/bin/env python3
"""Import Kaggle logistics CSV rows into the LogiTrack PostgreSQL schema."""

from __future__ import annotations

import argparse
import csv
import hashlib
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "sample" / "historical_deliveries_sample.csv"
DEFAULT_PROCESSED = ROOT / "data" / "processed" / "historical_deliveries_normalized.csv"
DEFAULT_DATABASE_URL = "postgresql://logitrack:logitrack@localhost:55432/logitrack"

STATUS_MAP = {
    "created": "CREATED",
    "pending": "CREATED",
    "assigned": "ASSIGNED",
    "in transit": "IN_TRANSIT",
    "in_transit": "IN_TRANSIT",
    "out for delivery": "IN_TRANSIT",
    "delayed": "DELAYED",
    "late": "DELAYED",
    "delivered": "DELIVERED",
    "completed": "DELIVERED",
    "cancelled": "CANCELLED",
    "canceled": "CANCELLED",
}

PRIORITY_MAP = {
    "low": "LOW",
    "normal": "NORMAL",
    "medium": "NORMAL",
    "standard": "NORMAL",
    "high": "HIGH",
    "urgent": "URGENT",
    "critical": "URGENT",
}


@dataclass(frozen=True)
class NormalizedDelivery:
    delivery_id: str
    tracking_number: str
    region_id: str
    city: str
    district: str
    risk_score: int
    driver_id: str
    driver_name: str
    driver_phone: str | None
    driver_rating: float
    driver_status: str
    warehouse_id: str
    warehouse_name: str
    warehouse_latitude: float
    warehouse_longitude: float
    vehicle_id: str
    vehicle_plate: str
    vehicle_type: str
    vehicle_capacity: int
    vehicle_status: str
    latitude: float
    longitude: float
    delivery_status: str
    priority: str
    estimated_delivery_time: datetime
    actual_delivery_time: datetime | None
    delay_minutes: int
    last_updated_at: datetime
    source_key: str


def stable_id(prefix: str, value: str, length: int = 32) -> str:
    digest = hashlib.sha1(value.strip().lower().encode("utf-8")).hexdigest()[: length - len(prefix) - 1]
    return f"{prefix}-{digest}".upper()


def get_value(row: dict[str, str], *aliases: str, default: str = "") -> str:
    lowered = {key.strip().lower().replace(" ", "_"): value for key, value in row.items()}
    for alias in aliases:
        key = alias.strip().lower().replace(" ", "_")
        if key in lowered and str(lowered[key]).strip():
            return str(lowered[key]).strip()
    return default


def parse_datetime(value: str, fallback: datetime) -> datetime:
    if not value:
        return fallback
    normalized = value.strip().replace("Z", "+00:00")
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
    ]
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        for date_format in formats:
            try:
                parsed = datetime.strptime(normalized, date_format)
                break
            except ValueError:
                continue
        else:
            parsed = fallback
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def parse_float(value: str, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_int(value: str, default: int) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def normalize_status(value: str, estimated: datetime, actual: datetime | None, delay_minutes: int) -> str:
    mapped = STATUS_MAP.get(value.strip().lower())
    if mapped:
        return mapped
    if actual:
        return "DELIVERED"
    if delay_minutes > 0 or estimated < datetime.now(timezone.utc):
        return "DELAYED"
    return "IN_TRANSIT"


def normalize_priority(value: str) -> str:
    return PRIORITY_MAP.get(value.strip().lower(), "NORMAL")


def normalize_row(row: dict[str, str], index: int) -> NormalizedDelivery:
    now = datetime.now(timezone.utc)
    source_key = get_value(
        row,
        "order_id",
        "shipment_id",
        "delivery_id",
        "tracking_number",
        "tracking_id",
        "id",
        default=f"row-{index}",
    )
    city = get_value(row, "city", "destination_city", "region", "delivery_city", default="Istanbul").title()
    district = get_value(row, "district", "destination_district", "area", "zone", default="Central").title()
    region_label = f"{city} {district}"
    estimated = parse_datetime(
        get_value(row, "estimated_delivery_time", "estimated_arrival", "eta", "planned_delivery_time", "delivery_date"),
        now,
    )
    actual_value = get_value(row, "actual_delivery_time", "delivered_at", "actual_arrival", "delivery_completed_at")
    actual = parse_datetime(actual_value, estimated) if actual_value else None
    delay_minutes = max(0, parse_int(get_value(row, "delay_minutes", "delay", "late_minutes"), 0))
    if actual and delay_minutes == 0:
        delay_minutes = max(0, int((actual - estimated).total_seconds() // 60))

    latitude = parse_float(get_value(row, "latitude", "lat", "last_latitude", "destination_latitude"), 41.0082)
    longitude = parse_float(get_value(row, "longitude", "lng", "lon", "last_longitude", "destination_longitude"), 28.9784)
    driver_name = get_value(row, "driver_name", "driver", "courier_name", default=f"Historical Driver {index % 200:03d}")
    vehicle_plate = get_value(row, "vehicle_plate", "plate", "truck_id", "vehicle_id", default=f"HIST {index % 500:03d}")

    return NormalizedDelivery(
        delivery_id=stable_id("DLV", source_key),
        tracking_number=get_value(row, "tracking_number", "tracking_id", "shipment_id", default=f"HIST-{source_key}"),
        region_id=stable_id("REG", region_label),
        city=city,
        district=district,
        risk_score=max(1, min(100, parse_int(get_value(row, "risk_score", "risk"), 45 + delay_minutes // 5))),
        driver_id=stable_id("DRV", driver_name),
        driver_name=driver_name,
        driver_phone=get_value(row, "driver_phone", "phone", default="") or None,
        driver_rating=max(1.0, min(5.0, parse_float(get_value(row, "driver_rating", "rating"), 4.5))),
        driver_status="ACTIVE",
        warehouse_id=stable_id("WH", get_value(row, "warehouse_name", "warehouse", "origin", default=f"{city} Hub")),
        warehouse_name=get_value(row, "warehouse_name", "warehouse", "origin", default=f"{city} Historical Hub"),
        warehouse_latitude=latitude,
        warehouse_longitude=longitude,
        vehicle_id=stable_id("VHL", vehicle_plate),
        vehicle_plate=vehicle_plate,
        vehicle_type=get_value(row, "vehicle_type", "truck_type", "vehicle_category", default="Box Truck"),
        vehicle_capacity=max(1, parse_int(get_value(row, "vehicle_capacity", "capacity"), 1200)),
        vehicle_status="ACTIVE",
        latitude=latitude,
        longitude=longitude,
        delivery_status=normalize_status(get_value(row, "status", "delivery_status"), estimated, actual, delay_minutes),
        priority=normalize_priority(get_value(row, "priority", "shipment_priority")),
        estimated_delivery_time=estimated,
        actual_delivery_time=actual,
        delay_minutes=delay_minutes,
        last_updated_at=actual or now,
        source_key=source_key,
    )


def read_rows(path: Path, limit: int | None) -> list[NormalizedDelivery]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows: list[NormalizedDelivery] = []
        for index, row in enumerate(reader, start=1):
            rows.append(normalize_row(row, index))
            if limit and len(rows) >= limit:
                break
        return rows


def write_processed(path: Path, rows: Iterable[NormalizedDelivery]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(NormalizedDelivery.__dataclass_fields__.keys())
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            payload = row.__dict__.copy()
            for key in ("estimated_delivery_time", "actual_delivery_time", "last_updated_at"):
                value = payload[key]
                payload[key] = value.isoformat() if value else ""
            writer.writerow(payload)


def import_rows(database_url: str, rows: list[NormalizedDelivery]) -> None:
    try:
        import psycopg
    except ImportError as exc:  # pragma: no cover - runtime guidance
        raise SystemExit(
            "Missing dependency: psycopg. Install with `pip install psycopg[binary]` "
            "or run from the stream-consumer Python environment."
        ) from exc

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            for row in rows:
                cur.execute(
                    """
                    INSERT INTO regions (id, city, district, risk_score)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      city = EXCLUDED.city,
                      district = EXCLUDED.district,
                      risk_score = EXCLUDED.risk_score
                    """,
                    (row.region_id, row.city, row.district, row.risk_score),
                )
                cur.execute(
                    """
                    INSERT INTO drivers (id, name, phone, rating, status)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      phone = EXCLUDED.phone,
                      rating = EXCLUDED.rating,
                      status = EXCLUDED.status
                    """,
                    (row.driver_id, row.driver_name, row.driver_phone, row.driver_rating, row.driver_status),
                )
                cur.execute(
                    """
                    INSERT INTO warehouses (id, name, city, district, latitude, longitude, capacity)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      city = EXCLUDED.city,
                      district = EXCLUDED.district,
                      latitude = EXCLUDED.latitude,
                      longitude = EXCLUDED.longitude
                    """,
                    (
                        row.warehouse_id,
                        row.warehouse_name,
                        row.city,
                        row.district,
                        row.warehouse_latitude,
                        row.warehouse_longitude,
                        5000,
                    ),
                )
                cur.execute(
                    """
                    INSERT INTO vehicles (
                      id, plate, type, capacity, status, current_driver_id,
                      last_latitude, last_longitude, last_seen_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      plate = EXCLUDED.plate,
                      type = EXCLUDED.type,
                      capacity = EXCLUDED.capacity,
                      status = EXCLUDED.status,
                      current_driver_id = EXCLUDED.current_driver_id,
                      last_latitude = EXCLUDED.last_latitude,
                      last_longitude = EXCLUDED.last_longitude,
                      last_seen_at = EXCLUDED.last_seen_at
                    """,
                    (
                        row.vehicle_id,
                        row.vehicle_plate,
                        row.vehicle_type,
                        row.vehicle_capacity,
                        row.vehicle_status,
                        row.driver_id,
                        row.latitude,
                        row.longitude,
                        row.last_updated_at,
                    ),
                )
                cur.execute(
                    """
                    INSERT INTO deliveries (
                      id, tracking_number, vehicle_id, driver_id, warehouse_id, region,
                      status, priority, estimated_delivery_time, actual_delivery_time,
                      delay_minutes, last_updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      tracking_number = EXCLUDED.tracking_number,
                      vehicle_id = EXCLUDED.vehicle_id,
                      driver_id = EXCLUDED.driver_id,
                      warehouse_id = EXCLUDED.warehouse_id,
                      region = EXCLUDED.region,
                      status = EXCLUDED.status,
                      priority = EXCLUDED.priority,
                      estimated_delivery_time = EXCLUDED.estimated_delivery_time,
                      actual_delivery_time = EXCLUDED.actual_delivery_time,
                      delay_minutes = EXCLUDED.delay_minutes,
                      last_updated_at = EXCLUDED.last_updated_at
                    """,
                    (
                        row.delivery_id,
                        row.tracking_number,
                        row.vehicle_id,
                        row.driver_id,
                        row.warehouse_id,
                        f"{row.city} {row.district}",
                        row.delivery_status,
                        row.priority,
                        row.estimated_delivery_time,
                        row.actual_delivery_time,
                        row.delay_minutes,
                        row.last_updated_at,
                    ),
                )
                cur.execute(
                    """
                    INSERT INTO delivery_events (delivery_id, event_type, old_status, new_status, event_time)
                    SELECT %s, %s, NULL, %s, %s
                    WHERE NOT EXISTS (
                      SELECT 1 FROM delivery_events
                      WHERE delivery_id = %s AND event_type = %s AND event_time = %s
                    )
                    """,
                    (
                        row.delivery_id,
                        "historical.imported",
                        row.delivery_status,
                        row.last_updated_at,
                        row.delivery_id,
                        "historical.imported",
                        row.last_updated_at,
                    ),
                )
                cur.execute(
                    """
                    INSERT INTO vehicle_location_events (vehicle_id, latitude, longitude, speed, fuel_level, event_time)
                    SELECT %s, %s, %s, NULL, NULL, %s
                    WHERE NOT EXISTS (
                      SELECT 1 FROM vehicle_location_events
                      WHERE vehicle_id = %s AND event_time = %s
                    )
                    """,
                    (
                        row.vehicle_id,
                        row.latitude,
                        row.longitude,
                        row.last_updated_at,
                        row.vehicle_id,
                        row.last_updated_at,
                    ),
                )
        conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import historical logistics CSV data into LogiTrack.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Source CSV file. Defaults to sample fixture.")
    parser.add_argument("--processed", type=Path, default=DEFAULT_PROCESSED, help="Normalized CSV output path.")
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))
    parser.add_argument("--limit", type=int, default=None, help="Optional row limit for smoke imports.")
    parser.add_argument("--dry-run", action="store_true", help="Normalize and report rows without writing files or DB.")
    args = parser.parse_args()

    if not args.csv.exists():
        raise SystemExit(f"CSV file not found: {args.csv}")

    rows = read_rows(args.csv, args.limit)
    if not rows:
        raise SystemExit("No rows found in source CSV.")

    print(f"Normalized {len(rows)} historical deliveries from {args.csv}")
    if args.dry_run:
        print("Dry run complete; no processed CSV or database writes were performed.")
        return

    write_processed(args.processed, rows)
    import_rows(args.database_url, rows)
    print(f"Wrote normalized CSV to {args.processed}")
    print(f"Imported {len(rows)} deliveries into PostgreSQL idempotently.")


if __name__ == "__main__":
    main()
