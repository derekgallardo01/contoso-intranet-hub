import { renderHook, waitFor } from '@testing-library/react';
import { useGraphClient } from '../useGraphClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockContext = any;

describe('useGraphClient', () => {
  const createMockContext = (resolveWith?: unknown, rejectWith?: Error): MockContext => {
    const getClient = jest.fn();

    if (rejectWith) {
      getClient.mockRejectedValue(rejectWith);
    } else {
      getClient.mockResolvedValue(resolveWith || {});
    }

    return {
      msGraphClientFactory: { getClient },
    };
  };

  it('should initialize with null graphClient and null error', () => {
    const mockContext = createMockContext();
    const { result } = renderHook(() => useGraphClient(mockContext));

    expect(result.current.graphClient).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should resolve the graph client', async () => {
    const mockGraphClient = { api: jest.fn() };
    const mockContext = createMockContext(mockGraphClient);

    const { result } = renderHook(() => useGraphClient(mockContext));

    await waitFor(() => {
      expect(result.current.graphClient).toBe(mockGraphClient);
    });

    expect(result.current.error).toBeNull();
    expect(mockContext.msGraphClientFactory.getClient).toHaveBeenCalledWith('3');
  });

  it('should set error when client factory rejects', async () => {
    const mockError = new Error('Failed to get graph client');
    const mockContext = createMockContext(undefined, mockError);

    const { result } = renderHook(() => useGraphClient(mockContext));

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(result.current.graphClient).toBeNull();
  });

  it('should not update state after unmount (cancellation)', async () => {
    let resolvePromise: (value: unknown) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const mockContext: MockContext = {
      msGraphClientFactory: {
        getClient: jest.fn().mockReturnValue(delayedPromise),
      },
    };

    const { result, unmount } = renderHook(() => useGraphClient(mockContext));

    // Unmount before the promise resolves
    unmount();
    resolvePromise!({ api: jest.fn() });

    // State should not have updated
    expect(result.current.graphClient).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should re-fetch when context changes', async () => {
    const client1 = { api: jest.fn(), id: 1 };
    const client2 = { api: jest.fn(), id: 2 };

    const context1 = createMockContext(client1);
    const context2 = createMockContext(client2);

    const { result, rerender } = renderHook(
      ({ ctx }: { ctx: MockContext }) => useGraphClient(ctx),
      { initialProps: { ctx: context1 } }
    );

    await waitFor(() => {
      expect(result.current.graphClient).toBe(client1);
    });

    rerender({ ctx: context2 });

    await waitFor(() => {
      expect(result.current.graphClient).toBe(client2);
    });
  });
});
