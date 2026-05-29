import argparse
import csv
import hashlib
import json
import os
import random
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

DEFAULT_CSV = Path(os.getenv("SIMULATOR_CSV_PATH", "data/processed/kaggle/deliveries.csv"))
BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "redpanda:9092")
SIMULATION_INTERVAL_SECONDS = float(os.getenv("SIMULATION_INTERVAL_SECONDS", os.getenv("SIMULATOR_MIN_DELAY_SECONDS", "5")))
SIMULATION_MAX_EVENTS = int(os.getenv("SIMULATION_MAX_EVENTS", os.getenv("SIMULATOR_MAX_ROWS", "100")))
SIMULATION_LOOP = os.getenv("SIMULATION_LOOP", "false").lower() == "true"
SIMULATION_RESET_ON_START = os.getenv("SIMULATION_RESET_ON_START", "true").lower() == "true"
SEED = int(os.getenv("SIMULATOR_ROUTE_SEED", "42"))

TOPICS = {
    "delivery.created": "delivery-created",
    "vehicle.location.updated": "vehicle-location-updated",
    "delivery.status.changed": "delivery-status-changed",
    "delivery.delayed": "delivery-delayed",
    "alert.created": "alert-created",
}

REQUIRED_FIELDS = {
    "delivery.created": [
        "eventId",
        "eventType",
        "timestamp",
        "sequence",
        "deliveryId",
        "trackingNumber",
        "vehicleId",
        "driverId",
        "warehouseId",
        "region",
        "status",
        "priority",
        "estimatedDeliveryTime",
        "delayMinutes",
    ],
    "vehicle.location.updated": ["eventId", "eventType", "timestamp", "sequence", "vehicleId", "latitude", "longitude", "status"],
    "delivery.status.changed": ["eventId", "eventType", "timestamp", "sequence", "deliveryId", "oldStatus", "newStatus"],
    "delivery.delayed": ["eventId", "eventType", "timestamp", "sequence", "deliveryId", "delayMinutes", "severity"],
    "alert.created": ["eventId", "eventType", "timestamp", "sequence", "alertId", "alertType", "severity", "message"],
}

WAREHOUSE_COORDINATES = {
    "WH-ANK-001": (39.9208, 32.8541),
    "WH-ANK-01": (39.9208, 32.8541),
    "WH-IST-001": (40.9903, 29.0290),
    "WH-IST-01": (40.9903, 29.0290),
    "WH-IZM-001": (38.4192, 27.1287),
    "WH-BRS-001": (40.2167, 28.9833),
}

REGION_COORDINATES = {
    "Ankara-Cankaya": (39.9208, 32.8541),
    "Istanbul-Kadikoy": (40.9903, 29.0290),
    "Istanbul-Sisli": (41.0605, 28.9872),
    "Izmir-Konak": (38.4192, 27.1287),
    "Bursa-Nilufer": (40.2167, 28.9833),
}

STATUS_PROGRESS = {
    "CREATED": 0.05,
    "ASSIGNED": 0.18,
    "IN_TRANSIT": 0.58,
    "DELAYED": 0.72,
    "DELIVERED": 1.0,
    "CANCELLED": 0.12,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Replay LogiTrack deliveries.csv rows as Kafka events.")
    parser.add_argument("--csv", default=str(DEFAULT_CSV), help="Path to processed deliveries.csv.")
    parser.add_argument("--dry-run", action="store_true", help="Print events without sending them to Kafka.")
    parser.add_argument("--bootstrap-servers", default=BOOTSTRAP_SERVERS, help="Kafka/Redpanda bootstrap servers.")
    parser.add_argument("--interval", default=SIMULATION_INTERVAL_SECONDS, type=float, help="Seconds between replayed CSV rows.")
    parser.add_argument("--max-events", default=SIMULATION_MAX_EVENTS, type=int, help="Stop after this many CSV rows. 0 reads all rows.")
    parser.add_argument("--max-rows", type=int, help="Backward-compatible alias for --max-events.")
    parser.add_argument("--loop", action="store_true", default=SIMULATION_LOOP, help="Loop over the selected CSV rows indefinitely.")
    parser.add_argument("--seed", default=SEED, type=int, help="Seed for deterministic route jitter and replay delay.")
    return parser.parse_args()


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def stable_float(seed: int, *parts: object, minimum: float, maximum: float) -> float:
    payload = ":".join(str(part) for part in (seed, *parts))
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    ratio = int(digest[:10], 16) / float(0xFFFFFFFFFF)
    return minimum + ((maximum - minimum) * ratio)


def route_position(row: dict[str, str], sequence: int, seed: int) -> tuple[float, float]:
    start = WAREHOUSE_COORDINATES.get(row["warehouse_id"], REGION_COORDINATES.get(row["region"], (39.9334, 32.8597)))
    end = REGION_COORDINATES.get(row["region"], start)
    status = row["status"]
    base_progress = STATUS_PROGRESS.get(status, 0.5)
    sequence_adjustment = stable_float(seed, row["vehicle_id"], sequence, "progress", minimum=-0.04, maximum=0.04)
    progress = min(1.0, max(0.0, base_progress + sequence_adjustment))
    jitter_lat = stable_float(seed, row["vehicle_id"], row["id"], "lat", minimum=-0.004, maximum=0.004)
    jitter_lon = stable_float(seed, row["vehicle_id"], row["id"], "lon", minimum=-0.004, maximum=0.004)

    latitude = start[0] + ((end[0] - start[0]) * progress) + jitter_lat
    longitude = start[1] + ((end[1] - start[1]) * progress) + jitter_lon
    return round(latitude, 6), round(longitude, 6)


def severity_for_delay(delay_minutes: int) -> str:
    if delay_minutes >= 30:
        return "HIGH"
    if delay_minutes >= 10:
        return "MEDIUM"
    return "LOW"


def event_id(event_type: str, delivery_id: str, sequence: int) -> str:
    slug = event_type.replace(".", "-")
    return f"evt-{sequence:06d}-{slug}-{delivery_id}".lower()


def as_int(value: str, default: int = 0) -> int:
    try:
        return int(value)
    except ValueError:
        return default


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_events(
    row: dict[str, str],
    row_number: int,
    base_sequence: int,
    seed: int,
    run_id: str,
    processed_records: int,
    total_records: int,
    interval_seconds: float,
) -> list[dict[str, object]]:
    timestamp = utc_now()
    status = row["status"]
    delay_minutes = as_int(row["delay_minutes"])
    latitude, longitude = route_position(row, row_number, seed)
    events: list[dict[str, object]] = []

    created_sequence = base_sequence
    events.append({
        "eventId": event_id("delivery.created", row["id"], created_sequence),
        "eventType": "delivery.created",
        "source": "csv-replay",
        "timestamp": timestamp,
        "sequence": created_sequence,
        "simulationRunId": run_id,
        "processedRecords": processed_records,
        "totalRecords": total_records,
        "simulationIntervalSeconds": int(interval_seconds),
        "deliveryId": row["id"],
        "trackingNumber": row["tracking_number"],
        "vehicleId": row["vehicle_id"],
        "driverId": row["driver_id"],
        "warehouseId": row["warehouse_id"],
        "region": row["region"],
        "status": status,
        "priority": row["priority"],
        "estimatedDeliveryTime": row["estimated_delivery_time"],
        "actualDeliveryTime": row["actual_delivery_time"] or None,
        "delayMinutes": delay_minutes,
        "message": f"Delivery {row['id']} replayed from CSV.",
    })

    location_sequence = base_sequence
    speed = 0 if status in {"DELIVERED", "CANCELLED"} else int(stable_float(seed, row["vehicle_id"], row_number, "speed", minimum=18, maximum=72))
    fuel_level = int(stable_float(seed, row["vehicle_id"], row_number, "fuel", minimum=25, maximum=96))
    events.append({
        "eventId": event_id("vehicle.location.updated", row["id"], location_sequence),
        "eventType": "vehicle.location.updated",
        "source": "csv-replay",
        "timestamp": timestamp,
        "sequence": location_sequence,
        "simulationRunId": run_id,
        "processedRecords": processed_records,
        "totalRecords": total_records,
        "simulationIntervalSeconds": int(interval_seconds),
        "vehicleId": row["vehicle_id"],
        "deliveryId": row["id"],
        "region": row["region"],
        "latitude": latitude,
        "longitude": longitude,
        "status": "IDLE" if status in {"DELIVERED", "CANCELLED"} else "ACTIVE",
        "speed": speed,
        "fuelLevel": fuel_level,
        "message": f"Vehicle {row['vehicle_id']} moved along deterministic CSV replay route.",
    })

    if status == "DELAYED":
        severity = severity_for_delay(delay_minutes)
        delayed_sequence = base_sequence
        events.append({
            "eventId": event_id("delivery.delayed", row["id"], delayed_sequence),
            "eventType": "delivery.delayed",
            "source": "csv-replay",
            "timestamp": timestamp,
            "sequence": delayed_sequence,
            "simulationRunId": run_id,
            "processedRecords": processed_records,
            "totalRecords": total_records,
            "simulationIntervalSeconds": int(interval_seconds),
            "deliveryId": row["id"],
            "vehicleId": row["vehicle_id"],
            "region": row["region"],
            "delayMinutes": max(1, delay_minutes),
            "severity": severity,
            "message": f"Delivery {row['id']} is delayed by {max(1, delay_minutes)} minutes.",
        })
        alert_sequence = base_sequence
        events.append({
            "eventId": event_id("alert.created", row["id"], alert_sequence),
            "eventType": "alert.created",
            "source": "csv-replay",
            "timestamp": timestamp,
            "sequence": alert_sequence,
            "simulationRunId": run_id,
            "processedRecords": processed_records,
            "totalRecords": total_records,
            "simulationIntervalSeconds": int(interval_seconds),
            "alertId": f"ALT-CSV-{row_number:06d}",
            "alertType": "DELIVERY_DELAY",
            "severity": severity,
            "deliveryId": row["id"],
            "vehicleId": row["vehicle_id"],
            "region": row["region"],
            "message": f"Delivery {row['id']} is delayed by {max(1, delay_minutes)} minutes.",
        })
    elif status in {"ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"}:
        status_sequence = base_sequence
        events.append({
            "eventId": event_id("delivery.status.changed", row["id"], status_sequence),
            "eventType": "delivery.status.changed",
            "source": "csv-replay",
            "timestamp": timestamp,
            "sequence": status_sequence,
            "simulationRunId": run_id,
            "processedRecords": processed_records,
            "totalRecords": total_records,
            "simulationIntervalSeconds": int(interval_seconds),
            "deliveryId": row["id"],
            "vehicleId": row["vehicle_id"],
            "region": row["region"],
            "oldStatus": "CREATED",
            "newStatus": status,
            "message": f"Delivery {row['id']} status changed to {status}.",
        })

    for event in events:
        validate_event(event)

    return events


def validate_event(event: dict[str, object]) -> None:
    event_type = str(event.get("eventType", ""))
    missing = [field for field in REQUIRED_FIELDS.get(event_type, []) if field not in event or event[field] is None]
    if missing:
        raise ValueError(f"{event_type} is missing required fields: {', '.join(missing)}")


def event_key(event: dict[str, object]) -> str | None:
    return str(event.get("vehicleId") or event.get("deliveryId") or event.get("alertId") or event.get("eventId"))


def delivery_report(error, message) -> None:
    if error is not None:
        print(f"delivery failed: {error}", flush=True)
        return
    print(f"sent {message.topic()} [{message.partition()}] offset {message.offset()}", flush=True)


def publish_events(producer, events: Iterable[dict[str, object]], dry_run: bool) -> None:
    for event in events:
        payload = json.dumps(event, sort_keys=True)
        if dry_run:
            print(payload, flush=True)
            continue

        topic = TOPICS[str(event["eventType"])]
        producer.produce(topic, key=event_key(event), value=payload.encode("utf-8"), callback=delivery_report)
        producer.poll(0)
        producer.flush(5)

    if producer is not None:
        producer.flush(5)


def replay_once(
    rows: list[dict[str, str]],
    args: argparse.Namespace,
    producer,
    run_id: str,
    total_records: int,
) -> int:
    total_events = 0
    for row_index, row in enumerate(rows, start=1):
        base_sequence = row_index
        events = build_events(
            row,
            row_index,
            base_sequence,
            args.seed,
            run_id,
            row_index,
            total_records,
            args.interval,
        )
        publish_events(producer, events, args.dry_run)
        total_events += len(events)

        if not args.dry_run and row_index < len(rows):
            time.sleep(args.interval)

    return total_events


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    if args.interval < 0:
        raise SystemExit("--interval must be greater than or equal to zero")

    rows = read_rows(csv_path)
    if not rows:
        raise SystemExit("No CSV rows found.")
    max_events = args.max_rows if args.max_rows is not None else args.max_events
    replay_rows = rows[:max_events] if max_events > 0 else rows
    run_id = str(uuid.uuid4())

    producer = None
    if not args.dry_run:
        from confluent_kafka import Producer
        producer = Producer({"bootstrap.servers": args.bootstrap_servers})
    print(
        f"csv replay starting: csv={csv_path}, rows={len(replay_rows)}, total_records={len(rows)}, "
        f"interval={args.interval}, run_id={run_id}, reset_on_start={SIMULATION_RESET_ON_START}, "
        f"dry_run={args.dry_run}, bootstrap={args.bootstrap_servers}, seed={args.seed}",
        flush=True,
    )

    total_events = 0
    while True:
        total_events += replay_once(replay_rows, args, producer, run_id, len(rows))
        if not args.loop:
            break

    print(f"csv replay complete: events={total_events}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
