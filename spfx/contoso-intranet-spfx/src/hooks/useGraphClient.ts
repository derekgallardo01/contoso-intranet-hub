import { useState, useEffect } from 'react';
import { MSGraphClientV3 } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export function useGraphClient(
  context: WebPartContext
): { graphClient: MSGraphClientV3 | null; error: Error | null } {
  const [graphClient, setGraphClient] = useState<MSGraphClientV3 | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    context.msGraphClientFactory
      .getClient('3')
      .then((client: MSGraphClientV3) => {
        if (!cancelled) {
          setGraphClient(client);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [context]);

  return { graphClient, error };
}
