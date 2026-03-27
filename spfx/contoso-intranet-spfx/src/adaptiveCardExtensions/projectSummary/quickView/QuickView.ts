import { ISPFxAdaptiveCard, BaseAdaptiveCardQuickView } from '@microsoft/sp-adaptive-card-extension-base';
import {
  IProjectSummaryState,
  IProjectSummaryProperties,
} from '../ProjectSummaryAdaptiveCardExtension';

export class QuickView extends BaseAdaptiveCardQuickView<
  IProjectSummaryProperties,
  IProjectSummaryState
> {
  public get data(): Record<string, unknown> {
    return {
      statuses: [
        { label: 'In Progress', count: this.state.activeCount, color: 'accent' },
        { label: 'Not Started', count: this.state.notStartedCount, color: 'default' },
        { label: 'On Hold', count: this.state.onHoldCount, color: 'warning' },
        { label: 'Overdue', count: this.state.overdueCount, color: 'attention' },
        { label: 'Completed This Month', count: this.state.completedThisMonth, color: 'good' },
        { label: 'Cancelled', count: this.state.cancelledCount, color: 'default' },
      ],
      totalActive: this.state.activeCount,
    };
  }

  public get template(): ISPFxAdaptiveCard {
    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'TextBlock',
          text: 'Project Portfolio Summary',
          weight: 'Bolder',
          size: 'Medium',
        },
        {
          type: 'Container',
          items: [
            {
              type: 'FactSet',
              facts: [
                {
                  $data: '${statuses}',
                  title: '${label}',
                  value: '${count}',
                },
              ],
            },
          ],
        },
        {
          type: 'TextBlock',
          text: 'Data refreshed at ${formatDateTime(utcNow(), "hh:mm tt")}',
          size: 'Small',
          isSubtle: true,
          horizontalAlignment: 'Right',
        },
      ],
    } as ISPFxAdaptiveCard;
  }
}
