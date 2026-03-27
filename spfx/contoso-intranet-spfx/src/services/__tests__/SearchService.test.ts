import { SearchService, ISearchOptions } from '../SearchService';
import { SPHttpClient } from '@microsoft/sp-http';

// Mock SPHttpClient
const createMockResponse = (data: unknown, ok: boolean = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

const createMockSPHttpClient = () => {
  const mockClient = {
    post: jest.fn(),
    get: jest.fn(),
  };
  return mockClient as unknown as SPHttpClient;
};

describe('SearchService', () => {
  let searchService: SearchService;
  let mockClient: SPHttpClient;
  const siteUrl = 'https://contoso.sharepoint.com/sites/intranet';

  beforeEach(() => {
    mockClient = createMockSPHttpClient();
    searchService = new SearchService(mockClient, siteUrl);
  });

  describe('search', () => {
    it('should construct a valid search query', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: {
            TotalRows: 1,
            Table: {
              Rows: [
                {
                  Cells: [
                    { Key: 'Title', Value: 'Test Document' },
                    { Key: 'Path', Value: 'https://contoso.sharepoint.com/doc.pdf' },
                    { Key: 'Description', Value: 'A test document' },
                    { Key: 'Author', Value: 'John Doe' },
                    { Key: 'LastModifiedTime', Value: '2024-01-15T10:30:00Z' },
                  ],
                },
              ],
            },
          },
          RefinementResults: { Refiners: [] },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const result = await searchService.search('test');

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      expect(result.totalRows).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Test Document');
      expect(result.results[0].url).toBe('https://contoso.sharepoint.com/doc.pdf');
      expect(result.results[0].author).toBe('John Doe');
    });

    it('should handle search options correctly', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: { TotalRows: 0, Table: { Rows: [] } },
          RefinementResults: { Refiners: [] },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const options: ISearchOptions = {
        startRow: 10,
        rowLimit: 25,
        selectProperties: ['Title', 'Path'],
        refiners: ['ContentType', 'Department'],
        sortList: [{ property: 'LastModifiedTime', direction: 'descending' }],
      };

      await searchService.search('test query', options);

      const callArgs = (mockClient.post as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe(`${siteUrl}/_api/search/postquery`);

      const body = JSON.parse(callArgs[2].body);
      expect(body.request.Querytext).toBe('test query');
      expect(body.request.StartRow).toBe(10);
      expect(body.request.RowLimit).toBe(25);
      expect(body.request.SelectProperties.results).toEqual(['Title', 'Path']);
      expect(body.request.Refiners).toBe('ContentType,Department');
    });

    it('should map search results correctly', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: {
            TotalRows: 2,
            Table: {
              Rows: [
                {
                  Cells: [
                    { Key: 'Title', Value: 'Document A' },
                    { Key: 'Path', Value: '/sites/docs/a.docx' },
                    { Key: 'Author', Value: 'Alice' },
                    { Key: 'LastModifiedTime', Value: '2024-03-01T00:00:00Z' },
                    { Key: 'ContentType', Value: 'Document' },
                    { Key: 'Department', Value: 'Engineering' },
                  ],
                },
                {
                  Cells: [
                    { Key: 'Title', Value: 'Document B' },
                    { Key: 'Path', Value: '/sites/docs/b.pdf' },
                    { Key: 'Author', Value: 'Bob' },
                    { Key: 'LastModifiedTime', Value: '2024-02-15T00:00:00Z' },
                    { Key: 'ContentType', Value: 'PDF' },
                    { Key: 'Department', Value: 'Marketing' },
                  ],
                },
              ],
            },
          },
          RefinementResults: {
            Refiners: [
              {
                Name: 'ContentType',
                Entries: [
                  { RefinementName: 'Document', RefinementCount: 5 },
                  { RefinementName: 'PDF', RefinementCount: 3 },
                ],
              },
            ],
          },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const result = await searchService.search('*');

      expect(result.results).toHaveLength(2);
      expect(result.results[0].managedProperties.ContentType).toBe('Document');
      expect(result.results[1].managedProperties.Department).toBe('Marketing');
      expect(result.refiners).toHaveLength(1);
      expect(result.refiners[0].name).toBe('ContentType');
      expect(result.refiners[0].entries).toHaveLength(2);
      expect(result.refiners[0].entries[0].value).toBe('Document');
      expect(result.refiners[0].entries[0].count).toBe(5);
    });

    it('should handle empty results', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: { TotalRows: 0, Table: { Rows: [] } },
          RefinementResults: { Refiners: [] },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const result = await searchService.search('nonexistent content xyz');

      expect(result.results).toHaveLength(0);
      expect(result.totalRows).toBe(0);
      expect(result.refiners).toHaveLength(0);
    });

    it('should throw on failed search request', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse('Internal Server Error', false)
      );

      await expect(searchService.search('test')).rejects.toThrow('Search failed');
    });

    it('should handle missing PrimaryQueryResult gracefully', async () => {
      const mockData = {};
      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      const result = await searchService.search('test');
      expect(result.results).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });
  });

  describe('searchDocuments', () => {
    it('should add IsDocument:1 to the query', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: { TotalRows: 0, Table: { Rows: [] } },
          RefinementResults: { Refiners: [] },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      await searchService.searchDocuments('report');

      const callArgs = (mockClient.post as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[2].body);
      expect(body.request.Querytext).toContain('IsDocument:1');
      expect(body.request.Querytext).toContain('report');
    });

    it('should add path scope when siteUrl is provided', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: { TotalRows: 0, Table: { Rows: [] } },
          RefinementResults: { Refiners: [] },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      await searchService.searchDocuments('report', 'https://contoso.sharepoint.com/sites/hr');

      const callArgs = (mockClient.post as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[2].body);
      expect(body.request.Querytext).toContain('path:"https://contoso.sharepoint.com/sites/hr"');
    });
  });

  describe('searchPages', () => {
    it('should add ContentType:SitePage to the query', async () => {
      const mockData = {
        PrimaryQueryResult: {
          RelevantResults: { TotalRows: 0, Table: { Rows: [] } },
          RefinementResults: { Refiners: [] },
        },
      };

      (mockClient.post as jest.Mock).mockResolvedValue(createMockResponse(mockData));

      await searchService.searchPages('news');

      const callArgs = (mockClient.post as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[2].body);
      expect(body.request.Querytext).toContain('ContentType:SitePage');
      expect(body.request.Querytext).toContain('news');
    });
  });
});
