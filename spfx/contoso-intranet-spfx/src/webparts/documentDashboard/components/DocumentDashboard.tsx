import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Input,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { useSearch } from '../../../hooks/useSearch';
import { ISearchOptions } from '../../../services/SearchService';
import { DocumentSearchResults } from './DocumentSearchResults';
import { DocumentFilters } from './DocumentFilters';
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
  searchInput: {
    minWidth: '300px',
    maxWidth: '500px',
  },
  resultCount: {
    color: tokens.colorNeutralForeground3,
  },
});

export interface IDocumentDashboardProps {
  siteUrl: string;
  searchScope: string;
  spHttpClient: SPHttpClient;
}

export const DocumentDashboard: React.FC<IDocumentDashboardProps> = ({
  siteUrl,
  searchScope,
  spHttpClient,
}) => {
  const styles = useStyles();
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const searchOptions: ISearchOptions = {
    selectProperties: [
      'Title',
      'Path',
      'Description',
      'Author',
      'LastModifiedTime',
      'ContentType',
      'Department',
      'RefinableString00',
      'Size',
      'FileExtension',
      'EditorOWSUSER',
    ],
    refiners: ['ContentType', 'Department', 'RefinableString00', 'FileExtension'],
    refinementFilters: activeFilters.length > 0 ? activeFilters : undefined,
    rowLimit: 50,
  };

  const scopeQuery = searchScope ? `path:"${searchScope}"` : '';
  const fullQuery = searchText
    ? `${searchText} ${scopeQuery} IsDocument:1`.trim()
    : `* ${scopeQuery} IsDocument:1`.trim();

  const { results, refiners, totalRows, loading, error } = useSearch(
    spHttpClient,
    siteUrl,
    fullQuery,
    searchOptions
  );

  const handleFilterChange = useCallback((filters: string[]) => {
    setActiveFilters(filters);
  }, []);

  return (
    <FluentProvider theme={webLightTheme}>
      <ErrorBoundary>
        <div className={styles.container}>
          <div className={styles.header}>
            <Text size={600} weight="bold">
              Document Dashboard
            </Text>
            <Text size={200} className={styles.resultCount}>
              {totalRows} document{totalRows !== 1 ? 's' : ''} found
            </Text>
          </div>

          <Input
            className={styles.searchInput}
            placeholder="Search documents..."
            contentBefore={<SearchRegular />}
            value={searchText}
            onChange={(_ev, data) => setSearchText(data.value)}
          />

          <DocumentFilters
            refiners={refiners}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />

          {loading ? (
            <LoadingSpinner label="Searching documents..." />
          ) : error ? (
            <EmptyState
              message="Search failed"
              description={error.message}
            />
          ) : results.length === 0 ? (
            <EmptyState
              message="No documents found"
              description="Try different search terms or adjust your filters"
            />
          ) : (
            <DocumentSearchResults results={results} />
          )}
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
};
