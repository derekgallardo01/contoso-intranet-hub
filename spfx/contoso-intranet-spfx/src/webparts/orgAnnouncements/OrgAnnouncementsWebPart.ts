import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
} from '@microsoft/sp-webpart-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { OrgAnnouncements, IOrgAnnouncementsProps } from './components/OrgAnnouncements';

export interface IOrgAnnouncementsWebPartProps {
  siteUrl: string;
  listName: string;
  maxItems: number;
}

export default class OrgAnnouncementsWebPart extends BaseClientSideWebPart<IOrgAnnouncementsWebPartProps> {
  private _connectedDepartment: string | undefined;

  protected onInit(): Promise<void> {
    // Listen for dynamic data from connected web parts (e.g., PeopleDirectory)
    this.context.dynamicDataProvider.registerAvailableSourcesChanged(() => {
      this._tryGetConnectedDepartment();
      this.render();
    });
    return Promise.resolve();
  }

  private _tryGetConnectedDepartment(): void {
    try {
      const sources = this.context.dynamicDataProvider.getAvailableSources();
      for (const source of sources) {
        const props = source.getPropertyDefinitions();
        const deptProp = props.find((p: { id: string }) => p.id === 'department');
        if (deptProp) {
          const value = source.getPropertyValue('department');
          if (typeof value === 'string' && value !== 'All') {
            this._connectedDepartment = value;
            return;
          }
        }
      }
    } catch {
      // No connected source available
    }
    this._connectedDepartment = undefined;
  }

  public render(): void {
    const element: React.ReactElement<IOrgAnnouncementsProps> = React.createElement(
      OrgAnnouncements,
      {
        siteUrl: this.properties.siteUrl || this.context.pageContext.web.absoluteUrl,
        listName: this.properties.listName || 'Announcements',
        maxItems: this.properties.maxItems || 10,
        spHttpClient: this.context.spHttpClient,
        connectedDepartment: this._connectedDepartment,
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
            description: 'Configure the Org Announcements web part',
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
                  description: 'Name of the announcements list',
                }),
                PropertyPaneSlider('maxItems', {
                  label: 'Maximum Items',
                  min: 1,
                  max: 50,
                  step: 1,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
