#!/usr/bin/env sh
set -eu

BASE_URL="${1:-${BASE_URL:-http://localhost:8080}}"

check() {
  name="$1"
  path="$2"
  url="${BASE_URL}${path}"
  status="$(curl -sS -o /tmp/logitrack-api-check.json -w "%{http_code}" "$url")"

  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    echo "FAILED ${name}: ${url} returned HTTP ${status}" >&2
    cat /tmp/logitrack-api-check.json >&2 || true
    exit 1
  fi

  echo "OK     ${name} -> HTTP ${status}"
}

echo "Verifying LogiTrack API at ${BASE_URL}"

check "Health" "/api/health"
check "Dashboard summary" "/api/dashboard/summary"
check "Deliveries" "/api/deliveries"
check "Alerts" "/api/alerts"
check "Vehicles" "/api/vehicles"
check "Analytics summary" "/api/analytics/summary"
check "Analytics by region" "/api/analytics/summary?region=Ankara"
check "Analytics by date range" "/api/analytics/summary?from=2026-05-01&to=2026-05-25"

echo "All API checks passed."
