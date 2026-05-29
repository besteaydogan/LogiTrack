import json
import os
from datetime import datetime
from urllib import error, request
from uuid import UUID

import psycopg
from confluent_kafka import Consumer


BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "redpanda:9092")
CONSUMER_GROUP_ID = os.getenv("KAFKA_CONSUMER_GROUP_ID", "logitrack-csv-replay-consumer")
AUTO_OFFSET_RESET = os.getenv("KAFKA_AUTO_OFFSET_RESET", "latest")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://logitrack:logitrack@postgres:5432/logitrack",
)
BACKEND_API_BASE_URL = os.getenv("BACKEND_API_BASE_URL", "http://backend-api:8080")
SIMULATION_RESET_ON_START = os.getenv("SIMULATION_RESET_ON_START", "true").lower() == "true"
_initialized_runs: set[str] = set()
TOPICS = [
    "delivery-created",
    "vehicle-location-updated",
    "delivery-status-changed",
    "delivery-delayed",
    "alert-created",
]


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def simulation_run_id(event: dict) -> str:
    run_id = event.get("simulationRunId")
    if not run_id:
        raise ValueError("event is missing simulationRunId")
    UUID(str(run_id))
    return str(run_id)


def reset_live_state(cursor) -> None:
    cursor.execute("TRUNCATE TABLE alerts, delivery_events, vehicle_location_events, deliveries RESTART IDENTITY")
    cursor.execute(
        """
        UPDATE vehicles
        SET last_latitude = NULL,
            last_longitude = NULL,
            last_seen_at = NULL,
            simulation_run_id = NULL
        """
    )
    cursor.execute(
        """
        UPDATE simulation_runs
        SET status = 'STOPPED',
            stopped_at = COALESCE(stopped_at, NOW())
        WHERE status = 'RUNNING'
        """
    )


def ensure_simulation_run(cursor, event: dict) -> str:
    run_id = simulation_run_id(event)
    if run_id not in _initialized_runs:
        if SIMULATION_RESET_ON_START:
            reset_live_state(cursor)
        _initialized_runs.add(run_id)

    cursor.execute(
        """
        INSERT INTO simulation_runs
          (id, status, started_at, current_sequence, total_records, processed_records)
        VALUES (%s, 'RUNNING', %s, %s, %s, 0)
        ON CONFLICT (id) DO UPDATE
        SET status = 'RUNNING',
            current_sequence = GREATEST(simulation_runs.current_sequence, EXCLUDED.current_sequence),
            total_records = GREATEST(simulation_runs.total_records, EXCLUDED.total_records)
        """,
        (
            run_id,
            parse_timestamp(event["timestamp"]),
            int(event.get("sequence") or 0),
            int(event.get("totalRecords") or 0),
        ),
    )
    return run_id


def update_simulation_progress(cursor, event: dict, processed_delivery: bool) -> None:
    cursor.execute(
        """
        UPDATE simulation_runs
        SET current_sequence = GREATEST(current_sequence, %s),
            total_records = GREATEST(total_records, %s),
            processed_records = processed_records + %s
        WHERE id = %s
        """,
        (
            int(event.get("sequence") or 0),
            int(event.get("totalRecords") or 0),
            1 if processed_delivery else 0,
            simulation_run_id(event),
        ),
    )


def handle_location(cursor, event: dict) -> bool:
    event_time = parse_timestamp(event["timestamp"])
    run_id = simulation_run_id(event)
    cursor.execute(
        """
        INSERT INTO vehicle_location_events
          (vehicle_id, latitude, longitude, speed, fuel_level, event_time, simulation_run_id, sequence)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            event["vehicleId"],
            event["latitude"],
            event["longitude"],
            event.get("speed"),
            event.get("fuelLevel"),
            event_time,
            run_id,
            event.get("sequence"),
        ),
    )
    cursor.execute(
        """
        UPDATE vehicles
        SET last_latitude = %s,
            last_longitude = %s,
            last_seen_at = %s,
            simulation_run_id = %s,
            status = CASE WHEN status = 'OFFLINE' THEN 'ACTIVE' ELSE status END
        WHERE id = %s
        """,
        (event["latitude"], event["longitude"], event_time, run_id, event["vehicleId"]),
    )
    return False


def handle_delivery_created(cursor, event: dict) -> bool:
    event_time = parse_timestamp(event["timestamp"])
    estimated_time = parse_timestamp(event["estimatedDeliveryTime"])
    actual_time = parse_timestamp(event["actualDeliveryTime"]) if event.get("actualDeliveryTime") else None
    run_id = simulation_run_id(event)
    cursor.execute("SELECT 1 FROM deliveries WHERE id = %s", (event["deliveryId"],))
    is_new_delivery = cursor.fetchone() is None
    cursor.execute(
        """
        INSERT INTO deliveries
          (id, tracking_number, vehicle_id, driver_id, warehouse_id, region, status, priority,
           estimated_delivery_time, actual_delivery_time, delay_minutes, last_updated_at,
           simulation_run_id, sequence, event_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE
        SET tracking_number = EXCLUDED.tracking_number,
            vehicle_id = EXCLUDED.vehicle_id,
            driver_id = EXCLUDED.driver_id,
            warehouse_id = EXCLUDED.warehouse_id,
            region = EXCLUDED.region,
            priority = EXCLUDED.priority,
            estimated_delivery_time = EXCLUDED.estimated_delivery_time,
            actual_delivery_time = COALESCE(deliveries.actual_delivery_time, EXCLUDED.actual_delivery_time),
            delay_minutes = GREATEST(deliveries.delay_minutes, EXCLUDED.delay_minutes),
            last_updated_at = GREATEST(deliveries.last_updated_at, EXCLUDED.last_updated_at),
            simulation_run_id = EXCLUDED.simulation_run_id,
            sequence = EXCLUDED.sequence,
            event_time = EXCLUDED.event_time
        """,
        (
            event["deliveryId"],
            event["trackingNumber"],
            event["vehicleId"],
            event["driverId"],
            event["warehouseId"],
            event["region"],
            event["status"],
            event["priority"],
            estimated_time,
            actual_time,
            event.get("delayMinutes", 0),
            event_time,
            run_id,
            event.get("sequence"),
            event_time,
        ),
    )
    return is_new_delivery


def handle_status_changed(cursor, event: dict) -> bool:
    event_time = parse_timestamp(event["timestamp"])
    run_id = simulation_run_id(event)
    cursor.execute(
        """
        UPDATE deliveries
        SET status = %s,
            actual_delivery_time = CASE WHEN %s = 'DELIVERED' THEN %s ELSE actual_delivery_time END,
            last_updated_at = %s
        WHERE id = %s
        """,
        (event["newStatus"], event["newStatus"], event_time, event_time, event["deliveryId"]),
    )
    cursor.execute(
        """
        INSERT INTO delivery_events
          (delivery_id, event_type, old_status, new_status, event_time, simulation_run_id, sequence)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            event["deliveryId"],
            event["eventType"],
            event.get("oldStatus"),
            event["newStatus"],
            event_time,
            run_id,
            event.get("sequence"),
        ),
    )
    return False


def handle_delayed(cursor, event: dict) -> bool:
    event_time = parse_timestamp(event["timestamp"])
    run_id = simulation_run_id(event)
    cursor.execute(
        """
        UPDATE deliveries
        SET status = 'DELAYED',
            delay_minutes = GREATEST(delay_minutes, %s),
            last_updated_at = %s
        WHERE id = %s
        """,
        (event["delayMinutes"], event_time, event["deliveryId"]),
    )
    cursor.execute(
        """
        INSERT INTO delivery_events
          (delivery_id, event_type, old_status, new_status, event_time, simulation_run_id, sequence)
        VALUES (%s, %s, %s, 'DELAYED', %s, %s, %s)
        """,
        (event["deliveryId"], event["eventType"], "IN_TRANSIT", event_time, run_id, event.get("sequence")),
    )
    return False


def handle_alert(cursor, event: dict) -> bool:
    created_at = parse_timestamp(event["timestamp"])
    run_id = simulation_run_id(event)
    cursor.execute(
        """
        INSERT INTO alerts
          (id, alert_type, severity, status, message, delivery_id, vehicle_id, region, created_at, resolved_at,
           simulation_run_id, sequence, event_time)
        VALUES (%s, %s, %s, 'UNRESOLVED', %s, %s, %s, %s, %s, NULL, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING
        """,
        (
            event["alertId"],
            event["alertType"],
            event["severity"],
            event["message"],
            event.get("deliveryId"),
            event.get("vehicleId"),
            event["region"],
            created_at,
            run_id,
            event.get("sequence"),
            created_at,
        ),
    )
    return False


HANDLERS = {
    "delivery.created": handle_delivery_created,
    "vehicle.location.updated": handle_location,
    "delivery.status.changed": handle_status_changed,
    "delivery.delayed": handle_delayed,
    "alert.created": handle_alert,
}


def live_event_payload(event: dict) -> dict:
    status = event.get("status") or event.get("newStatus")
    return {
        "eventType": event.get("eventType"),
        "vehicleId": event.get("vehicleId"),
        "deliveryId": event.get("deliveryId"),
        "alertId": event.get("alertId"),
        "region": event.get("region"),
        "latitude": event.get("latitude"),
        "longitude": event.get("longitude"),
        "status": status,
        "speed": event.get("speed"),
        "delayMinutes": event.get("delayMinutes"),
        "severity": event.get("severity"),
        "message": event.get("message") or default_message(event, status),
        "timestamp": event.get("timestamp"),
        "sequence": event.get("sequence"),
        "simulationRunId": event.get("simulationRunId"),
        "processedRecords": event.get("processedRecords"),
        "totalRecords": event.get("totalRecords"),
        "simulationIntervalSeconds": event.get("simulationIntervalSeconds"),
        "trackingNumber": event.get("trackingNumber"),
        "driverId": event.get("driverId"),
        "warehouseId": event.get("warehouseId"),
        "priority": event.get("priority"),
        "estimatedDeliveryTime": event.get("estimatedDeliveryTime"),
        "actualDeliveryTime": event.get("actualDeliveryTime"),
    }


def default_message(event: dict, status: str | None) -> str:
    event_type = event.get("eventType")
    if event_type == "vehicle.location.updated":
        return f"Vehicle {event.get('vehicleId')} location updated."
    if event_type == "delivery.created":
        return f"Delivery {event.get('deliveryId')} created."
    if event_type == "delivery.status.changed":
        return f"Delivery {event.get('deliveryId')} status changed to {status}."
    if event_type == "delivery.delayed":
        return f"Delivery {event.get('deliveryId')} delayed by {event.get('delayMinutes')} minutes."
    if event_type == "alert.created":
        return f"Alert {event.get('alertId')} created."
    return f"Processed event {event_type}."


def publish_live_event(event: dict) -> None:
    url = f"{BACKEND_API_BASE_URL.rstrip('/')}/api/internal/live-events"
    payload = json.dumps(live_event_payload(event)).encode("utf-8")
    live_request = request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(live_request, timeout=5) as response:
            if response.status >= 300:
                print(f"live publish returned HTTP {response.status}", flush=True)
    except (error.URLError, TimeoutError) as exception:
        print(f"live publish failed: {exception}", flush=True)


def main() -> None:
    consumer = Consumer(
        {
            "bootstrap.servers": BOOTSTRAP_SERVERS,
            "group.id": CONSUMER_GROUP_ID,
            "auto.offset.reset": AUTO_OFFSET_RESET,
            "enable.auto.commit": False,
        }
    )
    consumer.subscribe(TOPICS)
    print(f"stream consumer subscribed to {', '.join(TOPICS)}", flush=True)

    with psycopg.connect(DATABASE_URL) as connection:
        while True:
            message = consumer.poll(1.0)
            if message is None:
                continue
            if message.error():
                print(f"consumer error: {message.error()}", flush=True)
                continue

            try:
                event = json.loads(message.value().decode("utf-8"))
            except json.JSONDecodeError as exception:
                print(f"malformed message was not committed: {exception}", flush=True)
                continue

            handler = HANDLERS.get(event.get("eventType"))
            if handler is None:
                print(f"ignored unknown event: {event}", flush=True)
                consumer.commit(message)
                continue

            try:
                with connection.transaction():
                    with connection.cursor() as cursor:
                        ensure_simulation_run(cursor, event)
                        processed_delivery = handler(cursor, event)
                        update_simulation_progress(cursor, event, processed_delivery)
                        if processed_delivery:
                            event["processedRecords"] = processed_count(cursor, event)
            except psycopg.Error as exception:
                print(
                    f"database write failed; offset not committed for {event.get('eventType')}: {exception}",
                    flush=True,
                )
                continue

            publish_live_event(event)
            consumer.commit(message)
            print(f"processed {event['eventType']}", flush=True)


def processed_count(cursor, event: dict) -> int:
    cursor.execute("SELECT processed_records FROM simulation_runs WHERE id = %s", (simulation_run_id(event),))
    row = cursor.fetchone()
    return int(row[0]) if row else 0


if __name__ == "__main__":
    main()
