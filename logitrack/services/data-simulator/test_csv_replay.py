from datetime import datetime, timezone

from csv_replay import build_events


def test_csv_replay_uses_runtime_timestamp_for_events():
    row = {
        "id": "DLV-KGL-000001",
        "tracking_number": "TRK-KGL-000001",
        "vehicle_id": "VHL-KGL-001",
        "driver_id": "DRV-KGL-001",
        "warehouse_id": "WH-ANK-001",
        "region": "Ankara-Cankaya",
        "status": "DELAYED",
        "priority": "HIGH",
        "estimated_delivery_time": "1970-01-01T01:00:00+00:00",
        "actual_delivery_time": "",
        "delay_minutes": "35",
        "last_updated_at": "1970-01-01T00:00:00+00:00",
    }

    before = datetime.now(timezone.utc)
    events = build_events(
        row,
        row_number=1,
        base_sequence=1,
        seed=42,
        run_id="00000000-0000-0000-0000-000000000001",
        processed_records=1,
        total_records=5000,
        interval_seconds=5,
    )
    after = datetime.now(timezone.utc)

    assert events
    assert {event["timestamp"] for event in events} != {row["last_updated_at"]}

    for event in events:
        timestamp = datetime.fromisoformat(str(event["timestamp"]))
        assert before <= timestamp <= after
        assert event["sequence"] == 1
        assert event["simulationRunId"] == "00000000-0000-0000-0000-000000000001"
        assert event["processedRecords"] == 1
        assert event["totalRecords"] == 5000
        assert event["simulationIntervalSeconds"] == 5
