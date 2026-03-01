import { beforeEach, describe, expect, it, vi } from "vitest";

import { openDemoPortfolio } from "./open-demo-portfolio";

import { getActiveDemoBundle, getDemoBundleInstance, upsertDemoBundleInstance } from "./demo-bundle";
import { createPortfolioStrict } from "@/features/portfolio/server/create-portfolio";
import { createTransaction } from "@/features/transactions/server/create-transaction";
import { bootstrapPortfolioSnapshot } from "@/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot";
import {
  copyDemoSnapshotCacheToUser,
  persistDemoSnapshotCacheFromUser,
} from "./demo-snapshot-cache";
import { rebuildDemoSnapshots } from "./rebuild-demo-snapshots";

vi.mock("./demo-bundle", () => ({
  getActiveDemoBundle: vi.fn(),
  getDemoBundleInstance: vi.fn(),
  upsertDemoBundleInstance: vi.fn(),
}));

vi.mock("@/features/portfolio/server/create-portfolio", () => ({
  createPortfolioStrict: vi.fn(),
}));

vi.mock("@/features/transactions/server/create-transaction", () => ({
  createTransaction: vi.fn(),
}));

vi.mock("@/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot", () => ({
  bootstrapPortfolioSnapshot: vi.fn(),
}));

vi.mock("./demo-snapshot-cache", () => ({
  copyDemoSnapshotCacheToUser: vi.fn(),
  persistDemoSnapshotCacheFromUser: vi.fn(),
}));

vi.mock("./rebuild-demo-snapshots", () => ({
  rebuildDemoSnapshots: vi.fn(),
}));

vi.mock("@/features/portfolio/server/delete-portfolio", () => ({
  deletePortfolioById: vi.fn(),
}));

const supabaseUser = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn(() => ({
          in: vi.fn(async () => ({
            data: [{ id: "portfolio-1" }, { id: "portfolio-2" }],
            error: null,
          })),
        })),
      })),
    })),
  })),
};

const supabaseAdmin = {};

describe("openDemoPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getActiveDemoBundle).mockResolvedValue({
      id: "bundle-1",
      slug: "default",
      name: "Demo",
      portfolios: [
        {
          templateKey: "ike-long-term",
          name: "IKE Globalny",
          baseCurrency: "PLN",
          isTaxAdvantaged: true,
          sortOrder: 1,
        },
        {
          templateKey: "aktywny-mix",
          name: "Portfel Aktywny",
          baseCurrency: "PLN",
          isTaxAdvantaged: false,
          sortOrder: 2,
        },
      ],
      transactions: [
        {
          portfolioTemplateKey: "ike-long-term",
          sortOrder: 1,
          assetSource: "INSTRUMENT",
          provider: "system",
          providerKey: "PLN",
          customName: null,
          customCurrency: null,
          customKind: null,
          customValuationKind: null,
          customAnnualRatePct: null,
          side: "BUY",
          cashflowType: "DEPOSIT",
          tradeDate: "2023-01-01",
          quantity: "1000",
          price: "1",
          fee: "0",
          notes: "Start",
          consumeCash: false,
          cashCurrency: null,
        },
      ],
    });

    vi.mocked(getDemoBundleInstance).mockResolvedValue(null);
    vi.mocked(createPortfolioStrict)
      .mockResolvedValueOnce({
        id: "portfolio-1",
        name: "IKE Globalny",
        baseCurrency: "PLN",
        isTaxAdvantaged: true,
      })
      .mockResolvedValueOnce({
        id: "portfolio-2",
        name: "Portfel Aktywny",
        baseCurrency: "PLN",
        isTaxAdvantaged: false,
      });
    vi.mocked(createTransaction).mockResolvedValue({
      transactionId: "tx-1",
      instrumentId: "inst-1",
      customInstrumentId: null,
      deduped: false,
    });
    vi.mocked(bootstrapPortfolioSnapshot).mockResolvedValue({
      status: "ok",
      hasHoldings: true,
    });
    vi.mocked(copyDemoSnapshotCacheToUser).mockResolvedValue(false);
    vi.mocked(persistDemoSnapshotCacheFromUser).mockResolvedValue(undefined);
    vi.mocked(rebuildDemoSnapshots).mockResolvedValue(undefined);
  });

  it("creates the demo bundle for a guest user", async () => {
    const result = await openDemoPortfolio(
      supabaseUser as never,
      supabaseAdmin as never,
      "user-1"
    );

    expect(result).toEqual({
      created: true,
      portfolioIds: ["portfolio-1", "portfolio-2"],
      redirectTo: "/portfolio",
    });
    expect(createPortfolioStrict).toHaveBeenCalledTimes(2);
    expect(createTransaction).toHaveBeenCalledTimes(1);
    expect(upsertDemoBundleInstance).toHaveBeenCalledWith(
      supabaseAdmin,
      expect.objectContaining({
        userId: "user-1",
        bundleId: "bundle-1",
      })
    );
    expect(bootstrapPortfolioSnapshot).toHaveBeenCalledTimes(3);
    expect(rebuildDemoSnapshots).toHaveBeenCalledTimes(1);
    expect(persistDemoSnapshotCacheFromUser).toHaveBeenCalledTimes(1);
  });

  it("copies shared demo snapshots when cache already exists", async () => {
    vi.mocked(copyDemoSnapshotCacheToUser).mockResolvedValue(true);

    const result = await openDemoPortfolio(
      supabaseUser as never,
      supabaseAdmin as never,
      "user-1"
    );

    expect(result).toEqual({
      created: true,
      portfolioIds: ["portfolio-1", "portfolio-2"],
      redirectTo: "/portfolio",
    });
    expect(bootstrapPortfolioSnapshot).not.toHaveBeenCalled();
    expect(rebuildDemoSnapshots).not.toHaveBeenCalled();
    expect(persistDemoSnapshotCacheFromUser).not.toHaveBeenCalled();
  });

  it("reuses an existing valid demo bundle", async () => {
    vi.mocked(getDemoBundleInstance).mockResolvedValue({
      portfolioIdsByTemplateKey: new Map([
        ["ike-long-term", "portfolio-1"],
        ["aktywny-mix", "portfolio-2"],
      ]),
    });

    const result = await openDemoPortfolio(
      supabaseUser as never,
      supabaseAdmin as never,
      "user-1"
    );

    expect(result).toEqual({
      created: false,
      portfolioIds: ["portfolio-1", "portfolio-2"],
      redirectTo: "/portfolio",
    });
    expect(createPortfolioStrict).not.toHaveBeenCalled();
    expect(createTransaction).not.toHaveBeenCalled();
  });
});
