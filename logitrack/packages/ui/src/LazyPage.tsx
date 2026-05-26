import { Suspense, type ReactNode } from 'react';

import { StateMessage } from './StateMessage';

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <StateMessage
          title="Loading page"
          description="Preparing the selected control tower view."
        />
      }
    >
      {children}
    </Suspense>
  );
}
