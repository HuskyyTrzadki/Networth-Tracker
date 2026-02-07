import { z } from "zod";

import { parseDecimalInput } from "./parse-decimal";
import { cashflowTypeUiOptions } from "./cashflow-types";
import {
  isValidTradeDate,
  tradeDateValidationMessage,
} from "./trade-date";

export type TransactionType = "BUY" | "SELL";

export const transactionTypes = ["BUY", "SELL"] as const satisfies readonly TransactionType[];

export function createAddTransactionFormSchema() {
  return z.object({
    type: z.enum(transactionTypes),
    portfolioId: z.string().trim().min(1, { message: "Wybierz portfel." }),
    assetId: z.string().trim().min(1, { message: "Wybierz instrument." }),
    currency: z.string().length(3, { message: "Brak waluty dla instrumentu." }),
    consumeCash: z.boolean(),
    cashCurrency: z.string().length(3, { message: "Brak waluty gotówki." }),
    fxFee: z
      .string()
      .transform((value) => value?.trim() ?? "")
      .refine((value) => {
        if (!value) return true;
        const parsed = parseDecimalInput(value);
        return parsed !== null && parsed >= 0;
      }, { message: "Wpisz wartość większą lub równą 0." }),
    cashflowType: z.enum(cashflowTypeUiOptions).optional(),
    date: z.string().refine((value) => isValidTradeDate(value), {
      message: tradeDateValidationMessage,
    }),
    quantity: z.string().refine(
      (value) => {
        const parsed = parseDecimalInput(value);
        return parsed !== null && parsed > 0;
      },
      { message: "Wpisz wartość większą od 0." }
    ),
    price: z.string().refine(
      (value) => {
        const parsed = parseDecimalInput(value);
        return parsed !== null && parsed >= 0;
      },
      { message: "Wpisz wartość większą lub równą 0." }
    ),
    fee: z.string().refine(
      (value) => {
        if (!value) return true;
        const parsed = parseDecimalInput(value);
        return parsed !== null && parsed >= 0;
      },
      { message: "Wpisz wartość większą lub równą 0." }
    ),
    notes: z.string().max(500, { message: "Maks. 500 znaków." }),
  });
}
