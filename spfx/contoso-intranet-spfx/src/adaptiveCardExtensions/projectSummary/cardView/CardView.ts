import {
  BasePrimaryTextCardView,
  ICardButton,
  IQuickViewCardAction,
} from '@microsoft/sp-adaptive-card-extension-base';
import {
  IProjectSummaryState,
  IProjectSummaryProperties,
  QUICK_VIEW_REGISTRY_ID,
} from '../ProjectSummaryAdaptiveCardExtension';

export class CardView extends BasePrimaryTextCardView<
  IProjectSummaryProperties,
  IProjectSummaryState
> {
  public get cardButtons(): (ICardButton | undefined)[] {
    return [
      {
        title: 'View Breakdown',
        action: {
          type: 'QuickView',
          parameters: {
            view: QUICK_VIEW_REGISTRY_ID,
          },
        } as IQuickViewCardAction,
      },
    ];
  }

  public get data(): { primaryText: string; description: string } {
    const { activeCount, overdueCount, completedThisMonth } = this.state;
    return {
      primaryText: `${activeCount} Active Projects`,
      description: `${overdueCount} overdue | ${completedThisMonth} completed this month`,
    };
  }
}
