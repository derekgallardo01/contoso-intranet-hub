import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-webpart-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { DocumentDashboard, IDocumentDashboardProps } from './components/DocumentDashboard';

export interface IDocumentDashboardWebPartProps {
  searchScope: string;
}

export default class DocumentDashboardWebPart extends BaseClientSideWebPart<IDocumentDashboardWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IDocumentDashboardProps> = React.createElement(
      DocumentDashboard,
      {
        siteUrl: this.context.pageContext.web.absoluteUrl,
        searchScope: this.properties.searchScope || '',
        spHttpClient: this.context.spHttpClient,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Configure the Document Dashboard web part',
          },
          groups: [
            {
              groupName: 'Search Settings',
              groupFields: [
                PropertyPaneTextField('searchScope', {
                  label: 'Search Scope',
                  description: 'Site URL to scope search results (leave blank for all)',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
