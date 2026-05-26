import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';

import './Fleet3DFramePage.css';

const env = (import.meta as unknown as { env?: { VITE_FLEET_REMOTE_BASE_URL?: string } }).env;
const fleetRemoteBaseUrl = env?.VITE_FLEET_REMOTE_BASE_URL ?? 'http://localhost:5175';

export function Fleet3DFramePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'logitrack:navigate' && event.data.path === '/fleet') {
        navigate('/fleet');
      }
    };

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  return (
    <section className="fleet-3d-frame-page" aria-label="3D fleet operations remote">
      <div className="fleet-3d-frame-page__actions">
        <Button onClick={() => navigate('/fleet')} variant="secondary">2D Map</Button>
      </div>
      <iframe
        className="fleet-3d-frame-page__frame"
        src={`${fleetRemoteBaseUrl}/fleet/3d?embed=1`}
        title="3D Fleet Operations View"
      />
    </section>
  );
}

export default Fleet3DFramePage;
