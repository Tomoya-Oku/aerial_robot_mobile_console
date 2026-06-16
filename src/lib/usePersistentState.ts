import {useCallback, useEffect, useRef, useState} from 'react';
import {getJSON, setJSON} from './storage';

/**
 * State that hydrates from AsyncStorage on mount and persists on every change.
 * `hydrated` becomes true once the stored value (if any) has been loaded, so
 * callers can avoid acting on the initial default before persistence is ready.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    getJSON<T>(key).then(stored => {
      if (!alive) {
        return;
      }
      if (stored !== undefined) {
        setValue(stored);
      }
      hydratedRef.current = true;
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      setJSON(key, next);
    },
    [key],
  );

  return [value, update, hydrated];
}
