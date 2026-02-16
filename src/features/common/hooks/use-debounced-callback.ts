"use client";

import debounce from "lodash.debounce";
import { useEffect, useRef, useState } from "react";

type DebouncedCallback<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number
): DebouncedCallback<TArgs> {
  const debouncedRef = useRef<DebouncedCallback<TArgs> | null>(null);
  const invokeRef = useRef<DebouncedCallback<TArgs> | null>(null);

  useEffect(() => {
    const next = debounce((...args: TArgs) => callback(...args), delayMs) as DebouncedCallback<TArgs>;
    const previous = debouncedRef.current;
    debouncedRef.current = next;
    previous?.cancel();

    return () => {
      next.cancel();
    };
  }, [callback, delayMs]);

  const [invoke] = useState<DebouncedCallback<TArgs>>(() => {
    const callable = ((...args: TArgs) => {
      invokeRef.current?.(...args);
    }) as DebouncedCallback<TArgs>;

    callable.cancel = () => {
      invokeRef.current?.cancel();
    };
    callable.flush = () => {
      invokeRef.current?.flush();
    };
    return callable;
  });

  useEffect(() => {
    invokeRef.current = debouncedRef.current;
  }, [callback, delayMs]);

  useEffect(() => () => {
    debouncedRef.current?.cancel();
  }, []);

  return invoke;
}
