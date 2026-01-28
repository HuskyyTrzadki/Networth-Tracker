import { z } from "zod";

import { portfolioBaseCurrencies } from "./base-currency";

export const createPortfolioSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Podaj nazwę portfela.")
    .max(120, "Nazwa portfela jest zbyt długa."),
  baseCurrency: z.enum(portfolioBaseCurrencies, {
    message: "Wybierz walutę bazową.",
  }),
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
