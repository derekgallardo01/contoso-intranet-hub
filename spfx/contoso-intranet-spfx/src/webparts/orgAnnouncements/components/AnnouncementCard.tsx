import * as React from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  AlertUrgentRegular,
  InfoRegular,
  WarningRegular,
  CalendarRegular,
  PersonRegular,
} from '@fluentui/react-icons';
import { IAnnouncement, AnnouncementPriority } from '../../../models/IAnnouncement';

const useStyles = makeStyles({
  card: {
    width: '100%',
    cursor: 'default',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  highPriority: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteRedBorder2,
  },
  mediumPriority: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteMarigoldBorder2,
  },
  lowPriority: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteBlueBorder2,
  },
  body: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    color: tokens.colorNeutralForeground2,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalS,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
});

const priorityConfig: Record<
  AnnouncementPriority,
  { color: 'danger' | 'warning' | 'informative'; icon: React.ReactElement; className: string }
> = {
  High: { color: 'danger', icon: <AlertUrgentRegular />, className: 'highPriority' },
  Medium: { color: 'warning', icon: <WarningRegular />, className: 'mediumPriority' },
  Low: { color: 'informative', icon: <InfoRegular />, className: 'lowPriority' },
};

export interface IAnnouncementCardProps {
  announcement: IAnnouncement;
}

export const AnnouncementCard: React.FC<IAnnouncementCardProps> = ({ announcement }) => {
  const styles = useStyles();
  const config = priorityConfig[announcement.priority];
  const priorityClassName = announcement.priority === 'High'
    ? styles.highPriority
    : announcement.priority === 'Medium'
    ? styles.mediumPriority
    : styles.lowPriority;

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <Card className={`${styles.card} ${priorityClassName}`}>
      <CardHeader
        header={
          <div className={styles.header}>
            <Text weight="bold" size={400}>
              {announcement.title}
            </Text>
            <Badge
              appearance="filled"
              color={config.color}
              icon={config.icon}
            >
              {announcement.priority}
            </Badge>
            <Badge appearance="outline">{announcement.department}</Badge>
          </div>
        }
      />
      <CardPreview>
        <div style={{ padding: '0 16px 16px' }}>
          <Text className={styles.body} size={300}>
            {stripHtml(announcement.body)}
          </Text>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <PersonRegular fontSize={14} />
              <Text size={200}>{announcement.author}</Text>
            </span>
            <span className={styles.metaItem}>
              <CalendarRegular fontSize={14} />
              <Text size={200}>{formatDate(announcement.createdDate)}</Text>
            </span>
            {announcement.expiryDate && (
              <span className={styles.metaItem}>
                <Text size={200}>
                  Expires: {formatDate(announcement.expiryDate)}
                </Text>
              </span>
            )}
          </div>
        </div>
      </CardPreview>
    </Card>
  );
};
