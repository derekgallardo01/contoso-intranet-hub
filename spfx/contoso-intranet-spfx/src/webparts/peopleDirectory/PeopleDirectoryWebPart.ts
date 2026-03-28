import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneToggle,
} from '@microsoft/sp-webpart-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  IDynamicDataPropertyDefinition,
  IDynamicDataCallables,
} from '@microsoft/sp-dynamic-data';
import { PeopleDirectory, IPeopleDirectoryProps } from './components/PeopleDirectory';

export interface IPeopleDirectoryWebPartProps {
  showPresence: boolean;
}

export default class PeopleDirectoryWebPart
  extends BaseClientSideWebPart<IPeopleDirectoryWebPartProps>
  implements IDynamicDataCallables
{
  private _selectedDepartment: string = '';

  protected onInit(): Promise<void> {
    this.context.dynamicDataSourceManager.initializeSource(this);
    return Promise.resolve();
  }

  public getPropertyDefinitions(): ReadonlyArray<IDynamicDataPropertyDefinition> {
    return [
      {
        id: 'department',
        title: 'Selected Department',
      },
    ];
  }

  public getPropertyValue(propertyId: string): string {
    if (propertyId === 'department') {
      return this._selectedDepartment;
    }
    return '';
  }

  private _onDepartmentSelected = (department: string): void => {
    this._selectedDepartment = department;
    this.context.dynamicDataSourceManager.notifyPropertyChanged('department');
  };

  public render(): void {
    const element: React.ReactElement<IPeopleDirectoryProps> = React.createElement(
      PeopleDirectory,
      {
        context: this.context,
        showPresence: this.properties.showPresence !== false,
        onDepartmentSelected: this._onDepartmentSelected,
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
            description: 'Configure the People Directory web part',
          },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneToggle('showPresence', {
                  label: 'Show Presence Status',
                  onText: 'Yes',
                  offText: 'No',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
