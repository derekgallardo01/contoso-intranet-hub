import * as React from 'react';
import { useCallback } from 'react';
import {
  Dropdown,
  Option,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ISearchRefiner } from '../../../services/SearchService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dropdown: {
    minWidth: '180px',
  },
});

const refinerLabels: Record<string, string> = {
  ContentType: 'Content Type',
  Department: 'Department',
  RefinableString00: 'Classification',
  FileExtension: 'File Type',
};

export interface IDocumentFiltersProps {
  refiners: ISearchRefiner[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

export const DocumentFilters: React.FC<IDocumentFiltersProps> = ({
  refiners,
  activeFilters,
  onFilterChange,
}) => {
  const styles = useStyles();

  const handleFilterSelect = useCallback(
    (refinerName: string, value: string | undefined) => {
      if (!value || value === '__all__') {
        const updated = activeFilters.filter(
          (f) => !f.startsWith(`${refinerName}:`)
        );
        onFilterChange(updated);
      } else {
        const updated = activeFilters.filter(
          (f) => !f.startsWith(`${refinerName}:`)
        );
        updated.push(`${refinerName}:equals("${value}")`);
        onFilterChange(updated);
      }
    },
    [activeFilters, onFilterChange]
  );

  if (refiners.length === 0) return null;

  return (
    <div className={styles.container}>
      {refiners.map((refiner) => (
        <Dropdown
          key={refiner.name}
          className={styles.dropdown}
          placeholder={refinerLabels[refiner.name] || refiner.name}
          onOptionSelect={(_ev, data) =>
            handleFilterSelect(refiner.name, data.optionValue)
          }
        >
          <Option key="__all__" value="__all__" text={`All ${refinerLabels[refiner.name] || refiner.name}s`}>
            All {refinerLabels[refiner.name] || refiner.name}s
          </Option>
          {refiner.entries.map((entry) => (
            <Option key={entry.value} value={entry.value} text={`${entry.value} (${entry.count})`}>
              {entry.value} ({entry.count})
            </Option>
          ))}
        </Dropdown>
      ))}
    </div>
  );
};
