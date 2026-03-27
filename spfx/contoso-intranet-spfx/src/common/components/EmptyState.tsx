import * as React from 'react';
import {
  Text,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DocumentSearchRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    minHeight: '200px',
    gap: tokens.spacingVerticalM,
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground4,
  },
  message: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
});

export interface IEmptyStateProps {
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<IEmptyStateProps> = ({
  message,
  description,
  actionLabel,
  onAction,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <DocumentSearchRegular className={styles.icon} />
      <Text size={500} weight="semibold" className={styles.message}>
        {message}
      </Text>
      {description && (
        <Text size={300} className={styles.message}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button appearance="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
