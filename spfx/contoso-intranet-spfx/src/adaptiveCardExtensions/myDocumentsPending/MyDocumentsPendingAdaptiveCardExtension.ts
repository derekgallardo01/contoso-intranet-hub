import {
  BaseAdaptiveCardExtension,
} from '@microsoft/sp-adaptive-card-extension-base';
import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { SPHttpClient } from '@microsoft/sp-http';
import { CardView } from './cardView/CardView';
import { QuickView } from './quickView/QuickView';

export interface IMyDocumentsPendingState {
  pendingCount: number;
  documents: Array<{
    id: number;
    title: string;
    requester: string;
    requestDate: string;
  }>;
}

export interface IMyDocumentsPendingProperties {
  siteUrl: string;
  listName: string;
}

const CARD_VIEW_REGISTRY_ID = 'MyDocumentsPending_CARD_VIEW';
export const QUICK_VIEW_REGISTRY_ID = 'MyDocumentsPending_QUICK_VIEW';

export default class MyDocumentsPendingAdaptiveCardExtension extends BaseAdaptiveCardExtension<
  IMyDocumentsPendingProperties,
  IMyDocumentsPendingState
> {
  public onInit(): Promise<void> {
    this.state = {
      pendingCount: 0,
      documents: [],
    };

    this.cardNavigator.register(CARD_VIEW_REGISTRY_ID, () => new CardView());
    this.quickViewNavigator.register(QUICK_VIEW_REGISTRY_ID, () => new QuickView());

    return this._fetchPendingDocuments();
  }

  private async _fetchPendingDocuments(): Promise<void> {
    try {
      const siteUrl =
        this.properties.siteUrl || this.context.pageContext.web.absoluteUrl;
      const listName = this.properties.listName || 'Documents';
      const currentUserEmail = this.context.pageContext.user.email;

      const filter = `$filter=ApprovalStatus eq 'Pending' and AssignedTo/EMail eq '${currentUserEmail}'`;
      const select = '$select=Id,Title,Author/Title,Created&$expand=Author';
      const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items?${filter}&${select}&$top=20&$orderby=Created desc`;

      const response = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (response.ok) {
        const data = await response.json();
        const items = data.value || [];

        this.setState({
          pendingCount: items.length,
          documents: items.map(
            (item: { Id: number; Title: string; Author: { Title: string }; Created: string }) => ({
              id: item.Id,
              title: item.Title,
              requester: item.Author?.Title || 'Unknown',
              requestDate: item.Created,
            })
          ),
        });
      }
    } catch {
      // Silently fail - card will show 0 pending
    }
  }

  public get iconProperty(): string {
    return 'DocumentApproval';
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configure pending documents card' },
          groups: [
            {
              groupFields: [
                PropertyPaneTextField('siteUrl', {
                  label: 'Site URL',
                }),
                PropertyPaneTextField('listName', {
                  label: 'List Name',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
