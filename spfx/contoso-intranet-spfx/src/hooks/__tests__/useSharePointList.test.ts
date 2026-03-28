import { renderHook, waitFor, act } from '@testing-library/react';
import { useSharePointList } from '../useSharePointList';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = any;

// Track the mock instance created by the constructor
let mockGetListItems: jest.Mock;

jest.mock('../../services/SharePointService', () => {
  return {
    SharePointService: jest.fn().mockImplementation(() => {
      return { getListItems: mockGetListItems };
    }),
  };
});

describe('useSharePointList', () => {
  const mockSpHttpClient: AnyMock = {};
  const siteUrl = 'https://contoso.sharepoint.com/sites/intranet';
  const listName = 'Announcements';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetListItems = jest.fn().mockResolvedValue([]);
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, listName)
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return list items', async () => {
    const mockItems = [
      { Id: 1, Title: 'Item A' },
      { Id: 2, Title: 'Item B' },
    ];
    mockGetListItems.mockResolvedValue(mockItems);

    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, listName)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItems);
    expect(result.current.error).toBeNull();
  });

  it('should set error on fetch failure', async () => {
    mockGetListItems.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, listName)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Network error');
    expect(result.current.items).toEqual([]);
  });

  it('should not fetch when siteUrl is empty', async () => {
    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, '', listName)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetListItems).not.toHaveBeenCalled();
  });

  it('should not fetch when listName is empty', async () => {
    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, '')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetListItems).not.toHaveBeenCalled();
  });

  it('should re-fetch when refresh is called', async () => {
    const items1 = [{ Id: 1, Title: 'Version 1' }];
    const items2 = [{ Id: 1, Title: 'Version 2' }];
    mockGetListItems
      .mockResolvedValueOnce(items1)
      .mockResolvedValueOnce(items2);

    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, listName)
    );

    await waitFor(() => {
      expect(result.current.items).toEqual(items1);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.items).toEqual(items2);
    });
  });

  it('should pass OData query to service', async () => {
    const query = '$top=5&$orderby=Modified desc';

    renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, listName, query)
    );

    await waitFor(() => {
      expect(mockGetListItems).toHaveBeenCalledWith(siteUrl, listName, query);
    });
  });

  it('should handle non-Error exceptions', async () => {
    mockGetListItems.mockRejectedValue('string error');

    const { result } = renderHook(() =>
      useSharePointList(mockSpHttpClient, siteUrl, listName)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string error');
  });
});
