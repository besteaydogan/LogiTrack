#!/usr/bin/env python3
"""Transform the Kaggle delivery logistics dataset into LogiTrack seed CSVs."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable


BASE_DATE = datetime(2026, 5, 1, 8, 0, tzinfo=timezone.utc)

SUPPORTED_REGIONS = [
    {
        "id": "REG-ANK-CAN",
        "name": "Ankara-Cankaya",
        "city": "Ankara",
        "district": "Cankaya",
        "latitude": 39.9208,
        "longitude": 32.8541,
        "risk_score": 72,
    },
    {
        "id": "REG-IST-KAD",
        "name": "Istanbul-Kadikoy",
        "city": "Istanbul",
        "district": "Kadikoy",
        "latitude": 40.9903,
        "longitude": 29.0290,
        "risk_score": 81,
    },
    {
        "id": "REG-IST-SIS",
        "name": "Istanbul-Sisli",
        "city": "Istanbul",
        "district": "Sisli",
        "latitude": 41.0605,
        "longitude": 28.9872,
        "risk_score": 66,
    },
    {
        "id": "REG-IZM-KON",
        "name": "Izmir-Konak",
        "city": "Izmir",
        "district": "Konak",
        "latitude": 38.4192,
        "longitude": 27.1287,
        "risk_score": 58,
    },
    {
        "id": "REG-BUR-NIL",
        "name": "Bursa-Nilufer",
        "city": "Bursa",
        "district": "Nilufer",
        "latitude": 40.2167,
        "longitude": 28.9833,
        "risk_score": 49,
    },
]

WAREHOUSES = [
    ("WH-ANK-001", "Ankara Hub", "Ankara-Cankaya", 5000),
    ("WH-IST-001", "Istanbul Hub", "Istanbul-Kadikoy", 6500),
    ("WH-IZM-001", "Izmir Hub", "Izmir-Konak", 4500),
    ("WH-BRS-001", "Bursa Hub", "Bursa-Nilufer", 4200),
]

DRIVER_IDS = ["DRV-001", "DRV-002", "DRV-003", "DRV-004", "DRV-005"]

VEHICLE_PLATES = [
    "06 LGT 001",
    "34 LGT 002",
    "35 LGT 003",
    "16 LGT 004",
    "06 LGT 005",
    "34 LGT 006",
    "35 LGT 007",
    "16 LGT 008",
    "06 LGT 009",
    "34 LGT 010",
    "35 LGT 011",
    "16 LGT 012",
    "06 LGT 013",
    "34 LGT 014",
    "35 LGT 015",
    "16 LGT 016",
    "06 LGT 017",
    "34 LGT 018",
    "35 LGT 019",
    "16 LGT 020",
]

STATUS_MAP = {
    "pending": "CREATED",
    "created": "CREATED",
    "assigned": "ASSIGNED",
    "in transit": "IN_TRANSIT",
    "in_transit": "IN_TRANSIT",
    "shipping": "IN_TRANSIT",
    "delayed": "DELAYED",
    "late": "DELAYED",
    "delivered": "DELIVERED",
    "completed": "DELIVERED",
    "cancelled": "CANCELLED",
    "canceled": "CANCELLED",
}


@dataclass(frozen=True)
class DeliveryRow:
    id: str
    tracking_number: str
    vehicle_id: str
    driver_id: str
    warehouse_id: str
    region: str
    status: str
    priority: str
    estimated_delivery_time: str
    actual_delivery_time: str
    delay_minutes: int
    last_updated_at: str


@dataclass(frozen=True)
class AlertRow:
    id: str
    alert_type: str
    severity: str
    status: str
    message: str
    delivery_id: str
    vehicle_id: str
    region: str
    created_at: str
    resolved_at: str


def normalize_key(value: str) -> str:
    return value.strip().lower().replace(" ", "_").replace("-", "_")


def normalize_row_keys(row: dict[str, str]) -> dict[str, str]:
    return {normalize_key(key): (value or "").strip() for key, value in row.items()}


def parse_float(value: str, default: float = 0.0) -> float:
    try:
        if value == "":
            return default
        parsed = float(value)
        if math.isnan(parsed):
            return default
        return parsed
    except ValueError:
        return default


def parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "y", "delayed", "late"}


def stable_index(seed: int, *parts: object, modulo: int) -> int:
    payload = ":".join(str(part) for part in (seed, *parts))
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    return int(digest[:10], 16) % modulo


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def select_region(source_region: str, row_identity: str, seed: int) -> dict[str, object]:
    normalized_source = source_region.strip().lower()
    by_name = {str(region["name"]).lower(): region for region in SUPPORTED_REGIONS}
    if normalized_source in by_name:
        return by_name[normalized_source]
    index = stable_index(seed, normalized_source or "missing-region", row_identity, modulo=len(SUPPORTED_REGIONS))
    return SUPPORTED_REGIONS[index]


def normalize_status(source_status: str, delayed: bool, delay_minutes: int) -> str:
    mapped = STATUS_MAP.get(source_status.strip().lower(), "")
    if mapped == "CANCELLED":
        return "CANCELLED"
    if delayed and delay_minutes > 0:
        return "DELAYED"
    if mapped == "DELIVERED":
        return "DELIVERED"
    if mapped:
        return mapped
    return "IN_TRANSIT"


def priority_for(row: dict[str, str], delay_minutes: int) -> str:
    package_type = row.get("package_type", "").lower()
    delivery_mode = row.get("delivery_mode", "").lower()
    weight = parse_float(row.get("package_weight_kg", ""), 0)
    if delay_minutes >= 30 or "express" in delivery_mode or "fragile" in package_type:
        return "HIGH"
    if weight >= 20 or delay_minutes >= 10:
        return "NORMAL"
    if weight <= 2:
        return "LOW"
    return "NORMAL"


def vehicle_type_for(source_type: str, index: int) -> str:
    normalized = source_type.strip().lower()
    if "truck" in normalized:
        return "TRUCK"
    if "van" in normalized:
        return "VAN"
    return "TRUCK" if index % 3 == 0 else "VAN"


def build_deliveries(rows: list[dict[str, str]], seed: int) -> tuple[list[DeliveryRow], list[AlertRow], dict[str, float]]:
    deliveries: list[DeliveryRow] = []
    alerts: list[AlertRow] = []
    vehicle_max_weight: dict[str, float] = {}

    for zero_index, raw_row in enumerate(rows):
        index = zero_index + 1
        row = normalize_row_keys(raw_row)
        source_delivery_id = row.get("delivery_id") or f"row-{index}"
        row_identity = f"{source_delivery_id}-{index}"
        region = select_region(row.get("region", ""), row_identity, seed)
        vehicle_index = stable_index(seed, row_identity, "vehicle", modulo=len(VEHICLE_PLATES))
        driver_id = DRIVER_IDS[vehicle_index % len(DRIVER_IDS)]
        vehicle_id = f"VHL-KGL-{vehicle_index + 1:03d}"

        expected_hours = max(0.25, parse_float(row.get("expected_time_hours", ""), 4.0))
        delivery_hours = max(0.25, parse_float(row.get("delivery_time_hours", ""), expected_hours))
        calculated_delay = max(0, int(round((delivery_hours - expected_hours) * 60)))
        delayed = parse_bool(row.get("delayed", ""))
        if delayed and calculated_delay == 0:
            calculated_delay = 5 + stable_index(seed, row_identity, "delay", modulo=25)

        status = normalize_status(row.get("delivery_status", ""), delayed, calculated_delay)
        created_at = BASE_DATE + timedelta(minutes=zero_index)
        estimated_at = created_at + timedelta(hours=expected_hours)
        actual_at = created_at + timedelta(hours=delivery_hours) if status in {"DELIVERED", "DELAYED"} else None
        last_updated_at = actual_at or created_at

        package_weight = parse_float(row.get("package_weight_kg", ""), 0)
        vehicle_max_weight[vehicle_id] = max(vehicle_max_weight.get(vehicle_id, 0), package_weight)

        warehouse_id = warehouse_for_region(str(region["name"]))
        delivery_id = f"DLV-KGL-{index:06d}"
        tracking_number = f"KGL-{index:06d}"
        deliveries.append(
            DeliveryRow(
                id=delivery_id,
                tracking_number=tracking_number,
                vehicle_id=vehicle_id,
                driver_id=driver_id,
                warehouse_id=warehouse_id,
                region=str(region["name"]),
                status=status,
                priority=priority_for(row, calculated_delay),
                estimated_delivery_time=iso(estimated_at),
                actual_delivery_time=iso(actual_at) if actual_at else "",
                delay_minutes=calculated_delay,
                last_updated_at=iso(last_updated_at),
            )
        )

        if status == "DELAYED":
            severity = "HIGH" if calculated_delay >= 30 else "MEDIUM" if calculated_delay >= 10 else "LOW"
            alerts.append(
                AlertRow(
                    id=f"ALT-KGL-{len(alerts) + 1:06d}",
                    alert_type="DELIVERY_DELAY",
                    severity=severity,
                    status="UNRESOLVED",
                    message=f"Delivery {delivery_id} is delayed by {calculated_delay} minutes.",
                    delivery_id=delivery_id,
                    vehicle_id=vehicle_id,
                    region=str(region["name"]),
                    created_at=iso(last_updated_at),
                    resolved_at="",
                )
            )

    return deliveries, alerts, vehicle_max_weight


def warehouse_for_region(region_name: str) -> str:
    if region_name.startswith("Ankara"):
        return "WH-ANK-001"
    if region_name.startswith("Izmir"):
        return "WH-IZM-001"
    if region_name.startswith("Bursa"):
        return "WH-BRS-001"
    return "WH-IST-001"


def read_source(path: Path, max_rows: int | None) -> tuple[list[dict[str, str]], list[str], int]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        source_columns = reader.fieldnames or []
        rows: list[dict[str, str]] = []
        total_rows = 0
        for row in reader:
            total_rows += 1
            if max_rows is None or len(rows) < max_rows:
                rows.append(row)
    return rows, source_columns, total_rows


def write_csv(path: Path, fieldnames: list[str], rows: Iterable[dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def write_regions(output: Path) -> None:
    write_csv(
        output / "regions.csv",
        ["id", "city", "district", "risk_score"],
        (
            {
                "id": region["id"],
                "city": region["city"],
                "district": region["district"],
                "risk_score": region["risk_score"],
            }
            for region in SUPPORTED_REGIONS
        ),
    )


def write_warehouses(output: Path) -> None:
    regions_by_name = {str(region["name"]): region for region in SUPPORTED_REGIONS}
    rows = []
    for warehouse_id, name, region_name, capacity in WAREHOUSES:
        region = regions_by_name[region_name]
        rows.append(
            {
                "id": warehouse_id,
                "name": name,
                "city": region["city"],
                "district": region["district"],
                "latitude": region["latitude"],
                "longitude": region["longitude"],
                "capacity": capacity,
            }
        )
    write_csv(output / "warehouses.csv", ["id", "name", "city", "district", "latitude", "longitude", "capacity"], rows)


def write_vehicles(output: Path, deliveries: list[DeliveryRow], vehicle_max_weight: dict[str, float]) -> None:
    region_by_name = {str(region["name"]): region for region in SUPPORTED_REGIONS}
    by_vehicle_region: dict[str, str] = {}
    by_vehicle_driver: dict[str, str] = {}
    for delivery in deliveries:
        by_vehicle_region.setdefault(delivery.vehicle_id, delivery.region)
        by_vehicle_driver.setdefault(delivery.vehicle_id, delivery.driver_id)

    statuses = ["ACTIVE", "IDLE", "MAINTENANCE", "OFFLINE"]
    rows = []
    for index, plate in enumerate(VEHICLE_PLATES):
        vehicle_id = f"VHL-KGL-{index + 1:03d}"
        region = region_by_name[by_vehicle_region.get(vehicle_id, SUPPORTED_REGIONS[index % len(SUPPORTED_REGIONS)]["name"])]
        max_weight = vehicle_max_weight.get(vehicle_id, 10)
        capacity = max(1000, int(math.ceil(max_weight * 100)))
        status = statuses[index % len(statuses)]
        rows.append(
            {
                "id": vehicle_id,
                "plate": plate,
                "type": vehicle_type_for("", index),
                "capacity": capacity,
                "status": status,
                "current_driver_id": by_vehicle_driver.get(vehicle_id, "") if status in {"ACTIVE", "IDLE"} else "",
                "last_latitude": region["latitude"],
                "last_longitude": region["longitude"],
                "last_seen_at": iso(BASE_DATE + timedelta(minutes=index)),
            }
        )
    write_csv(
        output / "vehicles.csv",
        [
            "id",
            "plate",
            "type",
            "capacity",
            "status",
            "current_driver_id",
            "last_latitude",
            "last_longitude",
            "last_seen_at",
        ],
        rows,
    )


def write_deliveries(output: Path, deliveries: list[DeliveryRow]) -> None:
    write_csv(
        output / "deliveries.csv",
        [
            "id",
            "tracking_number",
            "vehicle_id",
            "driver_id",
            "warehouse_id",
            "region",
            "status",
            "priority",
            "estimated_delivery_time",
            "actual_delivery_time",
            "delay_minutes",
            "last_updated_at",
        ],
        (delivery.__dict__ for delivery in deliveries),
    )


def write_alerts(output: Path, alerts: list[AlertRow]) -> None:
    write_csv(
        output / "alerts.csv",
        [
            "id",
            "alert_type",
            "severity",
            "status",
            "message",
            "delivery_id",
            "vehicle_id",
            "region",
            "created_at",
            "resolved_at",
        ],
        (alert.__dict__ for alert in alerts),
    )


def write_summary(
    output: Path,
    input_path: Path,
    source_columns: list[str],
    raw_rows: int,
    max_rows: int | None,
    deliveries: list[DeliveryRow],
    alerts: list[AlertRow],
) -> None:
    status_counts: dict[str, int] = {}
    for delivery in deliveries:
        status_counts[delivery.status] = status_counts.get(delivery.status, 0) + 1

    summary = {
        "source": "delivery-logistics-dataset",
        "input": str(input_path),
        "sourceColumns": source_columns,
        "rawRows": raw_rows,
        "maxRows": max_rows,
        "deliveries": len(deliveries),
        "vehicles": len(VEHICLE_PLATES),
        "warehouses": len(WAREHOUSES),
        "regions": len(SUPPORTED_REGIONS),
        "alerts": len(alerts),
        "delayedDeliveries": status_counts.get("DELAYED", 0),
        "statusCounts": status_counts,
        "fixedRegions": [region["name"] for region in SUPPORTED_REGIONS],
        "unusedFutureEnrichmentColumns": [
            "delivery_partner",
            "delivery_cost",
            "delivery_rating",
        ],
        "notes": [
            "Unsupported source regions are deterministically assigned to fixed LogiTrack demo regions.",
            "delivery_partner is not persisted in the MVP schema.",
            "package_weight_kg contributes to generated vehicle capacity.",
            "The ETL supports the full 25k-row dataset; the demo import uses 5k rows for local performance.",
        ],
    }
    (output / "import_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Transform Kaggle delivery logistics CSV into LogiTrack seed CSVs.")
    parser.add_argument("--input", type=Path, required=True, help="Path to raw Kaggle original.csv.")
    parser.add_argument("--output", type=Path, required=True, help="Directory for processed LogiTrack CSV files.")
    parser.add_argument("--max-rows", type=int, default=None, help="Optional maximum source rows to transform.")
    parser.add_argument("--seed", type=int, default=42, help="Seed for deterministic generated assignments.")
    args = parser.parse_args()

    if not args.input.exists():
        raise SystemExit(f"Input CSV not found: {args.input}")

    args.output.mkdir(parents=True, exist_ok=True)
    rows, source_columns, raw_rows = read_source(args.input, args.max_rows)
    if not rows:
        raise SystemExit("No source rows found.")

    deliveries, alerts, vehicle_max_weight = build_deliveries(rows, args.seed)
    write_regions(args.output)
    write_warehouses(args.output)
    write_vehicles(args.output, deliveries, vehicle_max_weight)
    write_deliveries(args.output, deliveries)
    write_alerts(args.output, alerts)
    write_summary(args.output, args.input, source_columns, raw_rows, args.max_rows, deliveries, alerts)

    print(f"Read {raw_rows} raw rows from {args.input}")
    print(f"Transformed {len(deliveries)} deliveries into {args.output}")
    print(f"Generated {len(alerts)} delay alerts")


if __name__ == "__main__":
    main()
