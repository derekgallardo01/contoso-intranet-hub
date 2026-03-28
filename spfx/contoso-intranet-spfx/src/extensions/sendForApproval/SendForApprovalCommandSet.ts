import * as React from 'react';
import * as ReactDom from 'react-dom';
import { override } from '@microsoft/decorators';
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  ListViewStateChangedEventArgs,
  RowAccessor,
} from '@microsoft/sp-listview-extensibility';
import { Dialog } from '@microsoft/sp-dialog';
import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { ApprovalDialog, IApprovalDialogProps } from './components/ApprovalDialog';

export interface ISendForApprovalCommandSetProperties {
  approvalFlowUrl: string;
}

export default class SendForApprovalCommandSet extends BaseListViewCommandSet<ISendForApprovalCommandSetProperties> {
  private _dialogContainer: HTMLDivElement | null = null;

  @override
  public onInit(): Promise<void> {
    this.context.listView.listViewStateChangedEvent.add(
      this,
      this._onListViewStateChanged
    );
    return Promise.resolve();
  }

  private _onListViewStateChanged = (_args: ListViewStateChangedEventArgs): void => {
    const command: Command = this.tryGetCommand('SEND_FOR_APPROVAL');
    if (command) {
      const selectedRows = this.context.listView.selectedRows;
      command.visible = selectedRows !== undefined && selectedRows.length === 1;
    }
    this.raiseOnChange();
  };

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'SEND_FOR_APPROVAL':
        this._handleSendForApproval();
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private async _handleSendForApproval(): Promise<void> {
    const selectedRows = this.context.listView.selectedRows;
    if (!selectedRows || selectedRows.length !== 1) return;

    const row: RowAccessor = selectedRows[0];
    const fileName = row.getValueByName('FileLeafRef') || row.getValueByName('Title') || 'Unknown';
    const department = row.getValueByName('Department');
    const classification = row.getValueByName('Classification');

    // Validate required metadata
    if (!department || !classification) {
      const missingFields: string[] = [];
      if (!department) missingFields.push('Department');
      if (!classification) missingFields.push('Classification');
      await Dialog.alert(
        `Cannot send for approval. The following required metadata is missing: ${missingFields.join(', ')}. Please update the document metadata first.`
      );
      return;
    }

    // Show approval dialog
    this._showApprovalDialog(fileName, row);
  }

  private _showApprovalDialog(fileName: string, row: RowAccessor): void {
    this._dialogContainer = document.createElement('div');
    document.body.appendChild(this._dialogContainer);

    const itemId = row.getValueByName('ID');
    const fileUrl = row.getValueByName('FileRef') || '';

    const element: React.ReactElement<IApprovalDialogProps> = React.createElement(
      ApprovalDialog,
      {
        fileName,
        isOpen: true,
        onSubmit: async (notes: string) => {
          await this._submitApproval(itemId, fileName, fileUrl, notes);
          this._closeDialog();
        },
        onCancel: () => {
          this._closeDialog();
        },
      }
    );

    ReactDom.render(element, this._dialogContainer);
  }

  private _closeDialog(): void {
    if (this._dialogContainer) {
      ReactDom.unmountComponentAtNode(this._dialogContainer);
      document.body.removeChild(this._dialogContainer);
      this._dialogContainer = null;
    }
  }

  private async _submitApproval(
    itemId: string,
    fileName: string,
    fileUrl: string,
    notes: string
  ): Promise<void> {
    const approvalFlowUrl = this.properties.approvalFlowUrl;

    if (!approvalFlowUrl) {
      await Dialog.alert('Approval flow URL is not configured. Please contact your administrator.');
      return;
    }

    try {
      const body = JSON.stringify({
        itemId,
        fileName,
        fileUrl,
        notes,
        requestedBy: this.context.pageContext.user.displayName,
        requestedByEmail: this.context.pageContext.user.email,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        listId: this.context.pageContext.list?.id?.toString(),
      });

      const response: HttpClientResponse = await this.context.httpClient.post(
        approvalFlowUrl,
        HttpClient.configurations.v1,
        {
          headers: { 'Content-Type': 'application/json' },
          body,
        }
      );

      if (response.ok) {
        await Dialog.alert(`"${fileName}" has been sent for approval successfully.`);
      } else {
        const errorText = await response.text();
        await Dialog.alert(`Failed to send for approval: ${errorText}`);
      }
    } catch (err) {
      await Dialog.alert(`Error sending for approval: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
