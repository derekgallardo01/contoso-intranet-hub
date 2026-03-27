import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Dropdown,
  Option,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IPerson } from '../../../models/IPerson';
import { GraphService } from '../../../services/GraphService';
import { PersonCard } from './PersonCard';
import { AlphabeticalIndex } from './AlphabeticalIndex';
import { PersonDetailPanel } from './PersonDetailPanel';
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
  searchBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInput: {
    minWidth: '280px',
  },
  departmentFilter: {
    minWidth: '200px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
});

export interface IPeopleDirectoryProps {
  context: WebPartContext;
  showPresence: boolean;
}

export const PeopleDirectory: React.FC<IPeopleDirectoryProps> = ({
  context,
  showPresence,
}) => {
  const styles = useStyles();
  const [people, setPeople] = useState<IPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<IPerson | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphServiceRef = useRef<GraphService | null>(null);

  const initGraphService = useCallback(async () => {
    if (!graphServiceRef.current) {
      const client: MSGraphClientV3 = await context.msGraphClientFactory.getClient('3');
      graphServiceRef.current = new GraphService(client);
    }
    return graphServiceRef.current;
  }, [context]);

  const fetchPeople = useCallback(
    async (search?: string, department?: string) => {
      try {
        setLoading(true);
        setError(null);
        const service = await initGraphService();
        const users = await service.getUsers(
          search || undefined,
          department && department !== 'All' ? department : undefined
        );
        setPeople(users);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [initGraphService]
  );

  useEffect(() => {
    fetchPeople().catch(() => {});
  }, [fetchPeople]);

  const handleSearchChange = useCallback(
    (_ev: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
      setSearchText(data.value);
      setLetterFilter(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchPeople(data.value, departmentFilter).catch(() => {});
      }, 300);
    },
    [fetchPeople, departmentFilter]
  );

  const handleDepartmentChange = useCallback(
    (_ev: unknown, data: { optionValue?: string }) => {
      const dept = data.optionValue || 'All';
      setDepartmentFilter(dept);
      fetchPeople(searchText, dept).catch(() => {});
    },
    [fetchPeople, searchText]
  );

  const handleLetterClick = useCallback((letter: string | null) => {
    setLetterFilter(letter);
    setSearchText('');
  }, []);

  const handlePersonClick = useCallback((person: IPerson) => {
    setSelectedPerson(person);
    setIsPanelOpen(true);
  }, []);

  const departments = useMemo(() => {
    const depts = new Set(people.map((p) => p.department).filter(Boolean));
    return ['All', ...Array.from(depts).sort()];
  }, [people]);

  const filteredPeople = useMemo(() => {
    if (!letterFilter) return people;
    return people.filter((p) =>
      p.displayName.toUpperCase().startsWith(letterFilter)
    );
  }, [people, letterFilter]);

  return (
    <FluentProvider theme={webLightTheme}>
      <ErrorBoundary>
        <div className={styles.container}>
          <div className={styles.header}>
            <Text size={600} weight="bold">
              People Directory
            </Text>
          </div>

          <div className={styles.searchBar}>
            <Input
              className={styles.searchInput}
              placeholder="Search people..."
              contentBefore={<SearchRegular />}
              value={searchText}
              onChange={handleSearchChange}
            />
            <Dropdown
              className={styles.departmentFilter}
              placeholder="Filter by department"
              value={departmentFilter}
              onOptionSelect={handleDepartmentChange}
            >
              {departments.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Dropdown>
          </div>

          <AlphabeticalIndex
            selectedLetter={letterFilter}
            onLetterClick={handleLetterClick}
          />

          {loading ? (
            <LoadingSpinner label="Loading people..." />
          ) : error ? (
            <EmptyState
              message="Unable to load people"
              description={error.message}
              actionLabel="Retry"
              onAction={() => fetchPeople(searchText, departmentFilter)}
            />
          ) : filteredPeople.length === 0 ? (
            <EmptyState message="No people found" description="Try a different search or filter" />
          ) : (
            <div className={styles.grid}>
              {filteredPeople.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  showPresence={showPresence}
                  onClick={handlePersonClick}
                />
              ))}
            </div>
          )}

          <PersonDetailPanel
            person={selectedPerson}
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            graphService={graphServiceRef.current}
            showPresence={showPresence}
          />
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
};
