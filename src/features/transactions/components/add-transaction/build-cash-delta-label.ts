import { addDecimals, multiplyDecimals, negateDecimal, parseDecimalString } from "@/lib/decimal";

import { formatMoney } from "./constants";

type Params = Readonly<{
  consumeCash: boolean;
  hasInstrument: boolean;
  quantity: string;
  price: string;
  fee: string;
  type: "BUY" | "SELL";
  displayCurrency: string;
}>;

export const buildCashDeltaLabel = ({
  consumeCash,
  hasInstrument,
  quantity,
  price,
  fee,
  type,
  displayCurrency,
}: Params) => {
  if (!consumeCash || !hasInstrument || !quantity || !price) return null;

  const quantityDecimal = parseDecimalString(quantity);
  const priceDecimal = parseDecimalString(price);
  const feeDecimal = parseDecimalString(fee) ?? null;
  if (!quantityDecimal || !priceDecimal || !feeDecimal) return null;

  const gross = multiplyDecimals(quantityDecimal, priceDecimal);
  const delta =
    type === "BUY"
      ? negateDecimal(addDecimals(gross, feeDecimal))
      : addDecimals(gross, negateDecimal(feeDecimal));

  if (delta.eq(0)) return null;

  const sign = delta.gt(0) ? "+" : "-";
  return `${sign}${formatMoney(delta.abs().toString(), displayCurrency)}`;
};
