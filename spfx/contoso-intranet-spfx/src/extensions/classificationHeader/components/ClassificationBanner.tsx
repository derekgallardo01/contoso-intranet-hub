import * as React from 'react';
import {
  Text,
  makeStyles,
  tokens,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
import {
  ShieldCheckmarkRegular,
  LockClosedRegular,
  EyeRegular,
  GlobeRegular,
} from '@fluentui/react-icons';

export type ClassificationLevel = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

interface IClassificationConfig {
  backgroundColor: string;
  textColor: string;
  icon: React.ReactElement;
  label: string;
}

const classificationConfig: Record<ClassificationLevel, IClassificationConfig> = {
  Public: {
    backgroundColor: '#107c10',
    textColor: '#ffffff',
    icon: <GlobeRegular />,
    label: 'PUBLIC',
  },
  Internal: {
    backgroundColor: '#0078d4',
    textColor: '#ffffff',
    icon: <EyeRegular />,
    label: 'INTERNAL',
  },
  Confidential: {
    backgroundColor: '#ca5010',
    textColor: '#ffffff',
    icon: <ShieldCheckmarkRegular />,
    label: 'CONFIDENTIAL',
  },
  Restricted: {
    backgroundColor: '#d13438',
    textColor: '#ffffff',
    icon: <LockClosedRegular />,
    label: 'RESTRICTED',
  },
};

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalL}`,
    width: '100%',
    minHeight: '32px',
  },
  label: {
    fontWeight: tokens.fontWeightBold,
    letterSpacing: '0.05em',
  },
});

export interface IClassificationBannerProps {
  classification: ClassificationLevel;
}

export const ClassificationBanner: React.FC<IClassificationBannerProps> = ({
  classification,
}) => {
  const styles = useStyles();
  const config = classificationConfig[classification];

  return (
    <FluentProvider theme={webLightTheme}>
      <div
        className={styles.banner}
        style={{
          backgroundColor: config.backgroundColor,
          color: config.textColor,
        }}
        role="banner"
        aria-label={`This content is classified as ${classification}`}
      >
        {config.icon}
        <Text
          size={200}
          className={styles.label}
          style={{ color: config.textColor }}
        >
          {config.label}
        </Text>
      </div>
    </FluentProvider>
  );
};
