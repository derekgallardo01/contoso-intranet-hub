import * as React from 'react';
import * as ReactDom from 'react-dom';
import { override } from '@microsoft/decorators';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName,
} from '@microsoft/sp-application-base';
import { SPHttpClient } from '@microsoft/sp-http';
import {
  ClassificationBanner,
  IClassificationBannerProps,
  ClassificationLevel,
} from './components/ClassificationBanner';

export interface IClassificationHeaderProperties {}

export default class ClassificationHeaderApplicationCustomizer extends BaseApplicationCustomizer<IClassificationHeaderProperties> {
  private _topPlaceholder: PlaceholderContent | undefined;

  @override
  public onInit(): Promise<void> {
    this.context.placeholderProvider.changedEvent.add(
      this,
      this._renderPlaceholders
    );

    return Promise.resolve();
  }

  private async _renderPlaceholders(): Promise<void> {
    if (!this._topPlaceholder) {
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top,
        { onDispose: this._onDispose.bind(this) }
      );
    }

    if (!this._topPlaceholder || !this._topPlaceholder.domElement) return;

    const classification = await this._getPageClassification();

    if (!classification) {
      // No classification metadata found - do not render banner
      return;
    }

    const element: React.ReactElement<IClassificationBannerProps> =
      React.createElement(ClassificationBanner, {
        classification,
      });

    ReactDom.render(element, this._topPlaceholder.domElement);
  }

  private async _getPageClassification(): Promise<ClassificationLevel | null> {
    try {
      const pageId = this.context.pageContext.listItem?.id;
      if (!pageId) return null;

      const siteUrl = this.context.pageContext.web.absoluteUrl;
      const listId = this.context.pageContext.list?.id?.toString();
      if (!listId) return null;

      const endpoint = `${siteUrl}/_api/web/lists('${listId}')/items(${pageId})?$select=Classification`;
      const response = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (!response.ok) return null;

      const data = await response.json();
      const value = data.Classification as string;

      if (
        value === 'Public' ||
        value === 'Internal' ||
        value === 'Confidential' ||
        value === 'Restricted'
      ) {
        return value;
      }

      return null;
    } catch {
      return null;
    }
  }

  private _onDispose(): void {
    if (this._topPlaceholder?.domElement) {
      ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
    }
  }
}
