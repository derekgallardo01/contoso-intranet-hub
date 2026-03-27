import { ISPFxAdaptiveCard, BaseAdaptiveCardQuickView } from '@microsoft/sp-adaptive-card-extension-base';
import {
  IMyDocumentsPendingState,
  IMyDocumentsPendingProperties,
} from '../MyDocumentsPendingAdaptiveCardExtension';

export class QuickView extends BaseAdaptiveCardQuickView<
  IMyDocumentsPendingProperties,
  IMyDocumentsPendingState
> {
  public get data(): Record<string, unknown> {
    return {
      documents: this.state.documents.map((doc) => ({
        ...doc,
        requestDate: new Date(doc.requestDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      })),
      hasDocuments: this.state.documents.length > 0,
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
          text: 'Pending Document Reviews',
          weight: 'Bolder',
          size: 'Medium',
        },
        {
          type: 'Container',
          $when: '${hasDocuments}',
          items: [
            {
              type: 'Container',
              $data: '${documents}',
              separator: true,
              items: [
                {
                  type: 'ColumnSet',
                  columns: [
                    {
                      type: 'Column',
                      width: 'stretch',
                      items: [
                        {
                          type: 'TextBlock',
                          text: '${title}',
                          weight: 'Bolder',
                          wrap: true,
                        },
                        {
                          type: 'TextBlock',
                          text: 'Requested by ${requester} on ${requestDate}',
                          size: 'Small',
                          isSubtle: true,
                          wrap: true,
                        },
                      ],
                    },
                    {
                      type: 'Column',
                      width: 'auto',
                      verticalContentAlignment: 'Center',
                      items: [
                        {
                          type: 'ActionSet',
                          actions: [
                            {
                              type: 'Action.Submit',
                              title: 'Approve',
                              style: 'positive',
                              data: {
                                action: 'approve',
                                documentId: '${id}',
                              },
                            },
                            {
                              type: 'Action.Submit',
                              title: 'Reject',
                              style: 'destructive',
                              data: {
                                action: 'reject',
                                documentId: '${id}',
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'TextBlock',
          $when: '${!hasDocuments}',
          text: 'No documents pending your review.',
          isSubtle: true,
          horizontalAlignment: 'Center',
        },
      ],
    } as ISPFxAdaptiveCard;
  }
}
