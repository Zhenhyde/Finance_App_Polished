import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: 'var(--danger)', background: 'var(--bg-main)', height: '100vh', fontFamily: 'monospace' }}>
          <h2>Oops! Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', padding: '10px', background: 'var(--bg-card)', borderRadius: '8px' }}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button 
            className="confirm-btn"
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
