"use client";

import { useSyncExternalStore } from "react";

import {
  STOCK_CHART_RANGES,
  type StockChartRange,
} from "../server/types";

const STOCK_CHART_RANGE_STORAGE_EVENT = "stock-chart-range-storage";

const toStockChartRangeStorageKey = (providerKey: string) =>
  `stocks:chart-range:${providerKey}`;

const readStoredRange = (
  storageKey: string,
  fallbackRange: StockChartRange
): StockChartRange => {
  if (typeof window === "undefined") {
    return fallbackRange;
  }

  const savedRange = window.localStorage.getItem(storageKey) as StockChartRange | null;
  if (savedRange && STOCK_CHART_RANGES.includes(savedRange)) {
    return savedRange;
  }

  return fallbackRange;
};

const subscribeToStockChartRange = (
  storageKey: string,
  onStoreChange: () => void
) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };

  const onRangeStorage = (event: Event) => {
    const customEvent = event as CustomEvent<{ key?: string }>;
    if (customEvent.detail?.key === storageKey) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(STOCK_CHART_RANGE_STORAGE_EVENT, onRangeStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STOCK_CHART_RANGE_STORAGE_EVENT, onRangeStorage);
  };
};

const persistRange = (storageKey: string, range: StockChartRange) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, range);
  window.dispatchEvent(
    new CustomEvent<{ key: string }>(STOCK_CHART_RANGE_STORAGE_EVENT, {
      detail: { key: storageKey },
    })
  );
};

export const useStockChartRangeStore = (
  providerKey: string,
  fallbackRange: StockChartRange
) => {
  const storageKey = toStockChartRangeStorageKey(providerKey);

  const range = useSyncExternalStore(
    (onStoreChange) => subscribeToStockChartRange(storageKey, onStoreChange),
    () => readStoredRange(storageKey, fallbackRange),
    () => fallbackRange
  );

  const setRange = (nextRange: StockChartRange) => {
    persistRange(storageKey, nextRange);
  };

  return {
    range,
    setRange,
  };
};
