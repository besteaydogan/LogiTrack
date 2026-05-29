import './LiveSimulationBadge.css';

type LiveSimulationBadgeEvent = {
  eventType: string;
  timestamp: string;
};

type LiveSimulationBadgeProps = {
  connectionState: string;
  lastEvent: LiveSimulationBadgeEvent | null;
};

export function LiveSimulationBadge({ connectionState, lastEvent }: LiveSimulationBadgeProps) {
  return (
    <div className="live-simulation-badge" aria-label="Live simulation status">
      <span className={`live-simulation-badge__dot live-simulation-badge__dot--${connectionState}`} />
      <span>Live Simulation: {connectionState === 'connected' ? 'ON' : connectionState.toUpperCase()}</span>
      <strong>{lastEvent?.eventType ?? 'waiting for event'}</strong>
      <time dateTime={lastEvent?.timestamp}>{lastEvent ? formatTime(lastEvent.timestamp) : '--:--'}</time>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}
