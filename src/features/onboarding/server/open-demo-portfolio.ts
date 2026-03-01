import type { SupabaseClient } from "@supabase/supabase-js";

import { createTransaction } from "@/features/transactions/server/create-transaction";
import { deletePortfolioById } from "@/features/portfolio/server/delete-portfolio";
import { createPortfolioStrict } from "@/features/portfolio/server/create-portfolio";
import { bootstrapPortfolioSnapshot } from "@/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot";
import {
  buildCashInstrument,
  isSupportedCashCurrency,
} from "@/features/transactions/lib/system-currencies";
import type { CreateTransactionRequest } from "@/features/transactions/server/schema";
import type { CustomAssetType } from "@/features/transactions/lib/custom-asset-types";
import type { CashflowType } from "@/features/transactions/lib/cashflow-types";
import type { Database } from "@/lib/supabase/database.types";
import { portfolioBaseCurrencies } from "@/features/portfolio/lib/base-currency";

import {
  getActiveDemoBundle,
  getDemoBundleInstance,
  upsertDemoBundleInstance,
  type DemoBundleTemplate,
  type DemoBundleTransactionTemplate,
} from "./demo-bundle";
import {
  copyDemoSnapshotCacheToUser,
  persistDemoSnapshotCacheFromUser,
} from "./demo-snapshot-cache";
import { rebuildDemoSnapshots } from "./rebuild-demo-snapshots";

type SupabaseTypedClient = SupabaseClient<Database>;

type OpenDemoPortfolioResult = Readonly<{
  created: boolean;
  portfolioIds: readonly string[];
  redirectTo: "/portfolio";
}>;

const demoInstrumentMeta = {
  "AAPL": {
    symbol: "AAPL",
    name: "Apple",
    currency: "USD",
    exchange: "NMS",
    region: "US",
  },
  "AMZN": {
    symbol: "AMZN",
    name: "Amazon",
    currency: "USD",
    exchange: "NMS",
    region: "US",
  },
  "CDR.WA": {
    symbol: "CDR.WA",
    name: "CD Projekt",
    currency: "PLN",
    exchange: "WSE",
    region: "PL",
  },
  "GOOGL": {
    symbol: "GOOGL",
    name: "Alphabet",
    currency: "USD",
    exchange: "NMS",
    region: "US",
  },
  "KTY.WA": {
    symbol: "KTY.WA",
    name: "Kety",
    currency: "PLN",
    exchange: "WSE",
    region: "PL",
  },
  "MSFT": {
    symbol: "MSFT",
    name: "Microsoft",
    currency: "USD",
    exchange: "NMS",
    region: "US",
  },
  "NVDA": {
    symbol: "NVDA",
    name: "NVIDIA",
    currency: "USD",
    exchange: "NMS",
    region: "US",
  },
  "PEO.WA": {
    symbol: "PEO.WA",
    name: "Bank Pekao",
    currency: "PLN",
    exchange: "WSE",
    region: "PL",
  },
  "PKN.WA": {
    symbol: "PKN.WA",
    name: "ORLEN",
    currency: "PLN",
    exchange: "WSE",
    region: "PL",
  },
  "XTB.WA": {
    symbol: "XTB.WA",
    name: "XTB",
    currency: "PLN",
    exchange: "WSE",
    region: "PL",
  },
} as const;

const resolveCashCurrency = (value: string | null | undefined) => {
  const normalized = value?.toUpperCase() ?? "PLN";
  return isSupportedCashCurrency(normalized) ? normalized : "PLN";
};

const resolvePortfolioBaseCurrency = (value: string) =>
  portfolioBaseCurrencies.includes(value as (typeof portfolioBaseCurrencies)[number])
    ? (value as (typeof portfolioBaseCurrencies)[number])
    : "PLN";

const warmDemoSnapshotCache = async (
  supabaseUser: SupabaseTypedClient,
  supabaseAdmin: SupabaseTypedClient,
  input: Readonly<{
    bundleId: string;
    userId: string;
    portfolioIds: readonly string[];
    portfolioIdsByTemplateKey: ReadonlyMap<string, string>;
  }>
) => {
  await rebuildDemoSnapshots(supabaseAdmin, input.userId, input.portfolioIds);
  await persistDemoSnapshotCacheFromUser(supabaseAdmin, {
    bundleId: input.bundleId,
    userId: input.userId,
    portfolioIdsByTemplateKey: input.portfolioIdsByTemplateKey,
  });
};

const triggerDemoSnapshotWarm = (
  supabaseUser: SupabaseTypedClient,
  supabaseAdmin: SupabaseTypedClient,
  input: Parameters<typeof warmDemoSnapshotCache>[2]
) => {
  if (process.env.NODE_ENV === "test") {
    return warmDemoSnapshotCache(supabaseUser, supabaseAdmin, input);
  }

  void warmDemoSnapshotCache(supabaseUser, supabaseAdmin, input).catch((error) => {
    console.error("Demo snapshot cache warm failed", error);
  });

  return Promise.resolve();
};

const hasValidPortfolioSet = async (
  supabaseUser: SupabaseTypedClient,
  userId: string,
  bundle: DemoBundleTemplate,
  portfolioIdsByTemplateKey: ReadonlyMap<string, string>
) => {
  if (portfolioIdsByTemplateKey.size !== bundle.portfolios.length) {
    return false;
  }

  const expectedIds = bundle.portfolios
    .map((portfolio) => portfolioIdsByTemplateKey.get(portfolio.templateKey))
    .filter((value): value is string => Boolean(value));

  if (expectedIds.length !== bundle.portfolios.length) {
    return false;
  }

  const { data, error } = await supabaseUser
    .from("portfolios")
    .select("id")
    .eq("user_id", userId)
    .is("archived_at", null)
    .in("id", expectedIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length === bundle.portfolios.length;
};

const toTransactionRequest = (
  portfolioId: string,
  transaction: DemoBundleTransactionTemplate
): CreateTransactionRequest => {
  if (transaction.assetSource === "INSTRUMENT") {
    const cashInstrument =
      transaction.provider === "system"
        ? buildCashInstrument(resolveCashCurrency(transaction.providerKey))
        : null;
    const meta =
      transaction.provider === "system"
        ? null
        : demoInstrumentMeta[
            transaction.providerKey as keyof typeof demoInstrumentMeta
          ] ?? null;
    const instrument =
      transaction.provider === "system" && cashInstrument
        ? {
            provider: cashInstrument.provider,
            providerKey: cashInstrument.providerKey,
            symbol: cashInstrument.symbol,
            name: cashInstrument.name,
            currency: cashInstrument.currency,
            instrumentType: cashInstrument.instrumentType,
            exchange: cashInstrument.exchange,
            region: cashInstrument.region,
            logoUrl: undefined,
          }
        : {
            provider: transaction.provider ?? "yahoo",
            providerKey: transaction.providerKey ?? "",
            symbol: meta?.symbol ?? (transaction.providerKey ?? ""),
            name: meta?.name ?? (transaction.providerKey ?? ""),
            currency: meta?.currency ?? transaction.cashCurrency ?? "USD",
            instrumentType: undefined,
            exchange: meta?.exchange,
            region: meta?.region,
            logoUrl: undefined,
          };

    return {
      portfolioId,
      clientRequestId: crypto.randomUUID(),
      instrument,
      type: transaction.side,
      date: transaction.tradeDate,
      quantity: transaction.quantity,
      price: transaction.price,
      fee: transaction.fee,
      notes: transaction.notes ?? undefined,
      consumeCash: transaction.consumeCash,
      cashCurrency: transaction.cashCurrency ?? undefined,
      cashflowType: (transaction.cashflowType as CashflowType | null) ?? undefined,
      customAnnualRatePct: undefined,
      fxFee: "0",
    };
  }

  return {
    portfolioId,
    clientRequestId: crypto.randomUUID(),
    customInstrument: {
      name: transaction.customName ?? "Pozycja demo",
      currency: transaction.customCurrency ?? "PLN",
      notes: transaction.notes ?? undefined,
      kind: (transaction.customKind ?? "OTHER") as CustomAssetType,
      valuationKind: "COMPOUND_ANNUAL_RATE",
      annualRatePct: transaction.customAnnualRatePct ?? "0",
    },
    type: transaction.side,
    date: transaction.tradeDate,
    quantity: transaction.quantity,
    price: transaction.price,
    fee: transaction.fee,
    notes: transaction.notes ?? undefined,
    consumeCash: false,
    cashflowType: undefined,
    cashCurrency: undefined,
    customAnnualRatePct: undefined,
    fxFee: "0",
  };
};

export async function openDemoPortfolio(
  supabaseUser: SupabaseTypedClient,
  supabaseAdmin: SupabaseTypedClient,
  userId: string
): Promise<OpenDemoPortfolioResult> {
  const bundle = await getActiveDemoBundle(supabaseAdmin);
  const existingInstance = await getDemoBundleInstance(supabaseUser, userId, bundle.id);
  let shouldRollback = true;

  if (
    existingInstance &&
    (await hasValidPortfolioSet(
      supabaseUser,
      userId,
      bundle,
      existingInstance.portfolioIdsByTemplateKey
    ))
  ) {
    return {
      created: false,
      portfolioIds: bundle.portfolios
        .map((portfolio) => existingInstance.portfolioIdsByTemplateKey.get(portfolio.templateKey))
        .filter((value): value is string => Boolean(value)),
      redirectTo: "/portfolio",
    };
  }

  const createdPortfolioIds: string[] = [];

  try {
    const portfolioIdsByTemplateKey = new Map<string, string>();

    for (const template of bundle.portfolios) {
      const portfolio = await createPortfolioStrict(supabaseUser, userId, {
        name: template.name,
        baseCurrency: resolvePortfolioBaseCurrency(template.baseCurrency),
        isTaxAdvantaged: template.isTaxAdvantaged,
      });

      createdPortfolioIds.push(portfolio.id);
      portfolioIdsByTemplateKey.set(template.templateKey, portfolio.id);
    }

    for (const transaction of bundle.transactions) {
      const portfolioId = portfolioIdsByTemplateKey.get(transaction.portfolioTemplateKey);

      if (!portfolioId) {
        throw new Error("Nie znaleziono mapowania portfela demo.");
      }

      await createTransaction(
        supabaseUser,
        supabaseAdmin,
        userId,
        toTransactionRequest(portfolioId, transaction)
      );
    }

    const usedSharedCache = await copyDemoSnapshotCacheToUser(supabaseAdmin, {
      bundleId: bundle.id,
      userId,
      portfolioIdsByTemplateKey,
    });

    await upsertDemoBundleInstance(supabaseAdmin, {
      userId,
      bundleId: bundle.id,
      portfolios: bundle.portfolios.map((portfolio) => ({
        templateKey: portfolio.templateKey,
        portfolioId: portfolioIdsByTemplateKey.get(portfolio.templateKey) ?? "",
      })),
    });
    shouldRollback = false;

    if (!usedSharedCache) {
      await Promise.all([
        ...createdPortfolioIds.map((portfolioId) =>
          bootstrapPortfolioSnapshot(
            supabaseUser,
            supabaseAdmin,
            userId,
            "PORTFOLIO",
            portfolioId
          )
        ),
        bootstrapPortfolioSnapshot(supabaseUser, supabaseAdmin, userId, "ALL", null),
      ]);

      await triggerDemoSnapshotWarm(supabaseUser, supabaseAdmin, {
        bundleId: bundle.id,
        userId,
        portfolioIds: createdPortfolioIds,
        portfolioIdsByTemplateKey,
      });
    }

    return {
      created: true,
      portfolioIds: createdPortfolioIds,
      redirectTo: "/portfolio",
    };
  } catch (error) {
    if (shouldRollback) {
      await Promise.allSettled(
        createdPortfolioIds.map((portfolioId) =>
          deletePortfolioById(supabaseUser, supabaseAdmin, userId, portfolioId)
        )
      );
    }

    throw error;
  }
}
