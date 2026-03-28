import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
} from '@microsoft/sp-webpart-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  DynamicProperty,
  IWebPartPropertiesMetadata,
} from '@microsoft/sp-dynamic-data';
import { OrgAnnouncements, IOrgAnnouncementsProps } from './components/OrgAnnouncements';

export interface IOrgAnnouncementsWebPartProps {
  siteUrl: string;
  listName: string;
  maxItems: number;
  department: DynamicProperty<string>;
}

export default class OrgAnnouncementsWebPart extends BaseClientSideWebPart<IOrgAnnouncementsWebPartProps> {
  public render(): void {
    // Read dynamic department filter from connected web part (if available)
    const dynamicDepartment = this.properties.department?.tryGetValue();

    const element: React.ReactElement<IOrgAnnouncementsProps> = React.createElement(
      OrgAnnouncements,
      {
        siteUrl: this.properties.siteUrl || this.context.pageContext.web.absoluteUrl,
        listName: this.properties.listName || 'Announcements',
        maxItems: this.properties.maxItems || 10,
        spHttpClient: this.context.spHttpClient,
        connectedDepartment: dynamicDepartment || undefined,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected get propertiesMetadata(): IWebPartPropertiesMetadata {
    return {
      'department': {
        dynamicPropertyType: 'string',
      },
    };
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
