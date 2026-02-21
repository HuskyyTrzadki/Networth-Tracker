import type { InstrumentSearchResult } from "../lib/instrument-search";
import { instrumentTypes, type InstrumentType } from "../lib/instrument-search";
import {
  DEFAULT_CUSTOM_ASSET_TYPE,
  isCustomAssetType,
  type CustomAssetType,
} from "../lib/custom-asset-types";
import {
  SUPPORTED_CASH_CURRENCIES,
  buildCashInstrument,
  isSupportedCashCurrency,
} from "../lib/system-currencies";
import type { CashflowTypeUi } from "../lib/cashflow-types";
import type { getTransactionGroupByTransactionId } from "./get-transaction-group";

type TransactionGroup = Awaited<
  ReturnType<typeof getTransactionGroupByTransactionId>
>;

type EditFormValues = Readonly<{
  assetMode: "MARKET" | "CASH" | "CUSTOM";
  type: "BUY" | "SELL";
  portfolioId: string;
  assetId: string;
  currency: string;
  consumeCash: boolean;
  cashCurrency: string;
  fxFee: string;
  cashflowType?: CashflowTypeUi;
  date: string;
  quantity: string;
  price: string;
  fee: string;
  notes: string;
  customAssetType?: CustomAssetType;
  customName?: string;
  customCurrency?: string;
  customAnnualRatePct?: string;
}>;

export type TransactionEditPreset = Readonly<{
  initialValues: Partial<EditFormValues>;
  initialInstrument?: InstrumentSearchResult;
}>;

const toInstrumentResult = (
  group: TransactionGroup
): InstrumentSearchResult | undefined => {
  const assetLeg = group.assetLeg;
  const instrument = assetLeg.instrument;
  if (!instrument) return undefined;

  const provider = instrument.provider === "system" ? "system" : "yahoo";
  const providerKey = instrument.provider_key;
  const cashCurrency = instrument.currency.toUpperCase();

  if (
    (instrument.instrument_type === "CURRENCY" || provider === "system") &&
    isSupportedCashCurrency(cashCurrency)
  ) {
    return buildCashInstrument(cashCurrency);
  }

  const instrumentType = instrument.instrument_type;
  const normalizedInstrumentType =
    instrumentType &&
    instrumentTypes.includes(instrumentType as InstrumentType)
      ? (instrumentType as InstrumentType)
      : undefined;

  return {
    id: `${provider}:${providerKey}`,
    provider,
    providerKey,
    symbol: instrument.symbol,
    ticker: instrument.symbol,
    name: instrument.name,
    currency: instrument.currency,
    instrumentType: normalizedInstrumentType,
    exchange: instrument.exchange ?? undefined,
    region: instrument.region ?? undefined,
    logoUrl: instrument.logo_url,
  };
};

const resolveCashCurrency = (group: TransactionGroup, fallbackCurrency: string) => {
  const settlementCurrency = group.legs.find(
    (leg) => leg.legKey === "CASH_SETTLEMENT" && leg.instrument?.currency
  )?.instrument?.currency;

  if (settlementCurrency && isSupportedCashCurrency(settlementCurrency)) {
    return settlementCurrency;
  }

  if (isSupportedCashCurrency(fallbackCurrency)) {
    return fallbackCurrency;
  }

  return SUPPORTED_CASH_CURRENCIES[0];
};

const resolveCashflowType = (value: string | null): CashflowTypeUi | undefined => {
  if (value === "DEPOSIT" || value === "WITHDRAWAL") {
    return value;
  }
  return undefined;
};

export function buildTransactionEditPreset(
  group: TransactionGroup
): TransactionEditPreset {
  const assetLeg = group.assetLeg;
  const customInstrument = assetLeg.customInstrument;
  const instrument = assetLeg.instrument;
  const isCustom = Boolean(customInstrument);
  const isCash =
    !isCustom &&
    (instrument?.instrument_type === "CURRENCY" || instrument?.provider === "system");

  const initialInstrument = toInstrumentResult(group);
  const fallbackCurrency = (instrument?.currency ?? customInstrument?.currency ?? "USD").toUpperCase();
  const cashCurrency = resolveCashCurrency(group, fallbackCurrency);
  const cashFeeLeg = group.legs.find((leg) => leg.legKey === "CASH_FX_FEE");
  const hasSettlementLeg = group.legs.some((leg) => leg.legKey === "CASH_SETTLEMENT");
  const customAssetType =
    customInstrument && isCustomAssetType(customInstrument.kind)
      ? customInstrument.kind
      : DEFAULT_CUSTOM_ASSET_TYPE;

  return {
    initialInstrument,
    initialValues: {
      assetMode: isCustom ? "CUSTOM" : isCash ? "CASH" : "MARKET",
      type: assetLeg.side,
      portfolioId: assetLeg.portfolioId,
      assetId: isCustom
        ? `custom:${customAssetType}`
        : (initialInstrument?.id ?? assetLeg.instrumentId ?? ""),
      currency: (instrument?.currency ?? customInstrument?.currency ?? "").toUpperCase(),
      consumeCash: !isCash && hasSettlementLeg,
      cashCurrency,
      fxFee: cashFeeLeg?.quantity ?? "",
      cashflowType: isCash ? resolveCashflowType(assetLeg.cashflowType) : undefined,
      date: assetLeg.tradeDate,
      quantity: assetLeg.quantity,
      price: assetLeg.price,
      fee: assetLeg.fee,
      notes: assetLeg.notes ?? "",
      customAssetType: isCustom ? customAssetType : undefined,
      customName: customInstrument?.name ?? "",
      customCurrency: customInstrument?.currency ?? "",
      customAnnualRatePct: customInstrument
        ? String(customInstrument.annual_rate_pct)
        : "",
    },
  };
}
