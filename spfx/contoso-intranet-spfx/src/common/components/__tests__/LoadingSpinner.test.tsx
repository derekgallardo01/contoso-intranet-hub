import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

// Mock Fluent UI components
jest.mock('@fluentui/react-components', () => ({
  Spinner: ({ label, size }: { label: string; size: string }) => (
    <div data-testid="spinner" data-size={size}>{label}</div>
  ),
  makeStyles: () => () => ({ container: 'mock-container' }),
  tokens: {
    spacingVerticalXXL: '32px',
  },
}));

describe('LoadingSpinner', () => {
  it('should render with default label', () => {
    render(<LoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should render with custom label', () => {
    render(<LoadingSpinner label="Fetching data..." />);

    expect(screen.getByText('Fetching data...')).toBeTruthy();
  });

  it('should render a large spinner', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner.getAttribute('data-size')).toBe('large');
  });
});
