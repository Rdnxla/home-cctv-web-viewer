import {useCallback, useSyncExternalStore} from 'react';

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = globalThis.matchMedia(query);
      mediaQueryList.addEventListener('change', onChange);
      return () => {
        mediaQueryList.removeEventListener('change', onChange);
      };
    },
    [query]
  );
  const getSnapshot = useCallback(() => globalThis.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
