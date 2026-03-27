import * as React from 'react';
import {
  Card,
  CardHeader,
  Text,
  Avatar,
  Badge,
  ProgressBar,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { CalendarRegular } from '@fluentui/react-icons';
import { IProject } from '../../../models/IProject';

const useStyles = makeStyles({
  card: {
    width: '100%',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
});

export interface IProjectCardProps {
  project: IProject;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const ProjectCard: React.FC<IProjectCardProps> = ({ project }) => {
  const styles = useStyles();

  return (
    <Card className={styles.card} size="small">
      <CardHeader
        image={<Avatar name={project.owner} size={28} />}
        header={
          <Text weight="semibold" size={300}>
            {project.title}
          </Text>
        }
        description={
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {project.owner}
          </Text>
        }
      />
      <div className={styles.body}>
        {project.department && (
          <Badge appearance="outline" size="small">
            {project.department}
          </Badge>
        )}
        <div className={styles.progressRow}>
          <ProgressBar
            value={project.progress / 100}
            style={{ flex: 1 }}
            color={project.progress === 100 ? 'success' : 'brand'}
          />
          <Text size={200}>{project.progress}%</Text>
        </div>
        <div className={styles.dateRow}>
          <CalendarRegular fontSize={14} />
          <Text size={100}>
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </Text>
        </div>
      </div>
    </Card>
  );
};
