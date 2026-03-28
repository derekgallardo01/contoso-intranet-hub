import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { OrgAnnouncements } from '../OrgAnnouncements';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = any;

// Mock the hook
let mockHookReturn: { items: AnyMock[]; loading: boolean; error: Error | null; refresh: jest.Mock };

jest.mock('../../../../hooks/useSharePointList', () => ({
  useSharePointList: () => mockHookReturn,
}));

// Mock child components to keep tests focused
jest.mock('../AnnouncementCard', () => ({
  AnnouncementCard: ({ announcement }: { announcement: { title: string } }) => (
    <div data-testid="announcement-card">{announcement.title}</div>
  ),
}));

jest.mock('../../../../common/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ label }: { label?: string }) => <div data-testid="loading-spinner">{label}</div>,
}));

jest.mock('../../../../common/components/EmptyState', () => ({
  EmptyState: ({ message, actionLabel, onAction }: { message: string; description?: string; actionLabel?: string; onAction?: () => void }) => (
    <div data-testid="empty-state">
      <span>{message}</span>
      {actionLabel && onAction && <button onClick={onAction}>{actionLabel}</button>}
    </div>
  ),
}));

jest.mock('../../../../common/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@fluentui/react-components', () => ({
  makeStyles: () => () => ({ container: '', header: '', filterBar: '', list: '' }),
  tokens: { spacingVerticalM: '', spacingVerticalL: '', spacingHorizontalM: '', spacingVerticalS: '' },
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Dropdown: ({ children, value }: { children: React.ReactNode; value: string; onOptionSelect: AnyMock }) => (
    <select data-testid="department-filter" value={value}>{children}</select>
  ),
  Option: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
}));

describe('OrgAnnouncements', () => {
  const defaultProps = {
    siteUrl: 'https://contoso.sharepoint.com',
    listName: 'Announcements',
    maxItems: 10,
    spHttpClient: {} as AnyMock,
  };

  beforeEach(() => {
    mockHookReturn = {
      items: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    };
  });

  it('should show loading spinner when loading', () => {
    mockHookReturn.loading = true;

    render(<OrgAnnouncements {...defaultProps} />);

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    expect(screen.getByText('Loading announcements...')).toBeTruthy();
  });

  it('should show error state with retry button', () => {
    mockHookReturn.error = new Error('Network failure');

    render(<OrgAnnouncements {...defaultProps} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('Unable to load announcements')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('should show empty state when no announcements', () => {
    render(<OrgAnnouncements {...defaultProps} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No announcements found')).toBeTruthy();
  });

  it('should render announcement cards when data is available', () => {
    mockHookReturn.items = [
      { Id: 1, Title: 'Welcome!', Body: 'Hello all', Department: 'HR', Priority: 'High', ExpiryDate: '', Created: '2024-01-01', Author: { Title: 'Admin' } },
      { Id: 2, Title: 'Update', Body: 'New policy', Department: 'IT', Priority: 'Medium', ExpiryDate: '', Created: '2024-01-02', Author: { Title: 'IT Admin' } },
    ];

    render(<OrgAnnouncements {...defaultProps} />);

    const cards = screen.getAllByTestId('announcement-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Welcome!')).toBeTruthy();
    expect(screen.getByText('Update')).toBeTruthy();
  });

  it('should show the Announcements header', () => {
    mockHookReturn.items = [
      { Id: 1, Title: 'Test', Body: '', Department: 'IT', Priority: 'Low', ExpiryDate: '', Created: '2024-01-01', Author: { Title: 'Admin' } },
    ];

    render(<OrgAnnouncements {...defaultProps} />);

    expect(screen.getByText('Announcements')).toBeTruthy();
  });

  it('should render department filter dropdown', () => {
    mockHookReturn.items = [
      { Id: 1, Title: 'A', Body: '', Department: 'HR', Priority: 'Low', ExpiryDate: '', Created: '2024-01-01', Author: { Title: 'Admin' } },
      { Id: 2, Title: 'B', Body: '', Department: 'IT', Priority: 'Low', ExpiryDate: '', Created: '2024-01-02', Author: { Title: 'Admin' } },
    ];

    render(<OrgAnnouncements {...defaultProps} />);

    const filter = screen.getByTestId('department-filter');
    expect(filter).toBeTruthy();
    // Should have All + HR + IT = 3 options
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('HR')).toBeTruthy();
    expect(screen.getByText('IT')).toBeTruthy();
  });

  it('should handle missing Author gracefully', () => {
    mockHookReturn.items = [
      { Id: 1, Title: 'No Author', Body: '', Department: 'IT', Priority: 'Low', ExpiryDate: '', Created: '2024-01-01', Author: null },
    ];

    render(<OrgAnnouncements {...defaultProps} />);

    expect(screen.getByTestId('announcement-card')).toBeTruthy();
  });
});
