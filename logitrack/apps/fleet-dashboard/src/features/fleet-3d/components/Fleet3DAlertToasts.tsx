import type { Fleet3DAlertPulse } from '../types/fleet3d.types';

type Fleet3DAlertToastsProps = {
  pulses: Fleet3DAlertPulse[];
};

export function Fleet3DAlertToasts({ pulses }: Fleet3DAlertToastsProps) {
  const latest = pulses.slice(0, 3);

  if (latest.length === 0) {
    return null;
  }

  return (
    <div className="fleet-3d-alert-toasts" aria-label="Latest unresolved 3D alerts">
      {latest.map((pulse) => (
        <article className={`fleet-3d-alert-toast fleet-3d-alert-toast--${pulse.alert.severity.toLowerCase()}`} key={pulse.id}>
          <span>{pulse.alert.severity}</span>
          <strong>{pulse.alert.alertType.replace(/_/g, ' ')}</strong>
          <p>{pulse.alert.region ?? pulse.alert.vehicleId ?? 'Operations alert'}</p>
        </article>
      ))}
    </div>
  );
}
