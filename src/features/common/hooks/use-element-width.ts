"use client";

import { useEffect, useState, type RefObject } from "react";

export const useElementWidth = <TElement extends HTMLElement>(
  elementRef: RefObject<TElement | null>
) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return width;
};
