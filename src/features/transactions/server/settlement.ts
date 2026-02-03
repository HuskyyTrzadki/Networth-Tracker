import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  negateDecimal,
  parseDecimalString,
} from "@/lib/decimal";

import type { CashflowType } from "../lib/cashflow-types";
import type { TransactionType } from "../lib/add-transaction-form-schema";

export type SettlementFx = Readonly<{
  rate: string;
  asOf: string;
  provider: string;
}>;

export type SettlementLegPlan = Readonly<{
  side: TransactionType;
  quantity: string;
  price: "1";
  cashflowType: CashflowType;
  legKey: "CASH_SETTLEMENT" | "CASH_FX_FEE";
  settlementFx?: SettlementFx;
}>;

type SettlementInput = Readonly<{
  type: TransactionType;
  quantity: string;
  price: string;
  fee: string;
  assetCurrency: string;
  cashCurrency: string;
  fx?: SettlementFx;
  fxFee?: string;
}>;

const buildSignedDelta = (input: SettlementInput) => {
  const quantity = parseDecimalString(input.quantity);
  const price = parseDecimalString(input.price);
  const fee = parseDecimalString(input.fee) ?? decimalZero();

  if (!quantity || !price) {
    throw new Error("Nieprawidłowe wartości ilości lub ceny.");
  }

  const gross = multiplyDecimals(quantity, price);

  if (input.type === "BUY") {
    return negateDecimal(addDecimals(gross, fee));
  }

  return addDecimals(gross, negateDecimal(fee));
};

const toSettlementLeg = (
  delta: ReturnType<typeof buildSignedDelta>,
  cashflowType: CashflowType,
  legKey: SettlementLegPlan["legKey"],
  fx?: SettlementFx
): SettlementLegPlan | null => {
  if (delta.eq(0)) {
    return null;
  }

  const side: TransactionType = delta.gt(0) ? "BUY" : "SELL";
  return {
    side,
    quantity: delta.abs().toString(),
    price: "1",
    cashflowType,
    legKey,
    settlementFx: fx,
  };
};

export const buildSettlementLegs = (input: SettlementInput): SettlementLegPlan[] => {
  const deltaAssetCurrency = buildSignedDelta(input);
  const legs: SettlementLegPlan[] = [];

  if (input.assetCurrency === input.cashCurrency) {
    const settlementLeg = toSettlementLeg(
      deltaAssetCurrency,
      "TRADE_SETTLEMENT",
      "CASH_SETTLEMENT"
    );

    if (settlementLeg) {
      legs.push(settlementLeg);
    }
  } else {
    if (!input.fx) {
      throw new Error("Brak kursu FX do rozliczenia gotówki.");
    }

    const fxRate = parseDecimalString(input.fx.rate);
    if (!fxRate) {
      throw new Error("Nieprawidłowy kurs FX do rozliczenia gotówki.");
    }

    const deltaCashCurrency = multiplyDecimals(deltaAssetCurrency, fxRate);
    const settlementLeg = toSettlementLeg(
      deltaCashCurrency,
      "TRADE_SETTLEMENT",
      "CASH_SETTLEMENT",
      input.fx
    );

    if (settlementLeg) {
      legs.push(settlementLeg);
    }
  }

  const fxFeeValue = input.fxFee?.trim() ? parseDecimalString(input.fxFee) : null;
  if (fxFeeValue && fxFeeValue.gt(0)) {
    legs.push({
      side: "SELL",
      quantity: fxFeeValue.toString(),
      price: "1",
      cashflowType: "FEE",
      legKey: "CASH_FX_FEE",
    });
  }

  return legs;
};

export const __test__ = {
  buildSignedDelta,
  toSettlementLeg,
};
