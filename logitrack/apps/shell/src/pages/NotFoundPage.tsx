import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The route you opened is not part of the Phase 2 shell navigation."
      action={<Link to="/">Back to dashboard</Link>}
    />
  );
}
