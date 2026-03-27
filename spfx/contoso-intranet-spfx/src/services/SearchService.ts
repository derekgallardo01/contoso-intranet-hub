import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

export interface ISearchResult {
  title: string;
  url: string;
  description: string;
  author: string;
  lastModified: string;
  managedProperties: Record<string, string>;
}

export interface ISearchRefiner {
  name: string;
  entries: Array<{ value: string; count: number }>;
}

export interface ISearchOptions {
  startRow?: number;
  rowLimit?: number;
  selectProperties?: string[];
  refiners?: string[];
  refinementFilters?: string[];
  resultSourceId?: string;
  sortList?: Array<{ property: string; direction: 'ascending' | 'descending' }>;
}

export class SearchService {
  private _spHttpClient: SPHttpClient;
  private _siteUrl: string;

  constructor(spHttpClient: SPHttpClient, siteUrl: string) {
    this._spHttpClient = spHttpClient;
    this._siteUrl = siteUrl;
  }

  public async search(
    query: string,
    options?: ISearchOptions
  ): Promise<{ results: ISearchResult[]; refiners: ISearchRefiner[]; totalRows: number }> {
    const selectProperties = options?.selectProperties || [
      'Title',
      'Path',
      'Description',
      'Author',
      'LastModifiedTime',
      'ContentType',
      'Department',
    ];

    const requestBody: Record<string, unknown> = {
      request: {
        Querytext: query || '*',
        StartRow: options?.startRow || 0,
        RowLimit: options?.rowLimit || 50,
        SelectProperties: {
          results: selectProperties,
        },
        TrimDuplicates: true,
      },
    };

    if (options?.refiners && options.refiners.length > 0) {
      (requestBody.request as Record<string, unknown>).Refiners = options.refiners.join(',');
    }

    if (options?.refinementFilters && options.refinementFilters.length > 0) {
      (requestBody.request as Record<string, unknown>).RefinementFilters = {
        results: options.refinementFilters,
      };
    }

    if (options?.resultSourceId) {
      (requestBody.request as Record<string, unknown>).SourceId = options.resultSourceId;
    }

    if (options?.sortList && options.sortList.length > 0) {
      (requestBody.request as Record<string, unknown>).SortList = {
        results: options.sortList.map((s) => ({
          Property: s.property,
          Direction: s.direction === 'ascending' ? 0 : 1,
        })),
      };
    }

    const endpoint = `${this._siteUrl}/_api/search/postquery`;
    const response: SPHttpClientResponse = await this._spHttpClient.post(
      endpoint,
      SPHttpClient.configurations.v1,
      {
        headers: { 'odata-version': '3.0' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Search failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    const relevantResults = data.PrimaryQueryResult?.RelevantResults;
    const totalRows: number = relevantResults?.TotalRows || 0;

    const results: ISearchResult[] = (relevantResults?.Table?.Rows || []).map(
      (row: { Cells: Array<{ Key: string; Value: string }> }) => {
        const cells = row.Cells.reduce<Record<string, string>>((acc, cell) => {
          acc[cell.Key] = cell.Value;
          return acc;
        }, {});

        return {
          title: cells.Title || '',
          url: cells.Path || '',
          description: cells.Description || cells.HitHighlightedSummary || '',
          author: cells.Author || '',
          lastModified: cells.LastModifiedTime || '',
          managedProperties: cells,
        };
      }
    );

    const refiners: ISearchRefiner[] = (
      data.PrimaryQueryResult?.RefinementResults?.Refiners || []
    ).map((refiner: { Name: string; Entries: Array<{ RefinementName: string; RefinementCount: number }> }) => ({
      name: refiner.Name,
      entries: (refiner.Entries || []).map(
        (entry: { RefinementName: string; RefinementCount: number }) => ({
          value: entry.RefinementName,
          count: entry.RefinementCount,
        })
      ),
    }));

    return { results, refiners, totalRows };
  }

  public async searchDocuments(
    query: string,
    siteUrl?: string
  ): Promise<{ results: ISearchResult[]; refiners: ISearchRefiner[]; totalRows: number }> {
    const scope = siteUrl ? `path:"${siteUrl}"` : '';
    const fullQuery = `${query} ${scope} IsDocument:1`.trim();

    return this.search(fullQuery, {
      selectProperties: [
        'Title',
        'Path',
        'Description',
        'Author',
        'LastModifiedTime',
        'ContentType',
        'Department',
        'RefinableString00',
        'Size',
        'FileExtension',
        'EditorOWSUSER',
      ],
      refiners: ['ContentType', 'Department', 'RefinableString00', 'FileExtension'],
      rowLimit: 50,
    });
  }

  public async searchPages(
    query: string,
    siteUrl?: string
  ): Promise<{ results: ISearchResult[]; refiners: ISearchRefiner[]; totalRows: number }> {
    const scope = siteUrl ? `path:"${siteUrl}"` : '';
    const fullQuery = `${query} ${scope} ContentType:SitePage`.trim();

    return this.search(fullQuery, {
      selectProperties: [
        'Title',
        'Path',
        'Description',
        'Author',
        'LastModifiedTime',
        'Department',
      ],
      rowLimit: 20,
    });
  }
}
