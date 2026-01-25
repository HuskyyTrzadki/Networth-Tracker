import { isAfter, parseISO } from "date-fns";
import { z } from "zod";

import { parseDecimalInput } from "./parse-decimal";

export type TransactionType = "BUY" | "SELL";

export const transactionTypes = ["BUY", "SELL"] as const satisfies readonly TransactionType[];

export function createAddTransactionFormSchema() {
  return z.object({
    type: z.enum(transactionTypes),
    assetId: z.string().uuid({ message: "Wybierz instrument." }),
    currency: z.string().length(3, { message: "Brak waluty dla instrumentu." }),
    date: z.string().refine(
      (value) => {
        const parsed = parseISO(value);
        return !Number.isNaN(parsed.getTime()) && !isAfter(parsed, new Date());
      },
      { message: "Nieprawidłowa data." }
    ),
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
