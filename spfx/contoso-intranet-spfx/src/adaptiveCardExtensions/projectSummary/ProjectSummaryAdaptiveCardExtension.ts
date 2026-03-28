import {
  BaseAdaptiveCardExtension,
} from '@microsoft/sp-adaptive-card-extension-base';
import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { SPHttpClient } from '@microsoft/sp-http';
import { CardView } from './cardView/CardView';
import { QuickView } from './quickView/QuickView';

export interface IProjectSummaryState {
  activeCount: number;
  overdueCount: number;
  completedThisMonth: number;
  notStartedCount: number;
  onHoldCount: number;
  cancelledCount: number;
}

export interface IProjectSummaryProperties {
  siteUrl: string;
  listName: string;
}

const CARD_VIEW_REGISTRY_ID = 'ProjectSummary_CARD_VIEW';
export const QUICK_VIEW_REGISTRY_ID = 'ProjectSummary_QUICK_VIEW';

export default class ProjectSummaryAdaptiveCardExtension extends BaseAdaptiveCardExtension<
  IProjectSummaryProperties,
  IProjectSummaryState
> {
  public onInit(): Promise<void> {
    this.state = {
      activeCount: 0,
      overdueCount: 0,
      completedThisMonth: 0,
      notStartedCount: 0,
      onHoldCount: 0,
      cancelledCount: 0,
    };

    this.cardNavigator.register(CARD_VIEW_REGISTRY_ID, () => new CardView());
    this.quickViewNavigator.register(QUICK_VIEW_REGISTRY_ID, () => new QuickView());

    return this._fetchProjectSummary();
  }

  private async _fetchProjectSummary(): Promise<void> {
    try {
      const siteUrl =
        this.properties.siteUrl || this.context.pageContext.web.absoluteUrl;
      const listName = this.properties.listName || 'Projects';

      const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items?$select=Id,Status,EndDate&$top=500`;

      const response = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (response.ok) {
        const data = await response.json();
        const items: Array<{ Status: string; EndDate: string }> = data.value || [];

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let activeCount = 0;
        let overdueCount = 0;
        let completedThisMonth = 0;
        let notStartedCount = 0;
        let onHoldCount = 0;
        let cancelledCount = 0;

        items.forEach((item) => {
          switch (item.Status) {
            case 'In Progress':
              activeCount++;
              if (item.EndDate && new Date(item.EndDate) < now) {
                overdueCount++;
              }
              break;
            case 'Completed':
              if (item.EndDate && new Date(item.EndDate) >= monthStart) {
                completedThisMonth++;
              }
              break;
            case 'Not Started':
              notStartedCount++;
              break;
            case 'On Hold':
              onHoldCount++;
              break;
            case 'Cancelled':
              cancelledCount++;
              break;
          }
        });

        this.setState({
          activeCount,
          overdueCount,
          completedThisMonth,
          notStartedCount,
          onHoldCount,
          cancelledCount,
        });
      }
    } catch {
      // Silently fail
    }
  }

  public get iconProperty(): string {
    return 'ProjectCollection';
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configure project summary card' },
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
