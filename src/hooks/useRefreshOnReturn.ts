import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnReturn(refresh: () => void) {
  const latest = useRef(refresh);
  const visited = useRef(false);
  latest.current = refresh;
  useFocusEffect(useCallback(() => {
    if (visited.current) latest.current();
    visited.current = true;
  }, []));
}
