import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";

export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState<T>(value);

  // Create a stable debounced setter
  const setDebouncedDebounced = useMemo(
    () => debounce((v: T) => setDebounced(v), delay),
    [delay]
  );

  useEffect(() => {
    setDebouncedDebounced(value);
    return () => {
      setDebouncedDebounced.cancel();
    };
  }, [value, setDebouncedDebounced]);

  return debounced;
}

