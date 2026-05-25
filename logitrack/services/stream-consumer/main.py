import json
import os
from datetime import datetime

import psycopg
from confluent_kafka import Consumer
from confluent_kafka.admin import AdminClient, NewTopic


BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "redpanda:9092")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://logitrack:logitrack@postgres:5432/logitrack",
)
TOPICS = [
    "vehicle-location-updated",
    "delivery-status-changed",
    "delivery-delayed",
    "alert-created",
]


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def handle_location(cursor, event: dict) -> None:
    event_time = parse_timestamp(event["timestamp"])
    cursor.execute(
        """
        INSERT INTO vehicle_location_events
          (vehicle_id, latitude, longitude, speed, fuel_level, event_time)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            event["vehicleId"],
            event["latitude"],
            event["longitude"],
            event.get("speed"),
            event.get("fuelLevel"),
            event_time,
        ),
    )
    cursor.execute(
        """
        UPDATE vehicles
        SET last_latitude = %s,
            last_longitude = %s,
            last_seen_at = %s,
            status = CASE WHEN status = 'OFFLINE' THEN 'ACTIVE' ELSE status END
        WHERE id = %s
        """,
        (event["latitude"], event["longitude"], event_time, event["vehicleId"]),
    )


def handle_status_changed(cursor, event: dict) -> None:
    event_time = parse_timestamp(event["timestamp"])
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
          (delivery_id, event_type, old_status, new_status, event_time)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            event["deliveryId"],
            event["eventType"],
            event.get("oldStatus"),
            event["newStatus"],
            event_time,
        ),
    )


def handle_delayed(cursor, event: dict) -> None:
    event_time = parse_timestamp(event["timestamp"])
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
          (delivery_id, event_type, old_status, new_status, event_time)
        VALUES (%s, %s, %s, 'DELAYED', %s)
        """,
        (event["deliveryId"], event["eventType"], "IN_TRANSIT", event_time),
    )


def handle_alert(cursor, event: dict) -> None:
    created_at = parse_timestamp(event["timestamp"])
    cursor.execute(
        """
        INSERT INTO alerts
          (id, alert_type, severity, status, message, delivery_id, vehicle_id, region, created_at, resolved_at)
        VALUES (%s, %s, %s, 'UNRESOLVED', %s, %s, %s, %s, %s, NULL)
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
        ),
    )


HANDLERS = {
    "vehicle.location.updated": handle_location,
    "delivery.status.changed": handle_status_changed,
    "delivery.delayed": handle_delayed,
    "alert.created": handle_alert,
}


def ensure_topics() -> None:
    admin = AdminClient({"bootstrap.servers": BOOTSTRAP_SERVERS})
    topics = [NewTopic(topic, num_partitions=1, replication_factor=1) for topic in TOPICS]
    futures = admin.create_topics(topics)
    for topic, future in futures.items():
        try:
            future.result()
            print(f"created topic {topic}", flush=True)
        except Exception as exception:
            if "already exists" not in str(exception).lower():
                print(f"topic {topic} not created: {exception}", flush=True)


def main() -> None:
    ensure_topics()
    consumer = Consumer(
        {
            "bootstrap.servers": BOOTSTRAP_SERVERS,
            "group.id": "logitrack-stream-consumer",
            "auto.offset.reset": "earliest",
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

            event = json.loads(message.value().decode("utf-8"))
            handler = HANDLERS.get(event.get("eventType"))
            if handler is None:
                print(f"ignored unknown event: {event}", flush=True)
                consumer.commit(message)
                continue

            with connection.transaction():
                with connection.cursor() as cursor:
                    handler(cursor, event)
            consumer.commit(message)
            print(f"processed {event['eventType']}", flush=True)


if __name__ == "__main__":
    main()
