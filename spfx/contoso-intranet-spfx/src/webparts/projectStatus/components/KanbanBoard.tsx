import * as React from 'react';
import { useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Badge,
} from '@fluentui/react-components';
import { IProject, ProjectStatus } from '../../../models/IProject';
import { ProjectCard } from './ProjectCard';

const useStyles = makeStyles({
  board: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    overflowX: 'auto',
    padding: tokens.spacingVerticalS,
    minHeight: '400px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '260px',
    maxWidth: '300px',
    flex: '1 0 260px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    marginBottom: tokens.spacingVerticalS,
  },
  columnCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
    overflowY: 'auto',
  },
});

const STATUS_ORDER: ProjectStatus[] = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled',
];

const statusColors: Record<ProjectStatus, 'informative' | 'brand' | 'warning' | 'success' | 'danger'> = {
  'Not Started': 'informative',
  'In Progress': 'brand',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'danger',
};

export interface IKanbanBoardProps {
  projects: IProject[];
}

export const KanbanBoard: React.FC<IKanbanBoardProps> = ({ projects }) => {
  const styles = useStyles();

  const columns = useMemo(() => {
    const grouped: Record<ProjectStatus, IProject[]> = {
      'Not Started': [],
      'In Progress': [],
      'On Hold': [],
      'Completed': [],
      'Cancelled': [],
    };

    projects.forEach((project) => {
      const status = project.status as ProjectStatus;
      if (grouped[status]) {
        grouped[status].push(project);
      } else {
        grouped['Not Started'].push(project);
      }
    });

    return STATUS_ORDER.map((status) => ({
      status,
      projects: grouped[status],
    }));
  }, [projects]);

  return (
    <div className={styles.board}>
      {columns.map(({ status, projects: columnProjects }) => (
        <div key={status} className={styles.column}>
          <div className={styles.columnHeader}>
            <Text weight="semibold" size={300}>
              {status}
            </Text>
            <Badge
              appearance="filled"
              color={statusColors[status]}
              size="small"
            >
              {columnProjects.length}
            </Badge>
          </div>
          <div className={styles.columnCards}>
            {columnProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
