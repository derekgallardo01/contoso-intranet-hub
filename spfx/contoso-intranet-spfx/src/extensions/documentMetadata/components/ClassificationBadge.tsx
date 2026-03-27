import * as React from 'react';
import {
  Badge,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';

type BadgeColor = 'success' | 'informative' | 'warning' | 'danger';

const classificationColors: Record<string, BadgeColor> = {
  Public: 'success',
  Internal: 'informative',
  Confidential: 'warning',
  Restricted: 'danger',
};

export interface IClassificationBadgeProps {
  classification: string;
}

export const ClassificationBadge: React.FC<IClassificationBadgeProps> = ({
  classification,
}) => {
  if (!classification) {
    return null;
  }

  const color: BadgeColor = classificationColors[classification] || 'informative';

  return (
    <FluentProvider theme={webLightTheme}>
      <Badge appearance="filled" color={color}>
        {classification}
      </Badge>
    </FluentProvider>
  );
};
