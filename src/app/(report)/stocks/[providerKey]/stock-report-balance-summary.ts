export type BalanceSnapshot = Readonly<{
  assetsTotal: number;
  liquidAssets: number;
  debt: number;
  equity: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebt: number;
}>;

export type BalanceRisk = "Niskie" | "Umiarkowane" | "Podwyzszone";

export const BALANCE_SNAPSHOT: BalanceSnapshot = {
  assetsTotal: 366.0,
  liquidAssets: 81.6,
  debt: 83.9,
  equity: 217.2,
  debtToEquity: 83.9 / 217.2,
  debtToAssets: 83.9 / 366.0,
  netDebt: 83.9 - 81.6,
};

export const formatBillions = (value: number) => `$${value.toFixed(1)}B`;
export const formatRatio = (value: number) => `${value.toFixed(2)}x`;
export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export const buildBalanceNarrative = (
  snapshot: BalanceSnapshot
): Readonly<{ summary: string; risk: BalanceRisk }> => {
  if (snapshot.liquidAssets >= snapshot.debt && snapshot.netDebt <= 0) {
    const surplus = snapshot.liquidAssets - snapshot.debt;
    return {
      summary: `Gotowka pokrywa caly dlug, a po splacie zostaje bufor ${formatBillions(surplus)}.`,
      risk: "Niskie",
    };
  }

  if (snapshot.debtToAssets > 0.35 || snapshot.debtToEquity > 1) {
    return {
      summary:
        "Zadluzenie jest wysokie wzgledem skali bilansu, a obsluga dlugu wymaga uwagi w slabszym cyklu.",
      risk: "Podwyzszone",
    };
  }

  return {
    summary:
      "Dlug jest umiarkowany wzgledem kapitalu i aktywow, a bilans pozostaje stabilny przy obecnej rentownosci.",
    risk: "Umiarkowane",
  };
};

