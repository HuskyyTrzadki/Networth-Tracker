import type { UseFormReturn } from "react-hook-form";

import {
  buildCashInstrument,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../../lib/system-currencies";
import type { FormValues } from "../AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../../lib/instrument-search";

type SetInstrument = (next: InstrumentSearchResult | null) => void;

export const applyCashTabState = (
  form: UseFormReturn<FormValues>,
  setSelectedInstrument: SetInstrument,
  cashCurrency: CashCurrency
) => {
  const cashInstrument = buildCashInstrument(cashCurrency);
  setSelectedInstrument(cashInstrument);
  form.setValue("assetId", cashInstrument.id, { shouldValidate: true });
  form.setValue("currency", cashInstrument.currency, { shouldValidate: true });
  form.setValue("price", "1", { shouldValidate: true });
  form.setValue("fee", "0", { shouldValidate: true });
  form.setValue("consumeCash", false, { shouldValidate: true });
  form.setValue("type", "BUY", { shouldValidate: true });
  form.setValue("cashflowType", "DEPOSIT", { shouldValidate: true });
};

export const applyNonCashTabState = (
  form: UseFormReturn<FormValues>,
  setSelectedInstrument: SetInstrument
) => {
  setSelectedInstrument(null);
  form.setValue("assetId", "", { shouldValidate: true });
  form.setValue("currency", "", { shouldValidate: true });
  form.setValue("price", "", { shouldValidate: true });
  form.setValue("fee", "", { shouldValidate: true });
  form.setValue("cashflowType", undefined, { shouldValidate: true });
};

export const applyCashCurrencyChange = (
  form: UseFormReturn<FormValues>,
  setSelectedInstrument: SetInstrument,
  nextCurrency: string,
  isCashTab: boolean
) => {
  form.setValue("cashCurrency", nextCurrency, { shouldValidate: true });

  if (!isCashTab || !isSupportedCashCurrency(nextCurrency)) {
    return;
  }

  const cashCurrency = nextCurrency as CashCurrency;
  const cashInstrument = buildCashInstrument(cashCurrency);
  setSelectedInstrument(cashInstrument);
  form.setValue("assetId", cashInstrument.id, { shouldValidate: true });
  form.setValue("currency", cashInstrument.currency, { shouldValidate: true });
};
