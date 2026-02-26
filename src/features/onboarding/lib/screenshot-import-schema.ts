import { z } from "zod";

import { portfolioBaseCurrencies } from "@/features/portfolio/lib/base-currency";

export const screenshotHoldingSchema = z.object({
  ticker: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
});

export const screenshotImportCommitSchema = z.object({
  portfolio: z.object({
    name: z.string().trim().min(1, "Podaj nazwę portfela."),
    baseCurrency: z.enum(portfolioBaseCurrencies, {
      message: "Wybierz walutę bazową.",
    }),
  }),
  holdings: z.array(screenshotHoldingSchema).min(1),
});

export type ScreenshotImportCommitPayload = z.infer<
  typeof screenshotImportCommitSchema
>;
