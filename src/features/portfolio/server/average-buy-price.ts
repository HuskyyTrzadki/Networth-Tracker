import {
  addDecimals,
  decimalZero,
  divideDecimals,
  multiplyDecimals,
  parseDecimalString,
} from "@/lib/decimal";

export type AveragePriceTransaction = Readonly<{
  instrumentId: string;
  side: "BUY" | "SELL";
  quantity: string;
  price: string;
}>;

type PositionState = Readonly<{
  quantity: string;
  averageCost: string | null;
}>;

export function computeAverageBuyPriceByInstrument(
  transactions: readonly AveragePriceTransaction[]
): ReadonlyMap<string, string> {
  const stateByInstrument = new Map<string, PositionState>();

  for (const transaction of transactions) {
    const quantity = parseDecimalString(transaction.quantity);
    const price = parseDecimalString(transaction.price);
    if (!quantity || !price) continue;

    const current = stateByInstrument.get(transaction.instrumentId) ?? {
      quantity: "0",
      averageCost: null,
    };

    const currentQuantity = parseDecimalString(current.quantity) ?? decimalZero();
    const currentAverageCost = current.averageCost
      ? parseDecimalString(current.averageCost)
      : null;

    if (transaction.side === "BUY") {
      const nextQuantity = addDecimals(currentQuantity, quantity);
      const currentCost = currentAverageCost
        ? multiplyDecimals(currentAverageCost, currentQuantity)
        : decimalZero();
      const buyCost = multiplyDecimals(price, quantity);
      const nextAverageCost = divideDecimals(
        addDecimals(currentCost, buyCost),
        nextQuantity
      );

      stateByInstrument.set(transaction.instrumentId, {
        quantity: nextQuantity.toString(),
        averageCost: nextAverageCost.toString(),
      });
      continue;
    }

    const nextQuantity = currentQuantity.minus(quantity);
    if (nextQuantity.lte(0)) {
      stateByInstrument.set(transaction.instrumentId, {
        quantity: "0",
        averageCost: null,
      });
      continue;
    }

    stateByInstrument.set(transaction.instrumentId, {
      quantity: nextQuantity.toString(),
      averageCost: currentAverageCost?.toString() ?? null,
    });
  }

  const averageByInstrument = new Map<string, string>();
  stateByInstrument.forEach((state, instrumentId) => {
    if (!state.averageCost) return;
    averageByInstrument.set(instrumentId, state.averageCost);
  });

  return averageByInstrument;
}
