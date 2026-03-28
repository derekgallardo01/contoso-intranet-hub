import * as React from 'react';
import * as ReactDom from 'react-dom';
import { override } from '@microsoft/decorators';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName,
} from '@microsoft/sp-application-base';
import { SPHttpClient } from '@microsoft/sp-http';
import { INavigationNode } from '../../models/INavigationNode';
import { CacheService } from '../../services/CacheService';
import { MegaMenu, IMegaMenuProps } from './components/MegaMenu';

export interface IGlobalNavigationProperties {
  siteUrl: string;
  listName: string;
  cacheDurationMinutes: number;
}

interface INavListItem {
  Id: number;
  Title: string;
  Url: string;
  ParentId: string | null;
  SortOrder: number;
  OpenInNewTab: boolean;
}

export default class GlobalNavigationApplicationCustomizer extends BaseApplicationCustomizer<IGlobalNavigationProperties> {
  private _topPlaceholder: PlaceholderContent | undefined;
  private _cacheService!: CacheService;

  @override
  public onInit(): Promise<void> {
    this._cacheService = new CacheService('session', 'contoso_nav_');

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

    const navigationNodes = await this._getNavigationNodes();

    const element: React.ReactElement<IMegaMenuProps> = React.createElement(
      MegaMenu,
      { nodes: navigationNodes }
    );

    ReactDom.render(element, this._topPlaceholder.domElement);
  }

  private async _getNavigationNodes(): Promise<INavigationNode[]> {
    const cacheKey = 'navigation_nodes';
    const cached = this._cacheService.get<INavigationNode[]>(cacheKey);
    if (cached) return cached;

    try {
      const siteUrl =
        this.properties.siteUrl ||
        this.context.pageContext.web.absoluteUrl;
      const listName = this.properties.listName || 'Navigation';

      const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items?$select=Id,Title,Url,ParentId,SortOrder,OpenInNewTab&$orderby=SortOrder`;

      const response = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (!response.ok) return [];

      const data = await response.json();
      const items: INavListItem[] = data.value || [];

      const nodes = this._buildNavTree(items);
      const cacheDuration = this.properties.cacheDurationMinutes || 30;
      this._cacheService.set(cacheKey, nodes, cacheDuration);
      return nodes;
    } catch {
      return [];
    }
  }

  private _buildNavTree(items: INavListItem[]): INavigationNode[] {
    const nodeMap = new Map<number, INavigationNode>();
    const rootNodes: INavigationNode[] = [];

    items.forEach((item) => {
      nodeMap.set(item.Id, {
        id: item.Id,
        title: item.Title,
        url: item.Url || '#',
        parent: item.ParentId,
        order: item.SortOrder || 0,
        openInNewTab: item.OpenInNewTab || false,
        children: [],
      });
    });

    items.forEach((item) => {
      const node = nodeMap.get(item.Id)!;
      if (item.ParentId) {
        const parentId = parseInt(item.ParentId, 10);
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (nodes: INavigationNode[]): void => {
      nodes.sort((a, b) => a.order - b.order);
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  }

  private _onDispose(): void {
    if (this._topPlaceholder?.domElement) {
      ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
    }
  }
}
