import { z } from "zod";

import { instrumentTypes } from "@/features/market-data/lib/instrument-types";

export const screenshotPreviewInstrumentSchema = z.object({
  id: z.string().trim().min(1),
  provider: z.enum(["yahoo", "system"]),
  providerKey: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  ticker: z.string().trim().min(1),
  name: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  instrumentType: z.enum(instrumentTypes).optional(),
  exchange: z.string().trim().optional(),
  logoUrl: z.string().trim().nullable().optional(),
});

export const screenshotPreviewHoldingSchema = z.object({
  instrument: screenshotPreviewInstrumentSchema,
  quantity: z.string().trim().min(1),
});

export const screenshotPreviewSchema = z.object({
  holdings: z.array(screenshotPreviewHoldingSchema).min(1),
});

export type ScreenshotPreviewPayload = z.infer<typeof screenshotPreviewSchema>;
