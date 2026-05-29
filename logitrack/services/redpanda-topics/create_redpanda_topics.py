import os
import sys
import time

from confluent_kafka.admin import AdminClient, NewTopic


BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "redpanda:9092")
TOPICS = [
    "delivery-created",
    "vehicle-location-updated",
    "delivery-status-changed",
    "delivery-delayed",
    "alert-created",
]


def admin_client() -> AdminClient:
    return AdminClient({"bootstrap.servers": BOOTSTRAP_SERVERS})


def wait_for_broker(timeout_seconds: int = 60) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        try:
            metadata = admin_client().list_topics(timeout=5)
            if metadata.brokers:
                return
        except Exception as exception:
            last_error = exception

        time.sleep(2)

    raise RuntimeError(f"Redpanda broker was not ready at {BOOTSTRAP_SERVERS}: {last_error}")


def create_topics() -> None:
    admin = admin_client()
    topics = [NewTopic(topic, num_partitions=1, replication_factor=1) for topic in TOPICS]
    futures = admin.create_topics(topics)

    for topic, future in futures.items():
        try:
            future.result()
            print(f"created topic {topic}", flush=True)
        except Exception as exception:
            message = str(exception).lower()
            if "already exists" in message or "topic_already_exists" in message:
                print(f"topic {topic} already exists", flush=True)
                continue

            raise


def main() -> int:
    print(f"creating Redpanda topics on {BOOTSTRAP_SERVERS}", flush=True)
    wait_for_broker()
    create_topics()
    print("Redpanda topic creation complete", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exception:
        print(f"topic creation failed: {exception}", file=sys.stderr, flush=True)
        raise SystemExit(1)
