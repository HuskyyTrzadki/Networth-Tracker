import type { CashflowTypeUi } from "../../lib/cashflow-types";
import type { FormValues } from "../AddTransactionDialogContent";

type SubmitPayloadFields = Readonly<{
  price: string;
  fee: string;
  consumeCash: boolean;
  cashCurrency?: string;
  fxFee?: string;
  cashflowType?: CashflowTypeUi;
}>;

export const buildSubmitPayloadFields = (
  values: FormValues,
  isCashTab: boolean
): SubmitPayloadFields => {
  if (isCashTab) {
    return {
      price: "1",
      fee: "0",
      consumeCash: false,
      cashflowType: values.cashflowType,
    };
  }

  if (!values.consumeCash) {
    return {
      price: values.price,
      fee: values.fee,
      consumeCash: false,
    };
  }

  return {
    price: values.price,
    fee: values.fee,
    consumeCash: true,
    cashCurrency: values.cashCurrency,
    fxFee: values.fxFee,
  };
};

export const triggerSnapshotRebuild = (
  scope: "PORTFOLIO" | "ALL",
  portfolioId: string | null
) => {
  // Client kickoff: start a rebuild run immediately after transaction save
  // so portfolio widgets show queued/running state without manual reload.
  void fetch("/api/portfolio-snapshots/rebuild", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      portfolioId,
      maxDaysPerRun: 90,
      timeBudgetMs: 1_000,
    }),
  }).catch(() => undefined);
};
