import { useEffect, useMemo, useState } from 'react';
import { LiveSimulationBadge } from '@logitrack/ui';

import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { useLiveOperationsStream } from '@/features/live-operations/liveOperationsStore';
import { getAffectedScreens } from '@/services/api/live';

import './SimulationControlPage.css';

export function SimulationControlPage() {
  const liveState = useLiveOperationsStream();
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const lastEvent = liveState.lastEvent;
  const affectedScreens = lastEvent ? getAffectedScreens(lastEvent) : [];
  const eventCountEntries = useMemo(() => Object.entries(eventCounts)
    .sort((first, second) => second[1] - first[1]), [eventCounts]);

  useEffect(() => {
    if (!lastEvent) {
      return;
    }

    setEventCounts((current) => ({
      ...current,
      [lastEvent.eventType]: (current[lastEvent.eventType] ?? 0) + 1,
    }));
  }, [lastEvent]);

  return (
    <div className="simulation-page">
      <PageHeader
        title="Simulation Control"
        description="Live observer for the CSV replay pipeline from Redpanda through PostgreSQL and SSE."
        actions={<LiveSimulationBadge connectionState={liveState.connectionState} lastEvent={lastEvent} />}
      />

      <section className="simulation-metrics" aria-label="Simulation replay metrics">
        <SimulationMetric label="Connection" value={liveState.connectionState} />
        <SimulationMetric label="Processed deliveries" value={`${liveState.processedRecords} / ${liveState.totalRecords}`} />
        <SimulationMetric label="Simulation interval" value={`${liveState.simulationIntervalSeconds} sec`} />
        <SimulationMetric label="Events observed" value={liveState.chartPoints.length} />
        <SimulationMetric label="Last event" value={lastEvent?.eventType ?? 'waiting'} />
        <SimulationMetric label="Last sequence" value={lastEvent?.sequence ?? 'pending'} />
        <SimulationMetric label="Last event time" value={lastEvent ? formatDateTime(lastEvent.timestamp) : 'pending'} />
        <SimulationMetric label="Affected screens" value={affectedScreens.join(', ') || 'pending'} />
        <SimulationMetric label="Last refetch signal" value={lastEvent ? formatDateTime(lastEvent.timestamp) : 'pending'} />
      </section>

      {lastEvent ? (
        <section className="simulation-event" aria-label="Latest replay event">
          <div>
            <span>Latest payload</span>
            <strong>{lastEvent.eventType}</strong>
          </div>
          <pre>{JSON.stringify(lastEvent, null, 2)}</pre>
        </section>
      ) : (
        <StateMessage title="Waiting for replay events" description="Start the CSV replay producer and stream consumer to observe live pipeline activity." />
      )}

      <section className="simulation-event-counts" aria-label="Observed events per type">
        <div>
          <span>Events per type</span>
          <strong>{eventCountEntries.length ? `${eventCountEntries.length} active event types` : 'No event types observed'}</strong>
        </div>
        {eventCountEntries.length ? (
          <ul>
            {eventCountEntries.map(([type, count]) => (
              <li key={type}>
                <span>{type}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {liveState.connectionState === 'disconnected' ? (
        <p className="simulation-warning">Fleet event stream is not currently reachable.</p>
      ) : null}

      <section className="simulation-notes" aria-label="Replay behavior notes">
        <p>CSV replay is deterministic: same CSV, same seed, and same sequence produce the same route coordinates.</p>
        <p>PostgreSQL is the source of truth after consumer commit; SSE publish is best-effort and may recover through snapshot streams.</p>
        <p>Last affected screen set: {affectedScreens.join(', ') || 'none'}</p>
      </section>
    </div>
  );
}

function SimulationMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="simulation-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}
