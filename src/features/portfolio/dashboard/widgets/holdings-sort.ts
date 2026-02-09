import { parseDecimalString } from "@/lib/decimal";

import type { ValuedHolding } from "../../server/valuation";

export const sortHoldingsByValueDesc = (
  holdings: readonly ValuedHolding[]
): ValuedHolding[] =>
  [...holdings].sort((a, b) => {
    if (a.valueBase && b.valueBase) {
      const aValue = parseDecimalString(a.valueBase);
      const bValue = parseDecimalString(b.valueBase);
      if (!aValue || !bValue) return 0;
      return bValue.cmp(aValue);
    }
    if (a.valueBase) return -1;
    if (b.valueBase) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
