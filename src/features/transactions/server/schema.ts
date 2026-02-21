import { z } from "zod";

import { transactionTypes } from "../lib/add-transaction-form-schema";
import { cashflowTypes } from "../lib/cashflow-types";
import { customAssetTypes } from "../lib/custom-asset-types";
import { instrumentTypes } from "../lib/instrument-search";
import { parseDecimalInput } from "../lib/parse-decimal";
import {
  isValidTradeDate,
  tradeDateValidationMessage,
} from "../lib/trade-date";

const normalizeDecimalInput = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(",", ".");

const positiveDecimalString = z
  .string()
  .refine((value) => {
    const parsed = parseDecimalInput(value);
    return parsed !== null && parsed > 0;
  }, { message: "Wpisz wartość większą od 0." })
  .transform(normalizeDecimalInput);

const nonNegativeDecimalString = z
  .string()
  .refine((value) => {
    const parsed = parseDecimalInput(value);
    return parsed !== null && parsed >= 0;
  }, { message: "Wpisz wartość większą lub równą 0." })
  .transform(normalizeDecimalInput);

const optionalNonNegativeDecimalString = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "")
  .refine((value) => {
    if (!value) return true;
    const parsed = parseDecimalInput(value);
    return parsed !== null && parsed >= 0;
  }, { message: "Wpisz wartość większą lub równą 0." })
  .transform((value) => (value ? normalizeDecimalInput(value) : "0"));

const optionalAnnualRatePctString = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const normalized = typeof value === "number" ? value.toString() : value.trim();
    if (!normalized) return undefined;
    return normalizeDecimalInput(normalized);
  })
  .refine((value) => {
    if (value === undefined) return true;
    const parsed = parseDecimalInput(value);
    return parsed !== null && parsed > -100 && parsed < 1000;
  }, {
    message: "Roczny wzrost/spadek musi być w zakresie (-100, 1000).",
  });

const instrumentSchema = z
  .object({
    provider: z.string().trim().min(1).optional().default("yahoo"),
    providerKey: z.string().trim().min(1),
    symbol: z.string().trim().min(1),
    name: z.string().trim().min(1),
    currency: z.string().trim().length(3),
    instrumentType: z.enum(instrumentTypes).optional(),
    exchange: z.string().trim().min(1).optional(),
    region: z.string().trim().min(1).optional(),
    logoUrl: z.string().trim().url().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.providerKey?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wybierz instrument z listy wyszukiwania.",
        path: ["providerKey"],
      });
    }
  });

const customInstrumentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  currency: z.string().trim().length(3),
  notes: z.string().trim().max(500).optional(),
  kind: z.enum(customAssetTypes),
  valuationKind: z.literal("COMPOUND_ANNUAL_RATE"),
  // Signed percentage, e.g. 5 = +5%/year, -2.5 = -2.5%/year.
  annualRatePct: z
    .union([z.string(), z.number()])
    .transform((value) => (typeof value === "number" ? value.toString() : value))
    .transform(normalizeDecimalInput)
    .refine((value) => {
      const parsed = parseDecimalInput(value);
      return parsed !== null && parsed > -100 && parsed < 1000;
    }, {
      message: "Roczny wzrost/spadek musi być w zakresie (-100, 1000).",
    }),
});

const transactionWriteFields = {
  type: z.enum(transactionTypes),
  date: z.string().refine((value) => isValidTradeDate(value), {
    message: tradeDateValidationMessage,
  }),
  quantity: positiveDecimalString,
  price: nonNegativeDecimalString,
  fee: optionalNonNegativeDecimalString,
  notes: z.string().trim().max(500).optional(),
  consumeCash: z.boolean().optional().default(false),
  cashCurrency: z.string().trim().length(3).optional(),
  fxFee: optionalNonNegativeDecimalString.optional(),
  cashflowType: z.enum(cashflowTypes).optional(),
  customAnnualRatePct: optionalAnnualRatePctString,
} as const;

// Server-side request schema for creating a transaction.
export const createTransactionRequestSchema = z
  .object({
    ...transactionWriteFields,
    // Required: every transaction must belong to a portfolio.
    portfolioId: z.string().uuid(),
    clientRequestId: z.string().uuid(),
    instrument: instrumentSchema.optional(),
    customInstrument: customInstrumentSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasInstrument = Boolean(value.instrument);
    const hasCustomInstrument = Boolean(value.customInstrument);
    if (hasInstrument === hasCustomInstrument) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wybierz instrument.",
        path: ["instrument"],
      });
    }

    if (value.consumeCash && !value.cashCurrency?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wybierz walutę gotówki.",
        path: ["cashCurrency"],
      });
    }

    if (value.instrument?.instrumentType === "CURRENCY") {
      if (value.consumeCash) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Gotówka nie może być rozliczana przez gotówkę.",
          path: ["consumeCash"],
        });
      }

      if (!value.cashflowType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wybierz typ przepływu gotówki.",
          path: ["cashflowType"],
        });
      }
    } else if (value.cashflowType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Typ przepływu gotówki dotyczy tylko walut.",
        path: ["cashflowType"],
      });
    }

    if (value.customInstrument && value.type !== "BUY") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pozycje nierynkowe obsługują tylko dodanie (BUY).",
        path: ["type"],
      });
    }
  });

export type CreateTransactionRequest = z.infer<
  typeof createTransactionRequestSchema
>;

export const updateTransactionRequestSchema = z
  .object(transactionWriteFields)
  .superRefine((value, ctx) => {
    if (value.consumeCash && !value.cashCurrency?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wybierz walutę gotówki.",
        path: ["cashCurrency"],
      });
    }
  });

export type UpdateTransactionRequest = z.infer<
  typeof updateTransactionRequestSchema
>;
