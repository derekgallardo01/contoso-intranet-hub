import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ClassificationBanner, ClassificationLevel } from '../ClassificationBanner';

jest.mock('@fluentui/react-components', () => ({
  Text: ({ children, size, className, style }: { children: React.ReactNode; size?: number; className?: string; style?: React.CSSProperties }) => (
    <span data-testid={`text-${size || 'default'}`} className={className} style={style}>{children}</span>
  ),
  makeStyles: () => () => ({ banner: 'mock-banner', label: 'mock-label' }),
  tokens: {
    spacingHorizontalS: '4px',
    spacingVerticalXS: '2px',
    spacingHorizontalL: '16px',
    fontWeightBold: 700,
  },
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
}));

jest.mock('@fluentui/react-icons', () => ({
  ShieldCheckmarkRegular: () => <span data-testid="icon-shield">shield</span>,
  LockClosedRegular: () => <span data-testid="icon-lock">lock</span>,
  EyeRegular: () => <span data-testid="icon-eye">eye</span>,
  GlobeRegular: () => <span data-testid="icon-globe">globe</span>,
}));

describe('ClassificationBanner', () => {
  const levels: Array<{ level: ClassificationLevel; label: string; icon: string }> = [
    { level: 'Public', label: 'PUBLIC', icon: 'icon-globe' },
    { level: 'Internal', label: 'INTERNAL', icon: 'icon-eye' },
    { level: 'Confidential', label: 'CONFIDENTIAL', icon: 'icon-shield' },
    { level: 'Restricted', label: 'RESTRICTED', icon: 'icon-lock' },
  ];

  levels.forEach(({ level, label, icon }) => {
    it(`should render ${level} classification with correct label`, () => {
      render(<ClassificationBanner classification={level} />);
      expect(screen.getByText(label)).toBeTruthy();
    });

    it(`should render ${level} with a background color`, () => {
      const { container } = render(<ClassificationBanner classification={level} />);
      const banner = container.querySelector('[role="banner"]') as HTMLElement;
      expect(banner).toBeTruthy();
      expect(banner.style.backgroundColor).toBeTruthy();
    });

    it(`should render ${level} with correct icon`, () => {
      render(<ClassificationBanner classification={level} />);
      expect(screen.getByTestId(icon)).toBeTruthy();
    });
  });

  it('should have role="banner" for accessibility', () => {
    const { container } = render(<ClassificationBanner classification="Internal" />);
    const banner = container.querySelector('[role="banner"]');
    expect(banner).toBeTruthy();
  });

  it('should have aria-label describing the classification', () => {
    const { container } = render(<ClassificationBanner classification="Confidential" />);
    const banner = container.querySelector('[role="banner"]');
    expect(banner?.getAttribute('aria-label')).toBe(
      'This content is classified as Confidential'
    );
  });

  it('should render white text for all levels', () => {
    const { container } = render(<ClassificationBanner classification="Restricted" />);
    const banner = container.querySelector('[role="banner"]') as HTMLElement;
    // jsdom converts #ffffff to rgb(255, 255, 255)
    expect(banner.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should use distinct background colors for each classification', () => {
    const colors = new Set<string>();
    (['Public', 'Internal', 'Confidential', 'Restricted'] as ClassificationLevel[]).forEach((level) => {
      const { container } = render(<ClassificationBanner classification={level} />);
      const banner = container.querySelector('[role="banner"]') as HTMLElement;
      colors.add(banner.style.backgroundColor);
    });
    // All 4 levels should have different background colors
    expect(colors.size).toBe(4);
  });
});
