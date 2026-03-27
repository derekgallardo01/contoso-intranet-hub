import * as React from 'react';
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalL,
  },
});

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface IErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

interface IErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

const ErrorFallback: React.FC<IErrorFallbackProps> = ({ error, onRetry }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>Something went wrong</MessageBarTitle>
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </MessageBarBody>
      </MessageBar>
      <Button appearance="primary" onClick={onRetry} style={{ marginTop: '12px' }}>
        Try Again
      </Button>
    </div>
  );
};
