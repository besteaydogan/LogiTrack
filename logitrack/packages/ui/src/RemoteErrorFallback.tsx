import { Button } from './Button';
import { EmptyState } from './EmptyState';

type RemoteErrorFallbackProps = {
  title?: string;
  description?: string;
};

export function RemoteErrorFallback({
  title = 'Remote app unavailable',
  description = 'Start the remote app and refresh this view.',
}: RemoteErrorFallbackProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={<Button onClick={() => window.location.reload()}>Refresh</Button>}
    />
  );
}
