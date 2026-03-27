import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Textarea,
  Text,
  Spinner,
  FluentProvider,
  webLightTheme,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  fileName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
});

export interface IApprovalDialogProps {
  fileName: string;
  isOpen: boolean;
  onSubmit: (notes: string) => Promise<void>;
  onCancel: () => void;
}

export const ApprovalDialog: React.FC<IApprovalDialogProps> = ({
  fileName,
  isOpen,
  onSubmit,
  onCancel,
}) => {
  const styles = useStyles();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await onSubmit(notes);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <Dialog open={isOpen} onOpenChange={(_ev, data) => { if (!data.open) onCancel(); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Send for Approval</DialogTitle>
            <DialogContent className={styles.content}>
              <Text>
                Send <span className={styles.fileName}>{fileName}</span> for
                approval?
              </Text>
              <Textarea
                placeholder="Add notes for the approver (optional)..."
                value={notes}
                onChange={(_ev, data) => setNotes(data.value)}
                resize="vertical"
                rows={4}
                disabled={submitting}
              />
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={submitting}
                icon={submitting ? <Spinner size="tiny" /> : undefined}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
};
