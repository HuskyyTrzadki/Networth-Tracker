import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  negateDecimal,
  parseDecimalString,
} from "@/lib/decimal";

type Params = Readonly<{
  type: "BUY" | "SELL";
  quantity: string;
  price: string;
  fee: string;
  fxFee: string;
  assetCurrency: string;
  cashCurrency: string;
  fxRate?: string | null;
}>;

const resolveTradeDeltaInAssetCurrency = (input: Params) => {
  const quantity = parseDecimalString(input.quantity);
  const price = parseDecimalString(input.price);
  const fee = parseDecimalString(input.fee) ?? decimalZero();

  if (!quantity || !price) {
    return null;
  }

  const gross = multiplyDecimals(quantity, price);
  if (input.type === "BUY") {
    return negateDecimal(addDecimals(gross, fee));
  }

  return addDecimals(gross, negateDecimal(fee));
};

export const buildCashImpact = (input: Params) => {
  const deltaAssetCurrency = resolveTradeDeltaInAssetCurrency(input);
  if (!deltaAssetCurrency) {
    return null;
  }

  let deltaCashCurrency = deltaAssetCurrency;

  if (input.assetCurrency !== input.cashCurrency) {
    const fxRate = parseDecimalString(input.fxRate ?? null);
    if (!fxRate) {
      return null;
    }
    deltaCashCurrency = multiplyDecimals(deltaAssetCurrency, fxRate);
  }

  const fxFee = parseDecimalString(input.fxFee) ?? decimalZero();
  const deltaAfterFxFee = addDecimals(deltaCashCurrency, negateDecimal(fxFee));

  return {
    delta: deltaAfterFxFee.toString(),
  };
};
