import * as React from 'react';
import * as ReactDom from 'react-dom';
import { override } from '@microsoft/decorators';
import {
  BaseFieldCustomizer,
  IFieldCustomizerCellEventParameters,
} from '@microsoft/sp-listview-extensibility';
import { ClassificationBadge, IClassificationBadgeProps } from './components/ClassificationBadge';

export interface IDocumentMetadataFieldCustomizerProperties {}

export default class DocumentMetadataFieldCustomizer extends BaseFieldCustomizer<IDocumentMetadataFieldCustomizerProperties> {
  @override
  public onInit(): Promise<void> {
    return Promise.resolve();
  }

  @override
  public onRenderCell(event: IFieldCustomizerCellEventParameters): void {
    const fieldValue: string = event.fieldValue || '';

    const element: React.ReactElement<IClassificationBadgeProps> =
      React.createElement(ClassificationBadge, {
        classification: fieldValue,
      });

    ReactDom.render(element, event.domElement);
  }

  @override
  public onDisposeCell(event: IFieldCustomizerCellEventParameters): void {
    ReactDom.unmountComponentAtNode(event.domElement);
  }
}
