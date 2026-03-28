import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ClassificationBadge } from '../ClassificationBadge';

jest.mock('@fluentui/react-components', () => ({
  Badge: ({ children, color, appearance }: { children: React.ReactNode; color: string; appearance: string }) => (
    <span data-testid="badge" data-color={color} data-appearance={appearance}>{children}</span>
  ),
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
}));

describe('ClassificationBadge', () => {
  it('should render Public with success color', () => {
    render(<ClassificationBadge classification="Public" />);
    const badge = screen.getByTestId('badge');
    expect(badge.getAttribute('data-color')).toBe('success');
    expect(badge.textContent).toBe('Public');
  });

  it('should render Internal with informative color', () => {
    render(<ClassificationBadge classification="Internal" />);
    const badge = screen.getByTestId('badge');
    expect(badge.getAttribute('data-color')).toBe('informative');
  });

  it('should render Confidential with warning color', () => {
    render(<ClassificationBadge classification="Confidential" />);
    const badge = screen.getByTestId('badge');
    expect(badge.getAttribute('data-color')).toBe('warning');
  });

  it('should render Restricted with danger color', () => {
    render(<ClassificationBadge classification="Restricted" />);
    const badge = screen.getByTestId('badge');
    expect(badge.getAttribute('data-color')).toBe('danger');
  });

  it('should return null when classification is empty', () => {
    const { container } = render(<ClassificationBadge classification="" />);
    expect(container.innerHTML).toBe('');
  });

  it('should use informative as default color for unknown classifications', () => {
    render(<ClassificationBadge classification="CustomLevel" />);
    const badge = screen.getByTestId('badge');
    expect(badge.getAttribute('data-color')).toBe('informative');
    expect(badge.textContent).toBe('CustomLevel');
  });

  it('should use filled appearance', () => {
    render(<ClassificationBadge classification="Public" />);
    const badge = screen.getByTestId('badge');
    expect(badge.getAttribute('data-appearance')).toBe('filled');
  });
});
