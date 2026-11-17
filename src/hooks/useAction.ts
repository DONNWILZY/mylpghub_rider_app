import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../session';

export function useAction() {
  const active = useRef(true);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function run<T>(task: () => Promise<T>, success: (result: T) => void) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await task();
      if (active.current) success(result);
    } catch (failure) {
      if (active.current) setError(getErrorMessage(failure));
    } finally {
      running.current = false;
      if (active.current) setBusy(false);
    }
  }

  return { busy, error, run };
}
