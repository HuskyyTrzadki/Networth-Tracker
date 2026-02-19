import type { UseFormReturn } from "react-hook-form";

import {
  buildCashInstrument,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../../lib/system-currencies";
import { DEFAULT_CUSTOM_ASSET_TYPE } from "../../lib/custom-asset-types";
import type { FormValues } from "../AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../../lib/instrument-search";

type SetInstrument = (next: InstrumentSearchResult | null) => void;

const setAssetMode = (
  form: UseFormReturn<FormValues>,
  next: FormValues["assetMode"]
) => {
  form.setValue("assetMode", next, { shouldValidate: true });
};

export const applyCashTabState = (
  form: UseFormReturn<FormValues>,
  setSelectedInstrument: SetInstrument,
  cashCurrency: CashCurrency
) => {
  setAssetMode(form, "CASH");
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

export const applyMarketTabState = (
  form: UseFormReturn<FormValues>,
  setSelectedInstrument: SetInstrument
) => {
  setAssetMode(form, "MARKET");
  setSelectedInstrument(null);
  form.setValue("assetId", "", { shouldValidate: true });
  form.setValue("currency", "", { shouldValidate: true });
  form.setValue("price", "", { shouldValidate: true });
  form.setValue("fee", "", { shouldValidate: true });
  form.setValue("cashflowType", undefined, { shouldValidate: true });
};

export const applyCustomTabState = (
  form: UseFormReturn<FormValues>,
  setSelectedInstrument: SetInstrument,
  fallbackCurrency: CashCurrency
) => {
  setAssetMode(form, "CUSTOM");
  setSelectedInstrument(null);
  form.setValue("type", "BUY", { shouldValidate: true });
  form.setValue("consumeCash", false, { shouldValidate: true });
  form.setValue("cashflowType", undefined, { shouldValidate: true });
  form.setValue("quantity", "1", { shouldValidate: true });
  form.setValue("fee", "0", { shouldValidate: true });
  form.setValue("price", "", { shouldValidate: true });

  const currentCurrency = form.getValues("customCurrency")?.trim();
  const resolvedCurrency =
    currentCurrency && isSupportedCashCurrency(currentCurrency)
      ? currentCurrency
      : fallbackCurrency;
  form.setValue("customCurrency", resolvedCurrency, { shouldValidate: true });
  form.setValue("customAssetType", DEFAULT_CUSTOM_ASSET_TYPE, { shouldValidate: true });
  form.setValue("assetId", `custom:${DEFAULT_CUSTOM_ASSET_TYPE}`, {
    shouldValidate: true,
  });
  form.setValue("currency", resolvedCurrency, { shouldValidate: true });
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
