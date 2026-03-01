import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseTypedClient = SupabaseClient<Database>;

type DemoBundleRow = Database["public"]["Tables"]["demo_bundles"]["Row"];
type DemoBundlePortfolioRow =
  Database["public"]["Tables"]["demo_bundle_portfolios"]["Row"];
type DemoBundleTransactionRow =
  Database["public"]["Tables"]["demo_bundle_transactions"]["Row"];
type DemoBundleInstancePortfolioRow =
  Database["public"]["Tables"]["demo_bundle_instance_portfolios"]["Row"];

export type DemoBundlePortfolioTemplate = Readonly<{
  templateKey: string;
  name: string;
  baseCurrency: string;
  isTaxAdvantaged: boolean;
  sortOrder: number;
}>;

export type DemoBundleTransactionTemplate = Readonly<{
  portfolioTemplateKey: string;
  sortOrder: number;
  assetSource: "INSTRUMENT" | "CUSTOM";
  provider: string | null;
  providerKey: string | null;
  customName: string | null;
  customCurrency: string | null;
  customKind: string | null;
  customValuationKind: string | null;
  customAnnualRatePct: string | null;
  side: "BUY" | "SELL";
  cashflowType: string | null;
  tradeDate: string;
  quantity: string;
  price: string;
  fee: string;
  notes: string | null;
  consumeCash: boolean;
  cashCurrency: string | null;
}>;

export type DemoBundleTemplate = Readonly<{
  id: string;
  slug: string;
  name: string;
  portfolios: readonly DemoBundlePortfolioTemplate[];
  transactions: readonly DemoBundleTransactionTemplate[];
}>;

export type DemoBundleInstance = Readonly<{
  portfolioIdsByTemplateKey: ReadonlyMap<string, string>;
}>;

const normalizeNumber = (value: number | string | null) =>
  value === null ? null : typeof value === "number" ? value.toString() : value;

const toTemplate = (
  bundle: DemoBundleRow,
  portfolios: readonly DemoBundlePortfolioRow[],
  transactions: readonly DemoBundleTransactionRow[]
): DemoBundleTemplate => ({
  id: bundle.id,
  slug: bundle.slug,
  name: bundle.name,
  portfolios: portfolios.map((portfolio) => ({
    templateKey: portfolio.template_key,
    name: portfolio.name,
    baseCurrency: portfolio.base_currency,
    isTaxAdvantaged: portfolio.is_tax_advantaged,
    sortOrder: portfolio.sort_order,
  })),
  transactions: transactions.map((transaction) => ({
    portfolioTemplateKey: transaction.portfolio_template_key,
    sortOrder: transaction.sort_order,
    assetSource: transaction.asset_source as "INSTRUMENT" | "CUSTOM",
    provider: transaction.provider,
    providerKey: transaction.provider_key,
    customName: transaction.custom_name,
    customCurrency: transaction.custom_currency,
    customKind: transaction.custom_kind,
    customValuationKind: transaction.custom_valuation_kind,
    customAnnualRatePct: normalizeNumber(transaction.custom_annual_rate_pct),
    side: transaction.side,
    cashflowType: transaction.cashflow_type,
    tradeDate: transaction.trade_date,
    quantity: normalizeNumber(transaction.quantity) ?? "0",
    price: normalizeNumber(transaction.price) ?? "0",
    fee: normalizeNumber(transaction.fee) ?? "0",
    notes: transaction.notes,
    consumeCash: transaction.consume_cash,
    cashCurrency: transaction.cash_currency,
  })),
});

export async function getActiveDemoBundle(
  supabaseAdmin: SupabaseTypedClient,
  slug = "default"
): Promise<DemoBundleTemplate> {
  const { data: bundle, error: bundleError } = await supabaseAdmin
    .from("demo_bundles")
    .select("id, slug, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (bundleError || !bundle) {
    throw new Error("Brak aktywnego portfela demonstracyjnego.");
  }

  const [{ data: portfolios, error: portfoliosError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabaseAdmin
        .from("demo_bundle_portfolios")
        .select("bundle_id, template_key, name, base_currency, is_tax_advantaged, sort_order")
        .eq("bundle_id", bundle.id)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("demo_bundle_transactions")
        .select(
          "bundle_id, portfolio_template_key, sort_order, asset_source, provider, provider_key, custom_name, custom_currency, custom_kind, custom_valuation_kind, custom_annual_rate_pct, side, cashflow_type, trade_date, quantity, price, fee, notes, consume_cash, cash_currency"
        )
        .eq("bundle_id", bundle.id)
        .order("sort_order", { ascending: true }),
    ]);

  if (portfoliosError) {
    throw new Error(portfoliosError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  return toTemplate(
    bundle as DemoBundleRow,
    (portfolios ?? []) as DemoBundlePortfolioRow[],
    (transactions ?? []) as DemoBundleTransactionRow[]
  );
}

export async function getDemoBundleInstance(
  supabaseUser: SupabaseTypedClient,
  userId: string,
  bundleId: string
): Promise<DemoBundleInstance | null> {
  const { data, error } = await supabaseUser
    .from("demo_bundle_instance_portfolios")
    .select("portfolio_template_key, portfolio_id")
    .eq("user_id", userId)
    .eq("bundle_id", bundleId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as DemoBundleInstancePortfolioRow[];
  if (rows.length === 0) {
    return null;
  }

  return {
    portfolioIdsByTemplateKey: new Map(
      rows.map((row) => [row.portfolio_template_key, row.portfolio_id])
    ),
  };
}

export async function upsertDemoBundleInstance(
  supabaseAdmin: SupabaseTypedClient,
  input: Readonly<{
    userId: string;
    bundleId: string;
    portfolios: readonly { templateKey: string; portfolioId: string }[];
  }>
) {
  const { error: instanceError } = await supabaseAdmin
    .from("demo_bundle_instances")
    .upsert(
      {
        user_id: input.userId,
        bundle_id: input.bundleId,
      },
      { onConflict: "user_id,bundle_id" }
    );

  if (instanceError) {
    throw new Error(instanceError.message);
  }

  const { error: portfolioError } = await supabaseAdmin
    .from("demo_bundle_instance_portfolios")
    .upsert(
      input.portfolios.map((portfolio) => ({
        user_id: input.userId,
        bundle_id: input.bundleId,
        portfolio_template_key: portfolio.templateKey,
        portfolio_id: portfolio.portfolioId,
      })),
      { onConflict: "user_id,bundle_id,portfolio_template_key" }
    );

  if (portfolioError) {
    throw new Error(portfolioError.message);
  }
}

export async function listDemoPortfolioIds(
  supabaseUser: SupabaseTypedClient
): Promise<ReadonlySet<string>> {
  const { data, error } = await supabaseUser
    .from("demo_bundle_instance_portfolios")
    .select("portfolio_id");

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.portfolio_id));
}
