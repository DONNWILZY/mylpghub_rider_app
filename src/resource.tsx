import { useEffect, useRef, useState } from 'react';
import { ApiError } from './api';
import { getErrorMessage, useSession } from './session';

type Result<T> =
  | { request: string; status: 'success'; data: T }
  | { request: string; status: 'error'; message: string };

export function useResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  token?: string,
) {
  const { expire } = useSession();
  const current = useRef({ load, expire });
  current.current = { load, expire };

  const [generation, setGeneration] = useState(0);
  const [result, setResult] = useState<Result<T>>();
  const request = key + ':' + generation;
  const value = result?.request === request ? result : undefined;

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const data = await current.current.load(controller.signal);
        if (!controller.signal.aborted) setResult({ request, status: 'success', data });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401 && token) {
          try {
            await current.current.expire(token);
          } catch (storageError) {
            if (!controller.signal.aborted) {
              setResult({ request, status: 'error', message: getErrorMessage(storageError) });
            }
          }
          return;
        }
        setResult({ request, status: 'error', message: getErrorMessage(error) });
      }
    }
    void fetchData();
    return () => controller.abort();
  }, [request, token]);

  return {
    value,
    reload: () => setGeneration(previous => previous + 1),
  };
}

export type Resource<T> = ReturnType<typeof useResource<T>>;
