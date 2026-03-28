import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApprovalDialog } from '../ApprovalDialog';

jest.mock('@fluentui/react-components', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogActions: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-actions">{children}</div>,
  Button: ({ children, onClick, disabled, appearance }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; appearance?: string; icon?: React.ReactNode }) => (
    <button data-testid={`btn-${appearance || 'default'}`} onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Textarea: ({ value, onChange, disabled, placeholder }: { value: string; onChange: (_ev: unknown, data: { value: string }) => void; disabled?: boolean; placeholder?: string; resize?: string; rows?: number }) => (
    <textarea
      data-testid="notes-input"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e, { value: e.target.value })}
    />
  ),
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Spinner: ({ size }: { size: string }) => <span data-testid="spinner" data-size={size}>loading</span>,
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
  makeStyles: () => () => ({ content: 'mock-content', fileName: 'mock-fileName' }),
  tokens: {
    spacingVerticalM: '8px',
    fontWeightSemibold: 600,
    colorBrandForeground1: '#0078d4',
  },
}));

describe('ApprovalDialog', () => {
  const defaultProps = {
    fileName: 'Q4-Report.docx',
    isOpen: true,
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ApprovalDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeTruthy();
    expect(screen.getByText('Send for Approval')).toBeTruthy();
  });

  it('should not render when closed', () => {
    render(<ApprovalDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('should display the file name', () => {
    render(<ApprovalDialog {...defaultProps} />);
    expect(screen.getByText('Q4-Report.docx')).toBeTruthy();
  });

  it('should render submit and cancel buttons', () => {
    render(<ApprovalDialog {...defaultProps} />);
    expect(screen.getByText('Submit')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should call onCancel when Cancel is clicked', () => {
    render(<ApprovalDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit with notes when Submit is clicked', async () => {
    render(<ApprovalDialog {...defaultProps} />);

    const textarea = screen.getByTestId('notes-input');
    fireEvent.change(textarea, { target: { value: 'Please review urgently' } });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('Please review urgently');
    });
  });

  it('should call onSubmit with empty notes when no notes entered', async () => {
    render(<ApprovalDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('');
    });
  });

  it('should show submitting state with disabled buttons', async () => {
    // Make onSubmit hang to observe the submitting state
    let resolveSubmit: () => void;
    const slowSubmit = jest.fn().mockImplementation(() =>
      new Promise<void>((resolve) => { resolveSubmit = resolve; })
    );

    render(<ApprovalDialog {...defaultProps} onSubmit={slowSubmit} />);

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeTruthy();
    });

    // Both buttons should be disabled
    const cancelBtn = screen.getByTestId('btn-secondary');
    const submitBtn = screen.getByTestId('btn-primary');
    expect(cancelBtn).toHaveProperty('disabled', true);
    expect(submitBtn).toHaveProperty('disabled', true);

    // Resolve the submit
    resolveSubmit!();

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeTruthy();
    });
  });

  it('should render a textarea for notes', () => {
    render(<ApprovalDialog {...defaultProps} />);
    const textarea = screen.getByTestId('notes-input');
    expect(textarea).toBeTruthy();
    expect(textarea.getAttribute('placeholder')).toContain('notes');
  });
});
