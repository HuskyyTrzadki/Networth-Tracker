import { z } from "zod";

import {
  instrumentTypes,
} from "@/features/transactions/lib/instrument-search";

export const stockWatchlistUpsertSchema = z.object({
  providerKey: z.string().trim().min(1).max(120),
  symbol: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(200),
  currency: z.string().trim().length(3),
  logoUrl: z.string().trim().url().nullable().optional(),
  instrumentType: z.enum(instrumentTypes).optional(),
});

export type StockWatchlistUpsertInput = z.infer<typeof stockWatchlistUpsertSchema>;
