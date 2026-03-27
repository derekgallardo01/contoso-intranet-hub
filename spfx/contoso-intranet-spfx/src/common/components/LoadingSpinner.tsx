import * as React from 'react';
import { Spinner, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    minHeight: '200px',
  },
});

export interface ILoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({ label }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Spinner size="large" label={label || 'Loading...'} />
    </div>
  );
};
