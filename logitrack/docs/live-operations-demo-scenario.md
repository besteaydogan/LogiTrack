# Live Operations Demo Scenario

Goal: REST fills the first screen, WebSocket carries live changes, and every operations page reads the same simulation run.

## Flow

1. Start the stack with PostgreSQL, backend API, Redpanda, topic setup, stream consumer, and frontend apps.
2. Open Dashboard.
   - REST loads the initial summary snapshot.
   - `/ws/live-operations` connects and the badge changes to `connected`.
3. Start the CSV replay simulator.
   - The simulator creates a new `simulationRunId`.
   - The stream consumer resets live state and begins writing replayed records.
4. Watch Dashboard.
   - `Processed deliveries` changes from `0 / 5000` toward the configured replay limit.
   - KPI cards and status charts update from WebSocket events.
5. Open Deliveries.
   - A `delivery.created` event prepends a delivery row.
   - A `delivery.status.changed` or `delivery.delayed` event updates the row status and highlights it.
6. Open Alerts.
   - A delayed delivery creates an unresolved alert.
   - Resolve the alert and confirm REST refresh updates the alert and dashboard counts.
7. Open Fleet / Map / 3D.
   - `vehicle.location.updated` moves the vehicle marker and refreshes vehicle detail.
   - Alert pulses appear in the 3D operations view for unresolved alerts.
8. Open Analytics.
   - The page keeps historical analytics as the base view.
   - Live simulation context shows the current run, processed count, last event, and a short refresh window.

## Expected Narrative

Start simulation -> Dashboard KPI changes -> Deliveries status changes -> Alert appears -> Vehicle marker moves -> Analytics refresh context changes.
