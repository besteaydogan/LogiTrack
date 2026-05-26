import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RemoteErrorFallback } from '@logitrack/ui';

type RemotePageBoundaryProps = {
  children: ReactNode;
};

type RemotePageBoundaryState = {
  hasError: boolean;
};

export class RemotePageBoundary extends Component<RemotePageBoundaryProps, RemotePageBoundaryState> {
  state: RemotePageBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Remote page failed to load', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <RemoteErrorFallback
          title="Remote view unavailable"
          description="Start the requested remote app and refresh this route."
        />
      );
    }

    return this.props.children;
  }
}
