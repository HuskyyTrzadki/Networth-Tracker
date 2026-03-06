"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getTransactionDialogBalances,
  type TransactionDialogBalancesResponse,
} from "../../client/get-transaction-dialog-balances";

type CashBalancesByPortfolio = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

type AssetBalancesByPortfolio = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

type Result = Readonly<{
  cashBalancesByPortfolio: CashBalancesByPortfolio;
  assetBalancesByPortfolio: AssetBalancesByPortfolio;
  loadingPortfolioIds: readonly string[];
  balanceErrorMessagesByPortfolio: Readonly<Record<string, string>>;
  ensurePortfolioBalances: (portfolioId: string) => Promise<void>;
}>;

const mergePortfolioEntry = <TEntry extends Readonly<Record<string, string>>>(
  current: Readonly<Record<string, TEntry>>,
  portfolioId: string,
  nextValue: TEntry
) => ({
  ...current,
  [portfolioId]: nextValue,
});

export function useTransactionDialogBalanceCache(
  initialPortfolioId: string
): Result {
  const [cashBalancesByPortfolio, setCashBalancesByPortfolio] =
    useState<Record<string, Readonly<Record<string, string>>>>({});
  const [assetBalancesByPortfolio, setAssetBalancesByPortfolio] =
    useState<Record<string, Readonly<Record<string, string>>>>({});
  const [loadingPortfolioIds, setLoadingPortfolioIds] = useState<string[]>([]);
  const [balanceErrorMessagesByPortfolio, setBalanceErrorMessagesByPortfolio] =
    useState<Record<string, string>>({});
  const inFlightRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const loadedPortfolioIdsRef = useRef<Set<string>>(new Set());

  const ensurePortfolioBalances = useCallback(async (portfolioId: string) => {
    const normalizedPortfolioId = portfolioId.trim();
    if (!normalizedPortfolioId) {
      return;
    }

    if (loadedPortfolioIdsRef.current.has(normalizedPortfolioId)) {
      return;
    }

    const inFlight = inFlightRequestsRef.current.get(normalizedPortfolioId);
    if (inFlight) {
      return inFlight;
    }

    setLoadingPortfolioIds((current) =>
      current.includes(normalizedPortfolioId)
        ? current
        : [...current, normalizedPortfolioId]
    );
    setBalanceErrorMessagesByPortfolio((current) => {
      if (!current[normalizedPortfolioId]) {
        return current;
      }

      const next = { ...current };
      delete next[normalizedPortfolioId];
      return next;
    });

    const request = getTransactionDialogBalances({
      portfolioId: normalizedPortfolioId,
    })
      .then((response: TransactionDialogBalancesResponse) => {
        loadedPortfolioIdsRef.current.add(response.portfolioId);
        setCashBalancesByPortfolio((current) =>
          mergePortfolioEntry(current, response.portfolioId, response.cashBalances)
        );
        setAssetBalancesByPortfolio((current) =>
          mergePortfolioEntry(current, response.portfolioId, response.assetBalances)
        );
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać stanu portfela.";
        setBalanceErrorMessagesByPortfolio((current) => ({
          ...current,
          [normalizedPortfolioId]: message,
        }));
      })
      .finally(() => {
        inFlightRequestsRef.current.delete(normalizedPortfolioId);
        setLoadingPortfolioIds((current) =>
          current.filter((portfolioIdItem) => portfolioIdItem !== normalizedPortfolioId)
        );
      });

    inFlightRequestsRef.current.set(normalizedPortfolioId, request);
    return request;
  }, []);

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(() => {
      if (!isActive) {
        return;
      }

      return ensurePortfolioBalances(initialPortfolioId);
    });

    return () => {
      isActive = false;
    };
  }, [ensurePortfolioBalances, initialPortfolioId]);

  return {
    cashBalancesByPortfolio,
    assetBalancesByPortfolio,
    loadingPortfolioIds,
    balanceErrorMessagesByPortfolio,
    ensurePortfolioBalances,
  };
}
