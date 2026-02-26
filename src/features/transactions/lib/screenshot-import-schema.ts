import { z } from "zod";

import { screenshotHoldingSchema } from "@/features/onboarding/lib/screenshot-import-schema";

export const screenshotPortfolioImportSchema = z.object({
  portfolioId: z.string().trim().min(1, "Wybierz portfel."),
  holdings: z.array(screenshotHoldingSchema).min(1),
});

export type ScreenshotPortfolioImportPayload = z.infer<
  typeof screenshotPortfolioImportSchema
>;
