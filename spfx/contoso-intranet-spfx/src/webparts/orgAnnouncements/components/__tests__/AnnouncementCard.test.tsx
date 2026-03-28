import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { AnnouncementCard } from '../AnnouncementCard';
import { IAnnouncement } from '../../../../models/IAnnouncement';

jest.mock('@fluentui/react-components', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ header }: { header: React.ReactNode }) => <div data-testid="card-header">{header}</div>,
  CardPreview: ({ children }: { children: React.ReactNode }) => <div data-testid="card-preview">{children}</div>,
  Text: ({ children, size, weight }: { children: React.ReactNode; size?: number; weight?: string; className?: string }) => (
    <span data-testid={`text-${size || 'default'}`} data-weight={weight}>{children}</span>
  ),
  Badge: ({ children, color, appearance }: { children: React.ReactNode; color?: string; appearance?: string; icon?: React.ReactNode }) => (
    <span data-testid="badge" data-color={color} data-appearance={appearance}>{children}</span>
  ),
  makeStyles: () => () => ({
    card: 'card',
    header: 'header',
    highPriority: 'highPriority',
    mediumPriority: 'mediumPriority',
    lowPriority: 'lowPriority',
    body: 'body',
    meta: 'meta',
    metaItem: 'metaItem',
  }),
  tokens: {
    spacingHorizontalS: '', spacingHorizontalL: '', spacingHorizontalXS: '',
    spacingVerticalS: '',
    colorPaletteRedBorder2: 'red', colorPaletteMarigoldBorder2: 'yellow', colorPaletteBlueBorderActive: 'blue',
    colorNeutralForeground2: '#333', colorNeutralForeground3: '#666',
  },
}));

jest.mock('@fluentui/react-icons', () => ({
  AlertUrgentRegular: () => <span data-testid="icon-urgent" />,
  InfoRegular: () => <span data-testid="icon-info" />,
  WarningRegular: () => <span data-testid="icon-warning" />,
  CalendarRegular: () => <span data-testid="icon-calendar" />,
  PersonRegular: () => <span data-testid="icon-person" />,
}));

const createAnnouncement = (overrides: Partial<IAnnouncement> = {}): IAnnouncement => ({
  id: 1,
  title: 'Test Announcement',
  body: '<p>Hello <strong>world</strong></p>',
  department: 'IT',
  priority: 'Medium',
  expiryDate: '',
  createdDate: '2024-03-15T10:00:00Z',
  author: 'Jane Doe',
  ...overrides,
});

describe('AnnouncementCard', () => {
  it('should render the announcement title', () => {
    render(<AnnouncementCard announcement={createAnnouncement()} />);
    expect(screen.getByText('Test Announcement')).toBeTruthy();
  });

  it('should render the priority badge with danger color for High', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ priority: 'High' })} />);
    const badges = screen.getAllByTestId('badge');
    const priorityBadge = badges.find(b => b.textContent === 'High');
    expect(priorityBadge?.getAttribute('data-color')).toBe('danger');
  });

  it('should render the priority badge with warning color for Medium', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ priority: 'Medium' })} />);
    const badges = screen.getAllByTestId('badge');
    const priorityBadge = badges.find(b => b.textContent === 'Medium');
    expect(priorityBadge?.getAttribute('data-color')).toBe('warning');
  });

  it('should render the priority badge with informative color for Low', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ priority: 'Low' })} />);
    const badges = screen.getAllByTestId('badge');
    const priorityBadge = badges.find(b => b.textContent === 'Low');
    expect(priorityBadge?.getAttribute('data-color')).toBe('informative');
  });

  it('should render the department badge', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ department: 'Engineering' })} />);
    const badges = screen.getAllByTestId('badge');
    const deptBadge = badges.find(b => b.textContent === 'Engineering');
    expect(deptBadge).toBeTruthy();
    expect(deptBadge?.getAttribute('data-appearance')).toBe('outline');
  });

  it('should strip HTML from body text', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ body: '<p>Hello <strong>world</strong></p>' })} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('should render the author name', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ author: 'John Smith' })} />);
    expect(screen.getByText('John Smith')).toBeTruthy();
  });

  it('should format the created date', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ createdDate: '2024-03-15T10:00:00Z' })} />);
    // Should render formatted date (exact format depends on locale, but should contain "Mar")
    const dateTexts = screen.getAllByTestId('text-200');
    const dateText = dateTexts.find(t => t.textContent?.includes('Mar') || t.textContent?.includes('2024'));
    expect(dateText).toBeTruthy();
  });

  it('should render expiry date when present', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ expiryDate: '2024-12-31T00:00:00Z' })} />);
    const dateTexts = screen.getAllByTestId('text-200');
    const expiryText = dateTexts.find(t => t.textContent?.includes('Expires'));
    expect(expiryText).toBeTruthy();
  });

  it('should not render expiry date when empty', () => {
    render(<AnnouncementCard announcement={createAnnouncement({ expiryDate: '' })} />);
    const dateTexts = screen.getAllByTestId('text-200');
    const expiryText = dateTexts.find(t => t.textContent?.includes('Expires'));
    expect(expiryText).toBeUndefined();
  });

  it('should apply highPriority className for High priority', () => {
    const { container } = render(<AnnouncementCard announcement={createAnnouncement({ priority: 'High' })} />);
    const card = container.querySelector('[data-testid="card"]');
    expect(card?.className).toContain('highPriority');
  });
});
