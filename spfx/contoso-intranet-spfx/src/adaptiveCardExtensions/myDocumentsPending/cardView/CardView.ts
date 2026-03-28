import {
  BasePrimaryTextCardView,
  ICardButton,
  IQuickViewCardAction,
} from '@microsoft/sp-adaptive-card-extension-base';
import {
  IMyDocumentsPendingState,
  IMyDocumentsPendingProperties,
  QUICK_VIEW_REGISTRY_ID,
} from '../MyDocumentsPendingAdaptiveCardExtension';

export class CardView extends BasePrimaryTextCardView<
  IMyDocumentsPendingProperties,
  IMyDocumentsPendingState
> {
  public get cardButtons(): (ICardButton | undefined)[] {
    return [
      {
        title: 'View Details',
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
    const count = this.state.pendingCount;
    return {
      primaryText: `${count} Document${count !== 1 ? 's' : ''} Pending Review`,
      description:
        count > 0
          ? 'You have documents awaiting your approval'
          : 'No documents pending your review',
    };
  }
}
