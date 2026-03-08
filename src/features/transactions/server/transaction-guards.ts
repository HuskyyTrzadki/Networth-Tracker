import type { SupabaseClient } from "@supabase/supabase-js";

import { addDecimals, decimalZero, negateDecimal, parseDecimalString } from "@/lib/decimal";
import {
  internalServerError,
  unprocessableEntityError,
} from "@/lib/http/app-error";

import type { SettlementLegPlan } from "./settlement";
import type { TransactionIntent } from "./transaction-intent";

const CASH_GUARD_TOLERANCE = parseDecimalString("0.05") ?? decimalZero();

type SupabaseServerClient = Pick<SupabaseClient, "rpc">;

type HoldingsAsOfRow = Readonly<{
  instrument_id: string;
  currency: string;
  provider: string;
  provider_key: string;
  instrument_type: string | null;
  quantity: string | number;
}>;

type HoldingsSnapshot = Readonly<{
  quantityByInstrumentId: ReadonlyMap<string, string>;
  cashByCurrency: ReadonlyMap<string, string>;
}>;

type ValidateTransactionGuardsInput = Readonly<{
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  portfolioId: string;
  tradeDate: string;
  intent: TransactionIntent;
  isCashInstrument: boolean;
  assetInstrumentId: string;
  requestedAssetQuantity: string;
  consumeCash: boolean;
  cashCurrency?: string;
  settlementLegs: readonly SettlementLegPlan[];
  guardMode?: "STRICT" | "IMPORT";
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const buildHoldingsSnapshot = (rows: readonly HoldingsAsOfRow[]): HoldingsSnapshot => {
  const quantityByInstrumentId = new Map<string, string>();
  const cashByCurrency = new Map<string, string>();

  rows.forEach((row) => {
    const quantity = normalizeNumeric(row.quantity);
    quantityByInstrumentId.set(row.instrument_id, quantity);

    if (row.instrument_type === "CURRENCY") {
      const currency = row.currency.toUpperCase();
      cashByCurrency.set(currency, quantity);
    }
  });

  return {
    quantityByInstrumentId,
    cashByCurrency,
  };
};

const toSearchInstrumentId = (row: HoldingsAsOfRow) =>
  `${row.provider}:${row.provider_key}`;

const getAvailableQuantity = (
  snapshot: HoldingsSnapshot,
  instrumentId: string
) => snapshot.quantityByInstrumentId.get(instrumentId) ?? "0";

const getCashAvailable = (
  snapshot: HoldingsSnapshot,
  currency: string
) => snapshot.cashByCurrency.get(currency.toUpperCase()) ?? "0";

const computeCashDelta = (legs: readonly SettlementLegPlan[]) =>
  legs.reduce((sum, leg) => {
    const quantity = parseDecimalString(leg.quantity);
    if (!quantity) {
      return sum;
    }

    const signed = leg.side === "BUY" ? quantity : negateDecimal(quantity);
    return addDecimals(sum, signed);
  }, decimalZero());

const assertInstrumentQuantityParsable = (quantity: string, label: string) => {
  const parsed = parseDecimalString(quantity);
  if (!parsed) {
    throw unprocessableEntityError(`Nieprawidłowa ilość dla pola: ${label}.`, {
      code: "TRANSACTION_INVALID_QUANTITY",
    });
  }
  return parsed;
};

const formatDecimal = (value: string) => {
  const parsed = parseDecimalString(value);
  return parsed ? parsed.toString() : value;
};

const buildOversellError = (input: Readonly<{
  requested: string;
  available: string;
  tradeDate: string;
}>) =>
  `Ilość sprzedaży przekracza pozycję na dzień ${input.tradeDate}. ` +
  `Dostępne: ${formatDecimal(input.available)}, próbujesz sprzedać: ${formatDecimal(input.requested)}.`;

const buildInsufficientCashError = (input: Readonly<{
  currency: string;
  available: string;
  required: string;
  remaining: string;
  tradeDate: string;
}>) =>
  `Brak gotówki (${input.currency}) na dzień ${input.tradeDate}. ` +
  `Dostępne: ${formatDecimal(input.available)}, potrzebne: ${formatDecimal(input.required)}, ` +
  `po transakcji byłoby: ${formatDecimal(input.remaining)}. ` +
  "Dodaj depozyt gotówki z datą <= tej transakcji albo wyłącz „Potrąć z gotówki”.";

const buildDepositWithdrawalError = (input: Readonly<{
  currency: string;
  available: string;
  requested: string;
  tradeDate: string;
}>) =>
  `Nie możesz wypłacić ${formatDecimal(input.requested)} ${input.currency} ` +
  `na dzień ${input.tradeDate}. Dostępne: ${formatDecimal(input.available)}. ` +
  "Dodaj wcześniejszy depozyt gotówki albo popraw datę/ilość.";

const exceedsCashTolerance = (shortfall: ReturnType<typeof decimalZero>) =>
  shortfall.gt(CASH_GUARD_TOLERANCE);

const needsHoldingsSnapshot = (input: Readonly<{
  intent: TransactionIntent;
  consumeCash: boolean;
  guardMode?: "STRICT" | "IMPORT";
}>) =>
  input.intent === "ASSET_SELL" ||
  (input.intent === "CASH_WITHDRAWAL" && input.guardMode !== "IMPORT") ||
  input.consumeCash;

const fetchHoldingsSnapshot = async (input: Readonly<{
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  portfolioId: string;
  tradeDate: string;
}>) => {
  // Guard checks use holdings as-of trade date to keep backdated writes coherent.
  const { data, error } = await input.supabaseAdmin.rpc(
    "get_portfolio_holdings_admin_as_of",
    {
      p_user_id: input.userId,
      p_bucket_date: input.tradeDate,
      p_portfolio_id: input.portfolioId,
    }
  );

  if (error) {
    throw internalServerError("Failed to load holdings snapshot.", {
      code: "TRANSACTION_HOLDINGS_FETCH_FAILED",
      cause: error,
    });
  }

  const rows = (data ?? []) as HoldingsAsOfRow[];
  return buildHoldingsSnapshot(rows);
};

export async function validateTransactionGuards(
  input: ValidateTransactionGuardsInput
) {
  if (!needsHoldingsSnapshot(input)) {
    return;
  }

  const holdingsSnapshot = await fetchHoldingsSnapshot(input);
  const requestedAssetQuantity = assertInstrumentQuantityParsable(
    input.requestedAssetQuantity,
    "quantity"
  );

  if (input.intent === "ASSET_SELL") {
    if (input.guardMode === "IMPORT") {
      return;
    }

    const available = assertInstrumentQuantityParsable(
      getAvailableQuantity(holdingsSnapshot, input.assetInstrumentId),
      "available_asset"
    );
    if (available.lt(requestedAssetQuantity)) {
      throw unprocessableEntityError(
        buildOversellError({
          requested: requestedAssetQuantity.toString(),
          available: available.toString(),
          tradeDate: input.tradeDate,
        }),
        { code: "TRANSACTION_OVERSELL" }
      );
    }
  }

  if (input.intent === "CASH_WITHDRAWAL") {
    const availableCash = assertInstrumentQuantityParsable(
      getCashAvailable(holdingsSnapshot, input.cashCurrency ?? ""),
      "available_cash"
    );
    const shortfall = addDecimals(requestedAssetQuantity, negateDecimal(availableCash));
    if (shortfall.gt(0) && exceedsCashTolerance(shortfall)) {
      throw unprocessableEntityError(
        buildDepositWithdrawalError({
          currency: input.cashCurrency ?? "",
          available: availableCash.toString(),
          requested: requestedAssetQuantity.toString(),
          tradeDate: input.tradeDate,
        }),
        { code: "TRANSACTION_INSUFFICIENT_CASH" }
      );
    }
  }

  if (input.consumeCash) {
    if (input.guardMode === "IMPORT") {
      return;
    }

    const cashCurrency = input.cashCurrency?.toUpperCase();
    if (!cashCurrency) {
      throw unprocessableEntityError("Wybierz walutę gotówki.", {
        code: "TRANSACTION_MISSING_CASH_CURRENCY",
      });
    }

    const availableCash = assertInstrumentQuantityParsable(
      getCashAvailable(holdingsSnapshot, cashCurrency),
      "available_cash"
    );
    const netCashDelta = computeCashDelta(input.settlementLegs);
    const remainingCash = addDecimals(availableCash, netCashDelta);
    const shortfall = negateDecimal(remainingCash);

    if (remainingCash.lt(0) && exceedsCashTolerance(shortfall)) {
      throw unprocessableEntityError(
        buildInsufficientCashError({
          currency: cashCurrency,
          available: availableCash.toString(),
          required: negateDecimal(netCashDelta).toString(),
          remaining: remainingCash.toString(),
          tradeDate: input.tradeDate,
        }),
        { code: "TRANSACTION_INSUFFICIENT_CASH" }
      );
    }
  }
}

export const __test__ = {
  buildHoldingsSnapshot,
  toSearchInstrumentId,
  computeCashDelta,
  needsHoldingsSnapshot,
  exceedsCashTolerance,
};
