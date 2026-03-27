import * as React from 'react';
import {
  Card,
  CardHeader,
  Avatar,
  Text,
  Badge,
  PresenceBadgeStatus,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { IPerson, PresenceStatus } from '../../../models/IPerson';

const useStyles = makeStyles({
  card: {
    cursor: 'pointer',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    overflow: 'hidden',
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detail: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground3,
  },
});

const presenceMap: Record<PresenceStatus, PresenceBadgeStatus> = {
  Available: 'available',
  Busy: 'busy',
  Away: 'away',
  Offline: 'offline',
};

export interface IPersonCardProps {
  person: IPerson;
  showPresence: boolean;
  onClick: (person: IPerson) => void;
}

export const PersonCard: React.FC<IPersonCardProps> = ({
  person,
  showPresence,
  onClick,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.card} onClick={() => onClick(person)}>
      <CardHeader
        image={
          <Avatar
            name={person.displayName}
            image={person.photoUrl ? { src: person.photoUrl } : undefined}
            size={48}
            badge={
              showPresence
                ? { status: presenceMap[person.presence] }
                : undefined
            }
          />
        }
        header={
          <Text weight="semibold" className={styles.name}>
            {person.displayName}
          </Text>
        }
        description={
          <div className={styles.info}>
            <Text size={200} className={styles.detail}>
              {person.jobTitle || 'No title'}
            </Text>
            {person.department && (
              <Badge appearance="outline" size="small">
                {person.department}
              </Badge>
            )}
          </div>
        }
      />
    </Card>
  );
};
