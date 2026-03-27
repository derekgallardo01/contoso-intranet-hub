import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';

export class SharePointService {
  private _spHttpClient: SPHttpClient;

  constructor(spHttpClient: SPHttpClient) {
    this._spHttpClient = spHttpClient;
  }

  public async getListItems<T>(
    siteUrl: string,
    listName: string,
    query?: string
  ): Promise<T[]> {
    const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items${query ? `?${query}` : ''}`;
    const response: SPHttpClientResponse = await this._spHttpClient.get(
      endpoint,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get list items: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.value as T[];
  }

  public async createListItem<T>(
    siteUrl: string,
    listName: string,
    item: Partial<T>
  ): Promise<T> {
    const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items`;
    const options: ISPHttpClientOptions = {
      body: JSON.stringify(item),
    };

    const response: SPHttpClientResponse = await this._spHttpClient.post(
      endpoint,
      SPHttpClient.configurations.v1,
      options
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create list item: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }

  public async updateListItem<T>(
    siteUrl: string,
    listName: string,
    itemId: number,
    item: Partial<T>
  ): Promise<void> {
    const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${itemId})`;
    const options: ISPHttpClientOptions = {
      headers: {
        'IF-MATCH': '*',
        'X-HTTP-Method': 'MERGE',
      },
      body: JSON.stringify(item),
    };

    const response: SPHttpClientResponse = await this._spHttpClient.post(
      endpoint,
      SPHttpClient.configurations.v1,
      options
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update list item: ${response.status} ${error}`);
    }
  }

  public async deleteListItem(
    siteUrl: string,
    listName: string,
    itemId: number
  ): Promise<void> {
    const endpoint = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${itemId})`;
    const options: ISPHttpClientOptions = {
      headers: {
        'IF-MATCH': '*',
        'X-HTTP-Method': 'DELETE',
      },
    };

    const response: SPHttpClientResponse = await this._spHttpClient.post(
      endpoint,
      SPHttpClient.configurations.v1,
      options
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete list item: ${response.status} ${error}`);
    }
  }

  public async getSitePages(
    siteUrl: string,
    query?: string
  ): Promise<Array<{ id: number; title: string; url: string; description: string; modified: string }>> {
    const filter = query
      ? `&$filter=substringof('${encodeURIComponent(query)}',Title)`
      : '';
    const endpoint = `${siteUrl}/_api/sitepages/pages?$select=Id,Title,Url,Description,Modified&$orderby=Modified desc&$top=20${filter}`;

    const response: SPHttpClientResponse = await this._spHttpClient.get(
      endpoint,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get site pages: ${response.status} ${error}`);
    }

    const data = await response.json();
    return (data.value || []).map(
      (page: Record<string, string | number>) => ({
        id: page.Id,
        title: page.Title || '',
        url: page.Url || '',
        description: page.Description || '',
        modified: page.Modified || '',
      })
    );
  }

  public async getCurrentUser(): Promise<{
    id: number;
    title: string;
    email: string;
    loginName: string;
  }> {
    const endpoint = `${window.location.origin}/_api/web/currentuser`;
    const response: SPHttpClientResponse = await this._spHttpClient.get(
      endpoint,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.Id,
      title: data.Title,
      email: data.Email,
      loginName: data.LoginName,
    };
  }
}
