import { createHash } from "node:crypto";

import type { PortfolioSummary } from "../valuation";

type BuildFingerprintInput = Readonly<{
  summary: PortfolioSummary;
  scope: "ALL" | "PORTFOLIO";
  portfolioId: string | null;
  promptVersion: string;
  model: string;
}>;

const serializeFingerprintInput = (input: BuildFingerprintInput) => {
  const instrumentIds = Array.from(
    new Set(
      input.summary.holdings
        .map((holding) => holding.instrumentId)
        .filter((instrumentId) => instrumentId.trim().length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  return JSON.stringify({
    scope: input.scope,
    portfolioId: input.portfolioId,
    promptVersion: input.promptVersion,
    model: input.model,
    instrumentIds,
  });
};

export function buildInstrumentSetFingerprint(input: BuildFingerprintInput): string {
  const serialized = serializeFingerprintInput(input);
  return createHash("sha256").update(serialized).digest("hex");
}

export const __test__ = {
  serializeFingerprintInput,
};
