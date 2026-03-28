import { SharePointService } from '../SharePointService';
import { SPHttpClient } from '@microsoft/sp-http';

const createMockResponse = (data: unknown, ok: boolean = true, status: number = ok ? 200 : 500) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
});

const createMockSPHttpClient = () => {
  const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return mockClient as unknown as SPHttpClient;
};

describe('SharePointService', () => {
  let service: SharePointService;
  let mockClient: SPHttpClient;
  const siteUrl = 'https://contoso.sharepoint.com/sites/intranet';

  beforeEach(() => {
    mockClient = createMockSPHttpClient();
    service = new SharePointService(mockClient);
  });

  describe('getListItems', () => {
    it('should fetch list items from the correct endpoint', async () => {
      const mockItems = [
        { Id: 1, Title: 'Item A' },
        { Id: 2, Title: 'Item B' },
      ];
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse({ value: mockItems })
      );

      const items = await service.getListItems(siteUrl, 'Announcements');

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      const callUrl = (mockClient.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("/_api/web/lists/getbytitle('Announcements')/items");
      expect(items).toEqual(mockItems);
    });

    it('should append OData query when provided', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse({ value: [] })
      );

      await service.getListItems(siteUrl, 'Tasks', '$top=5&$orderby=Created desc');

      const callUrl = (mockClient.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('?$top=5&$orderby=Created desc');
    });

    it('should URL-encode list names with special characters', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse({ value: [] })
      );

      await service.getListItems(siteUrl, 'My Documents & Files');

      const callUrl = (mockClient.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain(encodeURIComponent('My Documents & Files'));
    });

    it('should throw on failed request with status and message', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse('List not found', false, 404)
      );

      await expect(
        service.getListItems(siteUrl, 'NonExistent')
      ).rejects.toThrow('Failed to get list items: 404');
    });
  });

  describe('createListItem', () => {
    it('should POST to the items endpoint with JSON body', async () => {
      const newItem = { Title: 'New Announcement', Priority: 'High' };
      const createdItem = { Id: 10, ...newItem };
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse(createdItem)
      );

      await service.createListItem(siteUrl, 'Announcements', newItem);

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      const callUrl = (mockClient.post as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("/_api/web/lists/getbytitle('Announcements')/items");

      const callOptions = (mockClient.post as jest.Mock).mock.calls[0][2];
      expect(JSON.parse(callOptions.body)).toEqual(newItem);
    });

    it('should return the created item', async () => {
      const createdItem = { Id: 5, Title: 'Test' };
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse(createdItem)
      );

      const result = await service.createListItem(siteUrl, 'Tasks', { Title: 'Test' });

      // result is a Promise<T> from response.json()
      expect(result).toEqual(createdItem);
    });

    it('should throw on failed request', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse('Validation failed', false, 400)
      );

      await expect(
        service.createListItem(siteUrl, 'Tasks', { Title: '' })
      ).rejects.toThrow('Failed to create list item: 400');
    });
  });

  describe('updateListItem', () => {
    it('should POST with MERGE method and IF-MATCH headers', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse({}, true, 204)
      );

      await service.updateListItem(siteUrl, 'Tasks', 7, { Title: 'Updated' });

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      const callUrl = (mockClient.post as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("/_api/web/lists/getbytitle('Tasks')/items(7)");

      const callOptions = (mockClient.post as jest.Mock).mock.calls[0][2];
      expect(callOptions.headers['IF-MATCH']).toBe('*');
      expect(callOptions.headers['X-HTTP-Method']).toBe('MERGE');
      expect(JSON.parse(callOptions.body)).toEqual({ Title: 'Updated' });
    });

    it('should throw on failed update', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse('Item not found', false, 404)
      );

      await expect(
        service.updateListItem(siteUrl, 'Tasks', 999, { Title: 'X' })
      ).rejects.toThrow('Failed to update list item: 404');
    });
  });

  describe('deleteListItem', () => {
    it('should POST with DELETE method and IF-MATCH headers', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse({}, true, 204)
      );

      await service.deleteListItem(siteUrl, 'Tasks', 3);

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      const callUrl = (mockClient.post as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("/_api/web/lists/getbytitle('Tasks')/items(3)");

      const callOptions = (mockClient.post as jest.Mock).mock.calls[0][2];
      expect(callOptions.headers['IF-MATCH']).toBe('*');
      expect(callOptions.headers['X-HTTP-Method']).toBe('DELETE');
    });

    it('should not include a body', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse({}, true, 204)
      );

      await service.deleteListItem(siteUrl, 'Tasks', 3);

      const callOptions = (mockClient.post as jest.Mock).mock.calls[0][2];
      expect(callOptions.body).toBeUndefined();
    });

    it('should throw on failed delete', async () => {
      (mockClient.post as jest.Mock).mockResolvedValue(
        createMockResponse('Forbidden', false, 403)
      );

      await expect(
        service.deleteListItem(siteUrl, 'Tasks', 5)
      ).rejects.toThrow('Failed to delete list item: 403');
    });
  });

  describe('getSitePages', () => {
    it('should fetch site pages from the correct endpoint', async () => {
      const mockPages = [
        { Id: 1, Title: 'Home', Url: '/sites/intranet/SitePages/Home.aspx', Description: 'Home page', Modified: '2024-01-01T00:00:00Z' },
        { Id: 2, Title: 'About', Url: '/sites/intranet/SitePages/About.aspx', Description: 'About us', Modified: '2024-01-02T00:00:00Z' },
      ];
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse({ value: mockPages })
      );

      const pages = await service.getSitePages(siteUrl);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      const callUrl = (mockClient.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/_api/sitepages/pages');
      expect(pages).toHaveLength(2);
      expect(pages[0]).toEqual({
        id: 1,
        title: 'Home',
        url: '/sites/intranet/SitePages/Home.aspx',
        description: 'Home page',
        modified: '2024-01-01T00:00:00Z',
      });
    });

    it('should apply text filter when query is provided', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse({ value: [] })
      );

      await service.getSitePages(siteUrl, 'policy');

      const callUrl = (mockClient.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("substringof('policy',Title)");
    });

    it('should handle missing fields with defaults', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse({ value: [{ Id: 1 }] })
      );

      const pages = await service.getSitePages(siteUrl);

      expect(pages[0].title).toBe('');
      expect(pages[0].url).toBe('');
      expect(pages[0].description).toBe('');
    });

    it('should throw on failed request', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse('Not Found', false, 404)
      );

      await expect(
        service.getSitePages(siteUrl)
      ).rejects.toThrow('Failed to get site pages: 404');
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user info', async () => {
      const userData = {
        Id: 42,
        Title: 'Jane Doe',
        Email: 'jane@contoso.com',
        LoginName: 'i:0#.f|membership|jane@contoso.com',
      };
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse(userData)
      );

      const user = await service.getCurrentUser();

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(user).toEqual({
        id: 42,
        title: 'Jane Doe',
        email: 'jane@contoso.com',
        loginName: 'i:0#.f|membership|jane@contoso.com',
      });
    });

    it('should throw on failed request', async () => {
      (mockClient.get as jest.Mock).mockResolvedValue(
        createMockResponse('Unauthorized', false, 401)
      );

      await expect(service.getCurrentUser()).rejects.toThrow('Failed to get current user: 401');
    });
  });
});
