import { renderHook, waitFor, act } from '@testing-library/react';
import { useSearch } from '../useSearch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = any;

// Track the mock instance created by the constructor
let mockSearch: jest.Mock;

jest.mock('../../services/SearchService', () => {
  return {
    SearchService: jest.fn().mockImplementation(() => {
      return { search: mockSearch };
    }),
  };
});

describe('useSearch', () => {
  const mockSpHttpClient: AnyMock = {};
  const siteUrl = 'https://contoso.sharepoint.com/sites/intranet';
  const emptyResult = { results: [], refiners: [], totalRows: 0 };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearch = jest.fn().mockResolvedValue(emptyResult);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with empty results and not loading when query is empty', () => {
    const { result } = renderHook(() =>
      useSearch(mockSpHttpClient, siteUrl, '')
    );

    expect(result.current.results).toEqual([]);
    expect(result.current.refiners).toEqual([]);
    expect(result.current.totalRows).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should clear results when query becomes empty', async () => {
    const searchResult = {
      results: [{ title: 'Doc', url: '/doc', description: '', author: '', lastModified: '', managedProperties: {} }],
      refiners: [],
      totalRows: 1,
    };
    mockSearch.mockResolvedValue(searchResult);

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useSearch(mockSpHttpClient, siteUrl, query),
      { initialProps: { query: 'test' } }
    );

    // Advance past debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    // Clear query
    rerender({ query: '' });

    expect(result.current.results).toEqual([]);
    expect(result.current.totalRows).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('should clear results when query is whitespace-only', () => {
    const { result } = renderHook(() =>
      useSearch(mockSpHttpClient, siteUrl, '   ')
    );

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should debounce search by 300ms', async () => {
    renderHook(() => useSearch(mockSpHttpClient, siteUrl, 'test'));

    // Should not have called search yet
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance 200ms - still shouldn't have called
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance remaining 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledTimes(1);
    });
  });

  it('should set loading to true immediately when query is provided', () => {
    const { result } = renderHook(() =>
      useSearch(mockSpHttpClient, siteUrl, 'test')
    );

    expect(result.current.loading).toBe(true);
  });

  it('should return search results after debounce', async () => {
    const searchResult = {
      results: [
        { title: 'Policy A', url: '/docs/a.pdf', description: 'A policy', author: 'Admin', lastModified: '2024-01-01', managedProperties: {} },
      ],
      refiners: [
        { name: 'ContentType', entries: [{ value: 'PDF', count: 3 }] },
      ],
      totalRows: 1,
    };
    mockSearch.mockResolvedValue(searchResult);

    const { result } = renderHook(() =>
      useSearch(mockSpHttpClient, siteUrl, 'policy')
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].title).toBe('Policy A');
    expect(result.current.refiners).toHaveLength(1);
    expect(result.current.totalRows).toBe(1);
  });

  it('should set error on search failure', async () => {
    mockSearch.mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() =>
      useSearch(mockSpHttpClient, siteUrl, 'test')
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Search failed');
  });

  it('should cancel pending debounce on query change', async () => {
    const { rerender } = renderHook(
      ({ query }: { query: string }) => useSearch(mockSpHttpClient, siteUrl, query),
      { initialProps: { query: 'fir' } }
    );

    // Advance 200ms, then change query
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ query: 'first' });

    // Advance another 200ms - original debounce would have fired but was cancelled
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Only after the full 300ms from the second query
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledTimes(1);
    });

    expect(mockSearch).toHaveBeenCalledWith('first', undefined);
  });

  it('should cancel debounce on unmount', () => {
    const { unmount } = renderHook(() =>
      useSearch(mockSpHttpClient, siteUrl, 'test')
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearch).not.toHaveBeenCalled();
  });
});
