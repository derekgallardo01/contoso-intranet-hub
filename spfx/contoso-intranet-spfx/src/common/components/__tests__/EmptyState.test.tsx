import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

// Mock Fluent UI components
jest.mock('@fluentui/react-components', () => ({
  Text: ({ children, size, weight, className }: { children: React.ReactNode; size?: number; weight?: string; className?: string }) => (
    <span data-testid={`text-${size || 'default'}`} data-weight={weight} className={className}>{children}</span>
  ),
  Button: ({ children, onClick, appearance }: { children: React.ReactNode; onClick?: () => void; appearance?: string }) => (
    <button data-testid="action-button" data-appearance={appearance} onClick={onClick}>{children}</button>
  ),
  makeStyles: () => () => ({ container: 'mock-container', icon: 'mock-icon', message: 'mock-message' }),
  tokens: {
    spacingVerticalXXXL: '48px',
    spacingVerticalM: '12px',
    colorNeutralForeground4: '#999',
    colorNeutralForeground3: '#666',
  },
}));

jest.mock('@fluentui/react-icons', () => ({
  DocumentSearchRegular: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className}>icon</span>
  ),
}));

describe('EmptyState', () => {
  it('should render the message', () => {
    render(<EmptyState message="No items found" />);

    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('should render the icon', () => {
    render(<EmptyState message="No items found" />);

    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('should render description when provided', () => {
    render(
      <EmptyState
        message="No results"
        description="Try adjusting your search criteria"
      />
    );

    expect(screen.getByText('Try adjusting your search criteria')).toBeTruthy();
  });

  it('should not render description when not provided', () => {
    render(<EmptyState message="No items" />);

    // Only one text element (the message) should be present with text content
    const texts = screen.getAllByText(/./);
    const nonIconTexts = texts.filter(el => el.getAttribute('data-testid') !== 'icon');
    expect(nonIconTexts).toHaveLength(1);
  });

  it('should render action button when actionLabel and onAction are provided', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        message="No items"
        actionLabel="Add Item"
        onAction={mockAction}
      />
    );

    const button = screen.getByText('Add Item');
    expect(button).toBeTruthy();
  });

  it('should call onAction when action button is clicked', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        message="No items"
        actionLabel="Add Item"
        onAction={mockAction}
      />
    );

    fireEvent.click(screen.getByText('Add Item'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when only actionLabel is provided without onAction', () => {
    render(<EmptyState message="No items" actionLabel="Add Item" />);

    expect(screen.queryByTestId('action-button')).toBeNull();
  });

  it('should not render action button when only onAction is provided without actionLabel', () => {
    render(<EmptyState message="No items" onAction={() => {}} />);

    expect(screen.queryByTestId('action-button')).toBeNull();
  });

  it('should render message with semibold weight', () => {
    render(<EmptyState message="No results" />);

    const messageText = screen.getByTestId('text-500');
    expect(messageText.getAttribute('data-weight')).toBe('semibold');
  });
});
