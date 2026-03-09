import { z } from "zod";

import { brokerImportProviderIds } from "../../lib/broker-import-providers";
import { instrumentTypes } from "../../lib/instrument-search";

export const brokerImportInstrumentSchema = z.object({
  id: z.string().trim().min(1),
  provider: z.enum(["yahoo", "system"]),
  providerKey: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  ticker: z.string().trim().min(1),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3),
  instrumentType: z.enum(instrumentTypes).optional(),
  exchange: z.string().trim().optional(),
  region: z.string().trim().optional(),
  logoUrl: z.string().nullable().optional(),
});

export const brokerImportReadyRowSchema = z.object({
  provider: z.enum(brokerImportProviderIds),
  previewId: z.string().min(1),
  xtbRowId: z.string().min(1),
  sourceFileName: z.string().min(1),
  sourceType: z.string().min(1),
  executedAtUtc: z.string().nullable(),
  sourceOrder: z.number().int().nonnegative(),
  kind: z.enum([
    "TRADE_BUY",
    "TRADE_SELL",
    "CASH_DEPOSIT",
    "CASH_WITHDRAWAL",
    "DIVIDEND",
    "INTEREST",
    "TAX",
  ]),
  status: z.literal("READY"),
  tradeDate: z.string().min(1),
  accountCurrency: z.enum(["USD", "EUR", "PLN", "GBP", "CHF"]),
  accountNumber: z.string().trim().min(1),
  amount: z.string().trim().min(1),
  instrumentLabel: z.string().nullable(),
  comment: z.string().nullable(),
  quantity: z.string().trim().min(1),
  price: z.string().trim().min(1),
  fee: z.string().trim().min(1),
  cashflowType: z
    .enum(["DEPOSIT", "WITHDRAWAL", "DIVIDEND", "INTEREST", "FEE", "TAX", "TRADE_SETTLEMENT"])
    .nullable(),
  side: z.enum(["BUY", "SELL"]),
  requiresInstrument: z.boolean(),
  commentTicker: z.string().nullable(),
  instrument: brokerImportInstrumentSchema.nullable(),
});

export const brokerImportPreviewRowSchema = brokerImportReadyRowSchema.extend({
  status: z.enum(["READY", "NEEDS_INSTRUMENT", "SKIPPED"]),
  skipReason: z.string().nullable(),
});

export type BrokerImportReadyRow = z.infer<typeof brokerImportReadyRowSchema>;
export type BrokerImportPreviewRowInput = z.infer<typeof brokerImportPreviewRowSchema>;
