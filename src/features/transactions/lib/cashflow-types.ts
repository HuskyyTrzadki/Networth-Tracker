export const cashflowTypes = [
  "DEPOSIT",
  "WITHDRAWAL",
  "DIVIDEND",
  "INTEREST",
  "FEE",
  "TAX",
  "TRADE_SETTLEMENT",
] as const;

export type CashflowType = (typeof cashflowTypes)[number];

export const cashflowTypeLabels: Record<CashflowType, string> = {
  DEPOSIT: "Wpłata",
  WITHDRAWAL: "Wypłata",
  DIVIDEND: "Dywidenda",
  INTEREST: "Odsetki",
  FEE: "Opłata FX",
  TAX: "Podatek",
  TRADE_SETTLEMENT: "Rozliczenie",
};

export const cashflowTypeUiOptions = [
  "DEPOSIT",
  "WITHDRAWAL",
] as const satisfies readonly CashflowType[];

export type CashflowTypeUi = (typeof cashflowTypeUiOptions)[number];
