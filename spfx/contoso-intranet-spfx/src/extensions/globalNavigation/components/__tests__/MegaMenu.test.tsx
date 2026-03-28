import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MegaMenu } from '../MegaMenu';
import { INavigationNode } from '../../../../models/INavigationNode';

jest.mock('@fluentui/react-components', () => ({
  Button: ({ children, as, href, target, icon, ...props }: Record<string, unknown>) => {
    const Tag = (as === 'a' ? 'a' : 'button') as keyof JSX.IntrinsicElements;
    return <Tag data-testid="nav-button" href={href as string} target={target as string} {...props}>{icon as React.ReactNode}{children as React.ReactNode}</Tag>;
  },
  Popover: ({ children }: { children: React.ReactNode }) => <div data-testid="popover">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverSurface: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-surface">{children}</div>,
  Link: ({ children, href, target }: { children: React.ReactNode; href?: string; target?: string }) => (
    <a data-testid="nav-link" href={href} target={target}>{children}</a>
  ),
  Text: ({ children, weight }: { children: React.ReactNode; weight?: string }) => (
    <span data-testid="text" data-weight={weight}>{children}</span>
  ),
  makeStyles: () => () => ({
    nav: 'mock-nav',
    navDesktop: 'mock-navDesktop',
    hamburger: 'mock-hamburger',
    mobileMenu: 'mock-mobileMenu',
    topItem: 'mock-topItem',
    megaPanel: 'mock-megaPanel',
    childColumn: 'mock-childColumn',
    childLink: 'mock-childLink',
  }),
  tokens: {
    colorBrandBackground: '#0078d4',
    spacingHorizontalL: '16px',
    spacingHorizontalXS: '4px',
    spacingVerticalXS: '2px',
    spacingVerticalS: '4px',
    spacingVerticalM: '8px',
    colorNeutralForegroundOnBrand: '#fff',
    shadow4: '0 2px 4px rgba(0,0,0,0.1)',
  },
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
}));

jest.mock('@fluentui/react-icons', () => ({
  NavigationRegular: () => <span data-testid="icon-hamburger">menu</span>,
  ChevronDownRegular: () => <span data-testid="icon-chevron">v</span>,
}));

const makeNode = (
  id: number,
  title: string,
  url: string = '#',
  children: INavigationNode[] = [],
  openInNewTab: boolean = false
): INavigationNode => ({
  id,
  title,
  url,
  parent: null,
  order: id,
  openInNewTab,
  children,
});

describe('MegaMenu', () => {
  it('should return null when nodes is empty', () => {
    const { container } = render(<MegaMenu nodes={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render root navigation nodes', () => {
    const nodes = [
      makeNode(1, 'Home', '/'),
      makeNode(2, 'About', '/about'),
    ];

    render(<MegaMenu nodes={nodes} />);

    // Both desktop and mobile nav render nodes, so use getAllByText
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('About').length).toBeGreaterThanOrEqual(1);
  });

  it('should render nodes without children as direct links', () => {
    const nodes = [
      makeNode(1, 'Contact', '/contact'),
    ];

    render(<MegaMenu nodes={nodes} />);

    const buttons = screen.getAllByTestId('nav-button');
    const contactButton = buttons.find(b => b.textContent?.includes('Contact'));
    expect(contactButton).toBeTruthy();
    expect(contactButton?.getAttribute('href')).toBe('/contact');
  });

  it('should render popover for nodes with children', () => {
    const nodes = [
      makeNode(1, 'Products', '#', [
        makeNode(10, 'Widget A', '/products/a'),
        makeNode(11, 'Widget B', '/products/b'),
      ]),
    ];

    render(<MegaMenu nodes={nodes} />);

    expect(screen.getAllByText('Products').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('popover').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Widget A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Widget B').length).toBeGreaterThanOrEqual(1);
  });

  it('should render child node links in the mega panel', () => {
    const nodes = [
      makeNode(1, 'Docs', '#', [
        makeNode(10, 'Policies', '/docs/policies', [
          makeNode(100, 'HR Policy', '/docs/policies/hr'),
        ]),
      ]),
    ];

    render(<MegaMenu nodes={nodes} />);

    expect(screen.getAllByText('Policies').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('HR Policy').length).toBeGreaterThanOrEqual(1);
  });

  it('should render mobile hamburger menu', () => {
    const nodes = [makeNode(1, 'Home', '/')];

    render(<MegaMenu nodes={nodes} />);

    expect(screen.getByTestId('icon-hamburger')).toBeTruthy();
  });

  it('should set target=_blank for openInNewTab nodes', () => {
    const nodes = [
      makeNode(1, 'External', 'https://external.com', [], true),
    ];

    render(<MegaMenu nodes={nodes} />);

    const buttons = screen.getAllByTestId('nav-button');
    const externalButton = buttons.find(b => b.textContent?.includes('External'));
    expect(externalButton?.getAttribute('target')).toBe('_blank');
  });

  it('should render chevron icon for nodes with children', () => {
    const nodes = [
      makeNode(1, 'Dropdown', '#', [
        makeNode(10, 'Child', '/child'),
      ]),
    ];

    render(<MegaMenu nodes={nodes} />);

    expect(screen.getAllByTestId('icon-chevron').length).toBeGreaterThan(0);
  });
});
