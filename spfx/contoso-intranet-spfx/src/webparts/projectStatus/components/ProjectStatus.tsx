import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  ToggleButton,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Badge,
  ProgressBar,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
import {
  BoardRegular,
  TableRegular,
} from '@fluentui/react-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { IProject, ProjectStatus as ProjectStatusType } from '../../../models/IProject';
import { useSharePointList } from '../../../hooks/useSharePointList';
import { KanbanBoard } from './KanbanBoard';
import { LoadingSpinner } from '../../../common/components/LoadingSpinner';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorBoundary } from '../../../common/components/ErrorBoundary';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  viewToggle: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  grid: {
    width: '100%',
  },
});

export interface IProjectStatusProps {
  siteUrl: string;
  listName: string;
  spHttpClient: SPHttpClient;
}

interface IProjectListItem {
  Id: number;
  Title: string;
  Status: string;
  Department: string;
  StartDate: string;
  EndDate: string;
  Owner: string;
  Description: string;
  Progress: number;
}

type ViewMode = 'kanban' | 'table';

const statusColors: Record<ProjectStatusType, 'informative' | 'brand' | 'warning' | 'success' | 'danger'> = {
  'Not Started': 'informative',
  'In Progress': 'brand',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'danger',
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '--';
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

export const ProjectStatus: React.FC<IProjectStatusProps> = ({
  siteUrl,
  listName,
  spHttpClient,
}) => {
  const styles = useStyles();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const query = '$select=Id,Title,Status,Department,StartDate,EndDate,Owner,Description,Progress&$orderby=Title';

  const { items: rawItems, loading, error, refresh } = useSharePointList<IProjectListItem>(
    spHttpClient,
    siteUrl,
    listName,
    query
  );

  const projects: IProject[] = useMemo(
    () =>
      rawItems.map((item) => ({
        id: item.Id,
        title: item.Title,
        status: (item.Status as ProjectStatusType) || 'Not Started',
        department: item.Department || '',
        startDate: item.StartDate || '',
        endDate: item.EndDate || '',
        owner: item.Owner || '',
        description: item.Description || '',
        progress: item.Progress || 0,
      })),
    [rawItems]
  );

  const columns: TableColumnDefinition<IProject>[] = [
    createTableColumn<IProject>({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Title',
      renderCell: (item) => <Text weight="semibold">{item.title}</Text>,
    }),
    createTableColumn<IProject>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge appearance="filled" color={statusColors[item.status]}>
          {item.status}
        </Badge>
      ),
    }),
    createTableColumn<IProject>({
      columnId: 'department',
      compare: (a, b) => a.department.localeCompare(b.department),
      renderHeaderCell: () => 'Department',
      renderCell: (item) => item.department,
    }),
    createTableColumn<IProject>({
      columnId: 'owner',
      compare: (a, b) => a.owner.localeCompare(b.owner),
      renderHeaderCell: () => 'Owner',
      renderCell: (item) => item.owner,
    }),
    createTableColumn<IProject>({
      columnId: 'progress',
      compare: (a, b) => a.progress - b.progress,
      renderHeaderCell: () => 'Progress',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
          <ProgressBar value={item.progress / 100} style={{ flex: 1 }} />
          <Text size={200}>{item.progress}%</Text>
        </div>
      ),
    }),
    createTableColumn<IProject>({
      columnId: 'startDate',
      compare: (a, b) => a.startDate.localeCompare(b.startDate),
      renderHeaderCell: () => 'Start Date',
      renderCell: (item) => formatDate(item.startDate),
    }),
    createTableColumn<IProject>({
      columnId: 'endDate',
      compare: (a, b) => a.endDate.localeCompare(b.endDate),
      renderHeaderCell: () => 'End Date',
      renderCell: (item) => formatDate(item.endDate),
    }),
  ];

  if (loading) return <LoadingSpinner label="Loading projects..." />;

  if (error) {
    return (
      <EmptyState
        message="Unable to load projects"
        description={error.message}
        actionLabel="Retry"
        onAction={refresh}
      />
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <ErrorBoundary>
        <div className={styles.container}>
          <div className={styles.header}>
            <Text size={600} weight="bold">
              Project Status
            </Text>
            <div className={styles.viewToggle}>
              <ToggleButton
                icon={<BoardRegular />}
                checked={viewMode === 'kanban'}
                onClick={() => setViewMode('kanban')}
                size="small"
              >
                Kanban
              </ToggleButton>
              <ToggleButton
                icon={<TableRegular />}
                checked={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                size="small"
              >
                Table
              </ToggleButton>
            </div>
          </div>

          {projects.length === 0 ? (
            <EmptyState message="No projects found" />
          ) : viewMode === 'kanban' ? (
            <KanbanBoard projects={projects} />
          ) : (
            <DataGrid
              className={styles.grid}
              items={projects}
              columns={columns}
              sortable
              getRowId={(item) => String(item.id)}
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<IProject>>
                {({ item, rowId }) => (
                  <DataGridRow<IProject> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          )}
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
};
