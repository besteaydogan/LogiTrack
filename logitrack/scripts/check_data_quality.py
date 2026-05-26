#!/usr/bin/env python3
"""Run data quality checks against the LogiTrack PostgreSQL schema."""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass

try:
    import psycopg
except ImportError as exc:  # pragma: no cover - runtime guidance
    raise SystemExit(
        "Missing dependency: psycopg. Install with `pip install psycopg[binary]` "
        "or run from the stream-consumer Python environment."
    ) from exc


DEFAULT_DATABASE_URL = "postgresql://logitrack:logitrack@localhost:55432/logitrack"


@dataclass(frozen=True)
class Check:
    name: str
    severity: str
    sql: str
    expected: int = 0


CHECKS = [
    Check(
        "duplicate_delivery_tracking_numbers",
        "critical",
        """
        SELECT COUNT(*) FROM (
          SELECT tracking_number FROM deliveries
          GROUP BY tracking_number
          HAVING COUNT(*) > 1
        ) duplicate_tracking
        """,
    ),
    Check("deliveries_missing_region", "critical", "SELECT COUNT(*) FROM deliveries WHERE region IS NULL OR region = ''"),
    Check("deliveries_missing_status", "critical", "SELECT COUNT(*) FROM deliveries WHERE status IS NULL OR status = ''"),
    Check(
        "delivery_vehicle_fk_orphans",
        "critical",
        """
        SELECT COUNT(*) FROM deliveries d
        LEFT JOIN vehicles v ON v.id = d.vehicle_id
        WHERE v.id IS NULL
        """,
    ),
    Check(
        "delivery_driver_fk_orphans",
        "critical",
        """
        SELECT COUNT(*) FROM deliveries d
        LEFT JOIN drivers drv ON drv.id = d.driver_id
        WHERE drv.id IS NULL
        """,
    ),
    Check(
        "negative_delay_minutes",
        "critical",
        "SELECT COUNT(*) FROM deliveries WHERE delay_minutes < 0",
    ),
    Check(
        "vehicles_missing_coordinates",
        "warning",
        "SELECT COUNT(*) FROM vehicles WHERE last_latitude IS NULL OR last_longitude IS NULL",
    ),
]


def scalar(cur, sql: str) -> int:
    cur.execute(sql)
    value = cur.fetchone()[0]
    return int(value or 0)


def run(database_url: str) -> int:
    critical_failures = 0
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            total_deliveries = scalar(cur, "SELECT COUNT(*) FROM deliveries")
            historical_deliveries = scalar(cur, "SELECT COUNT(*) FROM deliveries WHERE id LIKE 'DLV-%'")
            cur.execute("SELECT MIN(estimated_delivery_time), MAX(estimated_delivery_time) FROM deliveries")
            min_date, max_date = cur.fetchone()
            cur.execute("SELECT status, COUNT(*) FROM deliveries GROUP BY status ORDER BY status")
            status_distribution = cur.fetchall()

            print("Data quality overview")
            print(f"- deliveries: {total_deliveries}")
            print(f"- historical deliveries: {historical_deliveries}")
            print(f"- estimated delivery date range: {min_date} -> {max_date}")
            print("- status distribution:")
            for status, count in status_distribution:
                print(f"  - {status}: {count}")

            print("\nChecks")
            for check in CHECKS:
                actual = scalar(cur, check.sql)
                passed = actual == check.expected
                marker = "PASS" if passed else "FAIL"
                print(f"- {marker} [{check.severity}] {check.name}: {actual}")
                if not passed and check.severity == "critical":
                    critical_failures += 1

    if critical_failures:
        print(f"\nData quality failed with {critical_failures} critical issue(s).")
        return 1
    print("\nData quality passed with zero critical issues.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Check LogiTrack historical/imported data quality.")
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))
    args = parser.parse_args()
    raise SystemExit(run(args.database_url))


if __name__ == "__main__":
    main()
