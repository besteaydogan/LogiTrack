import argparse
import json
import sys
import time
from typing import Any
from urllib import error, request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Call LogiTrack live simulation ticks on an interval.")
    parser.add_argument("--base-url", default="http://localhost:8080", help="Backend API base URL.")
    parser.add_argument("--interval", default=3.0, type=float, help="Seconds between simulation ticks.")
    parser.add_argument("--max-events", default=0, type=int, help="Stop after this many ticks. 0 runs forever.")
    parser.add_argument("--seed", default=42, type=int, help="Accepted for repeatable run metadata; backend owns event selection.")
    return parser.parse_args()


def post_tick(base_url: str) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/api/simulation/tick"
    req = request.Request(url, data=b"{}", headers={"Content-Type": "application/json"}, method="POST")

    with request.urlopen(req, timeout=10) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def event_line(index: int, event: dict[str, Any]) -> str:
    event_type = event.get("eventType", "unknown")
    vehicle_id = event.get("vehicleId")
    delivery_id = event.get("deliveryId")
    alert_id = event.get("alertId")
    region = event.get("region")
    status = event.get("status")
    severity = event.get("severity")
    identifier = alert_id or delivery_id or vehicle_id or "no-id"
    suffix = severity or status or region or ""
    return f"[{index}] {event_type:<24} | {identifier} | {suffix}"


def main() -> int:
    args = parse_args()
    count = 0

    print(
        f"Starting LogiTrack live simulation: base_url={args.base_url}, "
        f"interval={args.interval}s, max_events={args.max_events or 'unlimited'}, seed={args.seed}"
    )

    while args.max_events <= 0 or count < args.max_events:
        count += 1

        try:
            event = post_tick(args.base_url)
        except error.URLError as exc:
            print(f"[{count}] backend unavailable: {exc}", file=sys.stderr)
            return 1
        except TimeoutError:
            print(f"[{count}] backend request timed out", file=sys.stderr)
            return 1
        except json.JSONDecodeError as exc:
            print(f"[{count}] invalid backend response: {exc}", file=sys.stderr)
            return 1

        print(event_line(count, event), flush=True)

        if args.max_events > 0 and count >= args.max_events:
            break

        time.sleep(args.interval)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
