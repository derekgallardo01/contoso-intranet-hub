import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-webpart-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ProjectStatus, IProjectStatusProps } from './components/ProjectStatus';

export interface IProjectStatusWebPartProps {
  siteUrl: string;
  listName: string;
}

export default class ProjectStatusWebPart extends BaseClientSideWebPart<IProjectStatusWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IProjectStatusProps> = React.createElement(
      ProjectStatus,
      {
        siteUrl: this.properties.siteUrl || this.context.pageContext.web.absoluteUrl,
        listName: this.properties.listName || 'Projects',
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
            description: 'Configure the Project Status web part',
          },
          groups: [
            {
              groupName: 'Data Source',
              groupFields: [
                PropertyPaneTextField('siteUrl', {
                  label: 'Site URL',
                  description: 'Leave blank to use the current site',
                }),
                PropertyPaneTextField('listName', {
                  label: 'List Name',
                  description: 'Name of the projects list',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
