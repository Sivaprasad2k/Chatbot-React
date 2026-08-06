import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            padding: 24,
            textAlign: 'center'
          }}
        >
          <ShieldAlert size={48} color="var(--status-error)" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 460, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            An unexpected application error occurred. Click reload to safely restore your session.
          </p>
          <Button variant="primary" onClick={this.handleReload}>
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
