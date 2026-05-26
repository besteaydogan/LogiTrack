param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

$checks = @(
  @{ Name = "Health"; Path = "/api/health" },
  @{ Name = "Dashboard summary"; Path = "/api/dashboard/summary" },
  @{ Name = "Deliveries"; Path = "/api/deliveries" },
  @{ Name = "Alerts"; Path = "/api/alerts" },
  @{ Name = "Vehicles"; Path = "/api/vehicles" },
  @{ Name = "Analytics summary"; Path = "/api/analytics/summary" },
  @{ Name = "Analytics by region"; Path = "/api/analytics/summary?region=Ankara" },
  @{ Name = "Analytics by date range"; Path = "/api/analytics/summary?from=2026-05-01&to=2026-05-25" }
)

Write-Host "Verifying LogiTrack API at $BaseUrl"

foreach ($check in $checks) {
  $uri = "$BaseUrl$($check.Path)"

  try {
    $response = Invoke-WebRequest -Uri $uri -Method Get -UseBasicParsing -TimeoutSec 10
  } catch {
    Write-Error "FAILED $($check.Name): $uri could not be reached. $($_.Exception.Message)"
    exit 1
  }

  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    Write-Error "FAILED $($check.Name): $uri returned HTTP $($response.StatusCode)"
    exit 1
  }

  Write-Host "OK     $($check.Name) -> HTTP $($response.StatusCode)"
}

Write-Host "All API checks passed."
