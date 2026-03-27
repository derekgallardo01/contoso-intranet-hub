import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Link,
  Text,
  makeStyles,
  tokens,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
import {
  NavigationRegular,
  ChevronDownRegular,
} from '@fluentui/react-icons';
import { INavigationNode } from '../../../models/INavigationNode';

const useStyles = makeStyles({
  nav: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: tokens.colorBrandBackground,
    padding: `0 ${tokens.spacingHorizontalL}`,
    minHeight: '40px',
    boxShadow: tokens.shadow4,
  },
  navDesktop: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flex: 1,
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  hamburger: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalS,
    minWidth: '250px',
  },
  topItem: {
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  megaPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalM,
    minWidth: '400px',
    maxWidth: '800px',
  },
  childColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  childLink: {
    padding: `${tokens.spacingVerticalXS} 0`,
  },
});

export interface IMegaMenuProps {
  nodes: INavigationNode[];
}

export const MegaMenu: React.FC<IMegaMenuProps> = ({ nodes }) => {
  const styles = useStyles();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderChildren = useCallback(
    (children: INavigationNode[]) => (
      <div className={styles.megaPanel}>
        {children.map((child) => (
          <div key={child.id} className={styles.childColumn}>
            <Text weight="semibold" size={300}>
              {child.url && child.url !== '#' ? (
                <Link
                  href={child.url}
                  target={child.openInNewTab ? '_blank' : undefined}
                >
                  {child.title}
                </Link>
              ) : (
                child.title
              )}
            </Text>
            {child.children.map((grandchild) => (
              <Link
                key={grandchild.id}
                href={grandchild.url}
                target={grandchild.openInNewTab ? '_blank' : undefined}
                className={styles.childLink}
              >
                {grandchild.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    ),
    [styles]
  );

  if (nodes.length === 0) return null;

  return (
    <FluentProvider theme={webLightTheme}>
      <nav className={styles.nav}>
        {/* Desktop navigation */}
        <div className={styles.navDesktop}>
          {nodes.map((node) =>
            node.children.length > 0 ? (
              <Popover key={node.id} positioning="below-start" openOnHover>
                <PopoverTrigger>
                  <Button
                    appearance="transparent"
                    className={styles.topItem}
                    icon={<ChevronDownRegular />}
                    iconPosition="after"
                    size="small"
                  >
                    {node.title}
                  </Button>
                </PopoverTrigger>
                <PopoverSurface>
                  {renderChildren(node.children)}
                </PopoverSurface>
              </Popover>
            ) : (
              <Button
                key={node.id}
                appearance="transparent"
                className={styles.topItem}
                size="small"
                as="a"
                href={node.url}
                target={node.openInNewTab ? '_blank' : undefined}
              >
                {node.title}
              </Button>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <div className={styles.hamburger}>
          <Popover
            open={mobileOpen}
            onOpenChange={(_ev, data) => setMobileOpen(data.open)}
          >
            <PopoverTrigger>
              <Button
                appearance="transparent"
                className={styles.topItem}
                icon={<NavigationRegular />}
                aria-label="Navigation menu"
              />
            </PopoverTrigger>
            <PopoverSurface>
              <div className={styles.mobileMenu}>
                {nodes.map((node) => (
                  <div key={node.id}>
                    <Link
                      href={node.url !== '#' ? node.url : undefined}
                      target={node.openInNewTab ? '_blank' : undefined}
                    >
                      <Text weight="semibold">{node.title}</Text>
                    </Link>
                    {node.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        target={child.openInNewTab ? '_blank' : undefined}
                        style={{ paddingLeft: '16px', display: 'block' }}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </PopoverSurface>
          </Popover>
        </div>
      </nav>
    </FluentProvider>
  );
};
