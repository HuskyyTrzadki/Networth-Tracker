"use client";

import debounce from "lodash.debounce";
import { useEffect, useMemo } from "react";

type DebouncedCallback<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number
): DebouncedCallback<TArgs> {
  const debounced = useMemo(
    () => debounce((...args: TArgs) => callback(...args), delayMs),
    [callback, delayMs]
  );

  useEffect(
    () => () => {
      debounced.cancel();
    },
    [debounced]
  );

  return debounced as DebouncedCallback<TArgs>;
}
