import * as React from 'react';
import {
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Link,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ISearchResult } from '../../../services/SearchService';

const useStyles = makeStyles({
  grid: {
    width: '100%',
  },
  sizeCell: {
    color: tokens.colorNeutralForeground3,
  },
});

interface IDocumentRow {
  id: string;
  title: string;
  url: string;
  contentType: string;
  department: string;
  classification: string;
  modified: string;
  modifiedBy: string;
  size: string;
}

const classificationColors: Record<string, 'success' | 'informative' | 'warning' | 'danger'> = {
  Public: 'success',
  Internal: 'informative',
  Confidential: 'warning',
  Restricted: 'danger',
};

const formatFileSize = (sizeStr: string): string => {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes) || bytes === 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
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

export interface IDocumentSearchResultsProps {
  results: ISearchResult[];
}

export const DocumentSearchResults: React.FC<IDocumentSearchResultsProps> = ({ results }) => {
  const styles = useStyles();

  const rows: IDocumentRow[] = results.map((r, idx) => ({
    id: String(idx),
    title: r.title,
    url: r.url,
    contentType: r.managedProperties.ContentType || '',
    department: r.managedProperties.Department || '',
    classification: r.managedProperties.RefinableString00 || '',
    modified: r.lastModified,
    modifiedBy: r.managedProperties.EditorOWSUSER || r.author,
    size: r.managedProperties.Size || '0',
  }));

  const columns: TableColumnDefinition<IDocumentRow>[] = [
    createTableColumn<IDocumentRow>({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Title',
      renderCell: (item) => (
        <Link href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </Link>
      ),
    }),
    createTableColumn<IDocumentRow>({
      columnId: 'contentType',
      compare: (a, b) => a.contentType.localeCompare(b.contentType),
      renderHeaderCell: () => 'Content Type',
      renderCell: (item) => item.contentType,
    }),
    createTableColumn<IDocumentRow>({
      columnId: 'department',
      compare: (a, b) => a.department.localeCompare(b.department),
      renderHeaderCell: () => 'Department',
      renderCell: (item) => item.department,
    }),
    createTableColumn<IDocumentRow>({
      columnId: 'classification',
      compare: (a, b) => a.classification.localeCompare(b.classification),
      renderHeaderCell: () => 'Classification',
      renderCell: (item) =>
        item.classification ? (
          <Badge
            appearance="filled"
            color={classificationColors[item.classification] || 'informative'}
          >
            {item.classification}
          </Badge>
        ) : (
          '--'
        ),
    }),
    createTableColumn<IDocumentRow>({
      columnId: 'modified',
      compare: (a, b) => a.modified.localeCompare(b.modified),
      renderHeaderCell: () => 'Modified',
      renderCell: (item) => formatDate(item.modified),
    }),
    createTableColumn<IDocumentRow>({
      columnId: 'modifiedBy',
      compare: (a, b) => a.modifiedBy.localeCompare(b.modifiedBy),
      renderHeaderCell: () => 'Modified By',
      renderCell: (item) => item.modifiedBy,
    }),
    createTableColumn<IDocumentRow>({
      columnId: 'size',
      compare: (a, b) => parseInt(a.size) - parseInt(b.size),
      renderHeaderCell: () => 'Size',
      renderCell: (item) => (
        <span className={styles.sizeCell}>{formatFileSize(item.size)}</span>
      ),
    }),
  ];

  return (
    <DataGrid
      className={styles.grid}
      items={rows}
      columns={columns}
      sortable
      getRowId={(item) => item.id}
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => (
            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<IDocumentRow>>
        {({ item, rowId }) => (
          <DataGridRow<IDocumentRow> key={rowId}>
            {({ renderCell }) => (
              <DataGridCell>{renderCell(item)}</DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
};
