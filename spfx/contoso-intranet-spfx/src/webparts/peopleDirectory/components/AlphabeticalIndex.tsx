import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalS} 0`,
  },
});

export interface IAlphabeticalIndexProps {
  selectedLetter: string | null;
  onLetterClick: (letter: string | null) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const AlphabeticalIndex: React.FC<IAlphabeticalIndexProps> = ({
  selectedLetter,
  onLetterClick,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Button
        size="small"
        appearance={selectedLetter === null ? 'primary' : 'subtle'}
        onClick={() => onLetterClick(null)}
      >
        All
      </Button>
      {LETTERS.map((letter) => (
        <Button
          key={letter}
          size="small"
          appearance={selectedLetter === letter ? 'primary' : 'subtle'}
          onClick={() => onLetterClick(letter)}
        >
          {letter}
        </Button>
      ))}
    </div>
  );
};
