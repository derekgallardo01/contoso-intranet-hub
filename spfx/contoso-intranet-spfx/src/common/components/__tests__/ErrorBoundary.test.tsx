import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock Fluent UI components
jest.mock('@fluentui/react-components', () => ({
  MessageBar: ({ children, intent }: { children: React.ReactNode; intent: string }) => (
    <div data-testid="message-bar" data-intent={intent}>{children}</div>
  ),
  MessageBarBody: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="message-bar-body">{children}</div>
  ),
  MessageBarTitle: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="message-bar-title">{children}</span>
  ),
  Button: ({ children, onClick, appearance, style }: { children: React.ReactNode; onClick: () => void; appearance: string; style?: React.CSSProperties }) => (
    <button data-testid="button" data-appearance={appearance} onClick={onClick} style={style}>{children}</button>
  ),
  makeStyles: () => () => ({ container: 'mock-container' }),
  tokens: {
    spacingVerticalL: '16px',
  },
}));

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="child">Child content</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error from React's error boundary logging
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('should render error fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error message')).toBeTruthy();
    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeTruthy();
    expect(screen.getByText('Custom error UI')).toBeTruthy();
  });

  it('should render Try Again button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeTruthy();
    expect(retryButton.getAttribute('data-appearance')).toBe('primary');
  });

  it('should show error intent on the MessageBar', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const messageBar = screen.getByTestId('message-bar');
    expect(messageBar.getAttribute('data-intent')).toBe('error');
  });

  it('should log error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });
});
