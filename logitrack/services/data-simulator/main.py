import json
import os
import random
import time
import uuid
from datetime import datetime, timezone

from confluent_kafka import Producer
from confluent_kafka.admin import AdminClient, NewTopic


BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "redpanda:9092")
INTERVAL_SECONDS = float(os.getenv("SIMULATOR_INTERVAL_SECONDS", "4"))

TOPICS = {
    "vehicle.location.updated": "vehicle-location-updated",
    "delivery.status.changed": "delivery-status-changed",
    "delivery.delayed": "delivery-delayed",
    "alert.created": "alert-created",
}

VEHICLES = ["VHL-001", "VHL-002", "VHL-003", "VHL-004", "VHL-007"]
DELIVERIES = [
    "DLV-5001",
    "DLV-5002",
    "DLV-5005",
    "DLV-5007",
    "DLV-5014",
    "DLV-5018",
    "DLV-5020",
    "DLV-5025",
]
REGIONS = ["Ankara-Cankaya", "Istanbul-Kadikoy", "Istanbul-Sisli", "Izmir-Konak", "Bursa-Nilufer"]
STATUSES = ["ASSIGNED", "IN_TRANSIT", "DELAYED", "DELIVERED"]
SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def location_event() -> dict:
    return {
        "eventType": "vehicle.location.updated",
        "vehicleId": random.choice(VEHICLES),
        "latitude": round(random.uniform(38.3, 41.1), 6),
        "longitude": round(random.uniform(27.0, 32.9), 6),
        "speed": random.randint(0, 72),
        "fuelLevel": random.randint(18, 95),
        "timestamp": utc_now(),
    }


def status_event() -> dict:
    old_status = random.choice(STATUSES[:-1])
    new_status = random.choice([status for status in STATUSES if status != old_status])
    return {
        "eventType": "delivery.status.changed",
        "deliveryId": random.choice(DELIVERIES),
        "oldStatus": old_status,
        "newStatus": new_status,
        "timestamp": utc_now(),
    }


def delayed_event() -> dict:
    delivery_id = random.choice(DELIVERIES)
    vehicle_id = random.choice(VEHICLES)
    delay_minutes = random.randint(10, 55)
    severity = random.choice(["MEDIUM", "HIGH", "CRITICAL"])
    return {
        "eventType": "delivery.delayed",
        "deliveryId": delivery_id,
        "vehicleId": vehicle_id,
        "region": random.choice(REGIONS),
        "delayMinutes": delay_minutes,
        "severity": severity,
        "timestamp": utc_now(),
    }


def alert_event() -> dict:
    delivery_id = random.choice(DELIVERIES)
    vehicle_id = random.choice(VEHICLES)
    severity = random.choice(SEVERITIES)
    return {
        "eventType": "alert.created",
        "alertId": f"ALT-SIM-{uuid.uuid4().hex[:8].upper()}",
        "deliveryId": delivery_id,
        "vehicleId": vehicle_id,
        "alertType": random.choice(["DELIVERY_DELAY", "ROUTE_UPDATED", "VEHICLE_OFFLINE"]),
        "severity": severity,
        "region": random.choice(REGIONS),
        "message": f"Simulated {severity.lower()} alert for {delivery_id}.",
        "timestamp": utc_now(),
    }


EVENT_BUILDERS = [location_event, status_event, delayed_event, alert_event]


def ensure_topics() -> None:
    admin = AdminClient({"bootstrap.servers": BOOTSTRAP_SERVERS})
    topics = [NewTopic(topic, num_partitions=1, replication_factor=1) for topic in TOPICS.values()]
    futures = admin.create_topics(topics)
    for topic, future in futures.items():
        try:
            future.result()
            print(f"created topic {topic}", flush=True)
        except Exception as exception:
            if "already exists" not in str(exception).lower():
                print(f"topic {topic} not created: {exception}", flush=True)


def delivery_report(error, message) -> None:
    if error is not None:
        print(f"delivery failed: {error}", flush=True)
        return
    print(f"sent {message.topic()} [{message.partition()}] offset {message.offset()}", flush=True)


def main() -> None:
    ensure_topics()
    producer = Producer({"bootstrap.servers": BOOTSTRAP_SERVERS})
    print(f"data simulator connected to {BOOTSTRAP_SERVERS}", flush=True)

    while True:
        event = random.choice(EVENT_BUILDERS)()
        topic = TOPICS[event["eventType"]]
        producer.produce(
            topic,
            key=event.get("vehicleId") or event.get("deliveryId") or event.get("alertId"),
            value=json.dumps(event).encode("utf-8"),
            callback=delivery_report,
        )
        producer.poll(0)
        producer.flush(5)
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
