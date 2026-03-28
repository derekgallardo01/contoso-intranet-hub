import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Dropdown,
  Option,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
import { SPHttpClient } from '@microsoft/sp-http';
import { IAnnouncement } from '../../../models/IAnnouncement';
import { useSharePointList } from '../../../hooks/useSharePointList';
import { AnnouncementCard } from './AnnouncementCard';
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
  filterBar: {
    minWidth: '200px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

export interface IOrgAnnouncementsProps {
  siteUrl: string;
  listName: string;
  maxItems: number;
  spHttpClient: SPHttpClient;
  connectedDepartment?: string;
}

interface IAnnouncementListItem {
  Id: number;
  Title: string;
  Body: string;
  Department: string;
  Priority: string;
  ExpiryDate: string;
  Created: string;
  Author: { Title: string };
}

export const OrgAnnouncements: React.FC<IOrgAnnouncementsProps> = ({
  siteUrl,
  listName,
  maxItems,
  spHttpClient,
  connectedDepartment,
}) => {
  const styles = useStyles();
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // When a connected web part provides a department, use it as the active filter
  const activeDepartment = connectedDepartment && connectedDepartment !== 'All'
    ? connectedDepartment
    : departmentFilter;

  const query = `$select=Id,Title,Body,Department,Priority,ExpiryDate,Created,Author/Title&$expand=Author&$orderby=Created desc&$top=${maxItems}`;

  const { items: rawItems, loading, error, refresh } = useSharePointList<IAnnouncementListItem>(
    spHttpClient,
    siteUrl,
    listName,
    query
  );

  const announcements: IAnnouncement[] = useMemo(
    () =>
      rawItems.map((item) => ({
        id: item.Id,
        title: item.Title,
        body: item.Body || '',
        department: item.Department || 'General',
        priority: (item.Priority as IAnnouncement['priority']) || 'Medium',
        expiryDate: item.ExpiryDate || '',
        createdDate: item.Created,
        author: item.Author?.Title || 'Unknown',
      })),
    [rawItems]
  );

  const departments = useMemo(() => {
    const depts = new Set(announcements.map((a) => a.department));
    return ['All', ...Array.from(depts).sort()];
  }, [announcements]);

  const filteredAnnouncements = useMemo(
    () =>
      activeDepartment === 'All'
        ? announcements
        : announcements.filter((a) => a.department === activeDepartment),
    [announcements, activeDepartment]
  );

  if (loading) return <LoadingSpinner label="Loading announcements..." />;

  if (error) {
    return (
      <EmptyState
        message="Unable to load announcements"
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
              Announcements
            </Text>
            <Dropdown
              className={styles.filterBar}
              placeholder="Filter by department"
              value={departmentFilter}
              onOptionSelect={(_ev, data) =>
                setDepartmentFilter(data.optionValue || 'All')
              }
            >
              {departments.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Dropdown>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <EmptyState message="No announcements found" />
          ) : (
            <div className={styles.list}>
              {filteredAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          )}
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
};
