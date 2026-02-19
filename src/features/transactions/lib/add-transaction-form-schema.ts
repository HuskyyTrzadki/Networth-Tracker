import { z } from "zod";

import { parseDecimalInput } from "./parse-decimal";
import { cashflowTypeUiOptions } from "./cashflow-types";
import { customAssetTypes } from "./custom-asset-types";
import {
  isValidTradeDate,
  tradeDateValidationMessage,
} from "./trade-date";

export type TransactionType = "BUY" | "SELL";
export type AssetMode = "MARKET" | "CASH" | "CUSTOM";

export const transactionTypes = ["BUY", "SELL"] as const satisfies readonly TransactionType[];
export const assetModes = ["MARKET", "CASH", "CUSTOM"] as const satisfies readonly AssetMode[];

export function createAddTransactionFormSchema() {
  return z
    .object({
      assetMode: z.enum(assetModes),
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
      customAssetType: z.enum(customAssetTypes).optional(),
      customName: z.string().optional(),
      customCurrency: z.string().optional(),
      customAnnualRatePct: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.assetMode !== "CUSTOM") {
        return;
      }

      if (value.type !== "BUY") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pozycje nierynkowe obsługują tylko dodanie.",
          path: ["type"],
        });
      }

      if (!value.customAssetType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wybierz typ pozycji.",
          path: ["customAssetType"],
        });
      }

      if (!value.customName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wpisz nazwę pozycji.",
          path: ["customName"],
        });
      }

      if (!value.customCurrency?.trim() || value.customCurrency.trim().length !== 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wybierz walutę.",
          path: ["customCurrency"],
        });
      }

      const rate = parseDecimalInput(value.customAnnualRatePct ?? "");
      if (rate === null || rate <= -100 || rate >= 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wpisz roczny wzrost/spadek w zakresie (-100, 1000).",
          path: ["customAnnualRatePct"],
        });
      }

      const price = parseDecimalInput(value.price);
      if (price === null || price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wpisz wartość większą od 0.",
          path: ["price"],
        });
      }
    });
}
