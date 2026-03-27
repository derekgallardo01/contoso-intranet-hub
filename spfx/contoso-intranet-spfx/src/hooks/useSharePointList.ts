import { useState, useEffect, useCallback } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { SharePointService } from '../services/SharePointService';

interface UseSharePointListResult<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSharePointList<T>(
  spHttpClient: SPHttpClient,
  siteUrl: string,
  listName: string,
  query?: string
): UseSharePointListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchItems = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const service = new SharePointService(spHttpClient);
        const results = await service.getListItems<T>(siteUrl, listName, query);
        if (!cancelled) {
          setItems(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (siteUrl && listName) {
      fetchItems().catch(() => { /* handled above */ });
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [spHttpClient, siteUrl, listName, query, refreshCounter]);

  return { items, loading, error, refresh };
}
