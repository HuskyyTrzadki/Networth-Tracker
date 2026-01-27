import { isAfter, parseISO } from "date-fns";
import { z } from "zod";

import { transactionTypes } from "../lib/add-transaction-form-schema";
import { parseDecimalInput } from "../lib/parse-decimal";

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

const instrumentSchema = z.object({
  provider: z.string().trim().min(1).optional().default("yahoo"),
  providerKey: z.string().trim().min(1).optional(),
  symbol: z.string().trim().min(1),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3),
  exchange: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  logoUrl: z.string().trim().url().optional(),
});

// Server-side request schema for creating a transaction.
export const createTransactionRequestSchema = z.object({
  type: z.enum(transactionTypes),
  date: z.string().refine(
    (value) => {
      const parsed = parseISO(value);
      return !Number.isNaN(parsed.getTime()) && !isAfter(parsed, new Date());
    },
    { message: "Nieprawidłowa data." }
  ),
  quantity: positiveDecimalString,
  price: nonNegativeDecimalString,
  fee: optionalNonNegativeDecimalString,
  notes: z.string().trim().max(500).optional(),
  // Required: every transaction must belong to a portfolio.
  portfolioId: z.string().uuid(),
  clientRequestId: z.string().uuid(),
  instrument: instrumentSchema,
});

export type CreateTransactionRequest = z.infer<
  typeof createTransactionRequestSchema
>;
