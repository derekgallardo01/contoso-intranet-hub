import { useState, useEffect, useRef } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { SearchService, ISearchResult, ISearchRefiner, ISearchOptions } from '../services/SearchService';

interface UseSearchResult {
  results: ISearchResult[];
  refiners: ISearchRefiner[];
  totalRows: number;
  loading: boolean;
  error: Error | null;
}

export function useSearch(
  spHttpClient: SPHttpClient,
  siteUrl: string,
  query: string,
  options?: ISearchOptions
): UseSearchResult {
  const [results, setResults] = useState<ISearchResult[]>([]);
  const [refiners, setRefiners] = useState<ISearchRefiner[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setRefiners([]);
      setTotalRows(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        setError(null);
        const service = new SearchService(spHttpClient, siteUrl);
        const searchResult = await service.search(query, optionsRef.current);
        setResults(searchResult.results);
        setRefiners(searchResult.refiners);
        setTotalRows(searchResult.totalRows);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [spHttpClient, siteUrl, query]);

  return { results, refiners, totalRows, loading, error };
}
