import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getSnapshotRebuildState,
  updateSnapshotRebuildState,
} from "@/features/portfolio/server/snapshots/rebuild-state";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseTypedClient = SupabaseClient<Database>;

type DemoSnapshotCacheRow =
  Database["public"]["Tables"]["demo_bundle_snapshot_cache"]["Row"];
type PortfolioSnapshotInsert =
  Database["public"]["Tables"]["portfolio_snapshots"]["Insert"];

const CACHE_BATCH_SIZE = 500;

const normalizeNumber = (value: number | null) =>
  value === null ? null : value.toString();

const toNumber = (value: string | null) => (value === null ? null : Number(value));

const chunk = <T>(items: readonly T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const toSnapshotInsert = (
  userId: string,
  portfolioIdsByTemplateKey: ReadonlyMap<string, string>,
  row: DemoSnapshotCacheRow
): PortfolioSnapshotInsert => ({
  user_id: userId,
  scope: row.scope,
  portfolio_id:
    row.scope === "PORTFOLIO"
      ? (portfolioIdsByTemplateKey.get(row.portfolio_template_key ?? "") ?? null)
      : null,
  bucket_date: row.bucket_date,
  captured_at: row.captured_at,
  total_value_pln: toNumber(normalizeNumber(row.total_value_pln)),
  total_value_usd: toNumber(normalizeNumber(row.total_value_usd)),
  total_value_eur: toNumber(normalizeNumber(row.total_value_eur)),
  net_external_cashflow_pln: toNumber(normalizeNumber(row.net_external_cashflow_pln)),
  net_external_cashflow_usd: toNumber(normalizeNumber(row.net_external_cashflow_usd)),
  net_external_cashflow_eur: toNumber(normalizeNumber(row.net_external_cashflow_eur)),
  net_implicit_transfer_pln: toNumber(normalizeNumber(row.net_implicit_transfer_pln)),
  net_implicit_transfer_usd: toNumber(normalizeNumber(row.net_implicit_transfer_usd)),
  net_implicit_transfer_eur: toNumber(normalizeNumber(row.net_implicit_transfer_eur)),
  is_partial_pln: row.is_partial_pln,
  missing_quotes_pln: row.missing_quotes_pln,
  missing_fx_pln: row.missing_fx_pln,
  as_of_pln: row.as_of_pln,
  is_partial_usd: row.is_partial_usd,
  missing_quotes_usd: row.missing_quotes_usd,
  missing_fx_usd: row.missing_fx_usd,
  as_of_usd: row.as_of_usd,
  is_partial_eur: row.is_partial_eur,
  missing_quotes_eur: row.missing_quotes_eur,
  missing_fx_eur: row.missing_fx_eur,
  as_of_eur: row.as_of_eur,
});

async function listCacheRows(
  supabaseAdmin: SupabaseTypedClient,
  bundleId: string
): Promise<readonly DemoSnapshotCacheRow[]> {
  const { data, error } = await supabaseAdmin
    .from("demo_bundle_snapshot_cache")
    .select(
      "bundle_id, scope, portfolio_template_key, bucket_date, captured_at, total_value_pln, total_value_usd, total_value_eur, net_external_cashflow_pln, net_external_cashflow_usd, net_external_cashflow_eur, net_implicit_transfer_pln, net_implicit_transfer_usd, net_implicit_transfer_eur, is_partial_pln, missing_quotes_pln, missing_fx_pln, as_of_pln, is_partial_usd, missing_quotes_usd, missing_fx_usd, as_of_usd, is_partial_eur, missing_quotes_eur, missing_fx_eur, as_of_eur"
    )
    .eq("bundle_id", bundleId)
    .order("bucket_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DemoSnapshotCacheRow[];
}

async function clearUserSnapshotRows(
  supabaseAdmin: SupabaseTypedClient,
  userId: string,
  portfolioIds: readonly string[]
) {
  const { error: allError } = await supabaseAdmin
    .from("portfolio_snapshots")
    .delete()
    .eq("user_id", userId)
    .eq("scope", "ALL")
    .is("portfolio_id", null);

  if (allError) {
    throw new Error(allError.message);
  }

  if (portfolioIds.length === 0) {
    return;
  }

  const { error: portfolioError } = await supabaseAdmin
    .from("portfolio_snapshots")
    .delete()
    .eq("user_id", userId)
    .eq("scope", "PORTFOLIO")
    .in("portfolio_id", portfolioIds);

  if (portfolioError) {
    throw new Error(portfolioError.message);
  }
}

async function clearRebuildState(
  supabaseAdmin: SupabaseTypedClient,
  userId: string,
  portfolioIds: readonly string[]
) {
  const scopes: ReadonlyArray<Readonly<{ scope: "PORTFOLIO" | "ALL"; portfolioId: string | null }>> =
    [
      ...portfolioIds.map((portfolioId) => ({
        scope: "PORTFOLIO" as const,
        portfolioId,
      })),
      { scope: "ALL" as const, portfolioId: null },
    ];

  await Promise.all(
    scopes.map(async ({ scope, portfolioId }) => {
      const state = await getSnapshotRebuildState(
        supabaseAdmin,
        userId,
        scope,
        portfolioId
      );

      if (!state) {
        return;
      }

      await updateSnapshotRebuildState(supabaseAdmin, {
        id: state.id,
        status: "idle",
        dirtyFrom: null,
        fromDate: null,
        toDate: null,
        processedUntil: null,
        message: null,
      });
    })
  );
}

export async function copyDemoSnapshotCacheToUser(
  supabaseAdmin: SupabaseTypedClient,
  input: Readonly<{
    bundleId: string;
    userId: string;
    portfolioIdsByTemplateKey: ReadonlyMap<string, string>;
  }>
): Promise<boolean> {
  const rows = await listCacheRows(supabaseAdmin, input.bundleId);
  if (rows.length === 0) {
    return false;
  }

  const portfolioIds = Array.from(input.portfolioIdsByTemplateKey.values());
  await clearUserSnapshotRows(supabaseAdmin, input.userId, portfolioIds);

  const inserts = rows.map((row) =>
    toSnapshotInsert(input.userId, input.portfolioIdsByTemplateKey, row)
  );

  for (const batch of chunk(inserts, CACHE_BATCH_SIZE)) {
    const { error } = await supabaseAdmin.from("portfolio_snapshots").insert(batch);

    if (error) {
      throw new Error(error.message);
    }
  }

  await clearRebuildState(supabaseAdmin, input.userId, portfolioIds);
  return true;
}

export async function persistDemoSnapshotCacheFromUser(
  supabaseAdmin: SupabaseTypedClient,
  input: Readonly<{
    bundleId: string;
    userId: string;
    portfolioIdsByTemplateKey: ReadonlyMap<string, string>;
  }>
) {
  const portfolioIds = Array.from(input.portfolioIdsByTemplateKey.values());
  const reverseMap = new Map(
    Array.from(input.portfolioIdsByTemplateKey.entries()).map(([templateKey, portfolioId]) => [
      portfolioId,
      templateKey,
    ])
  );

  const [allResult, portfolioResult] = await Promise.all([
    supabaseAdmin
      .from("portfolio_snapshots")
      .select(
        "user_id, scope, portfolio_id, bucket_date, captured_at, total_value_pln, total_value_usd, total_value_eur, net_external_cashflow_pln, net_external_cashflow_usd, net_external_cashflow_eur, net_implicit_transfer_pln, net_implicit_transfer_usd, net_implicit_transfer_eur, is_partial_pln, missing_quotes_pln, missing_fx_pln, as_of_pln, is_partial_usd, missing_quotes_usd, missing_fx_usd, as_of_usd, is_partial_eur, missing_quotes_eur, missing_fx_eur, as_of_eur"
      )
      .eq("user_id", input.userId)
      .eq("scope", "ALL")
      .is("portfolio_id", null)
      .order("bucket_date", { ascending: true }),
    portfolioIds.length > 0
      ? supabaseAdmin
          .from("portfolio_snapshots")
          .select(
            "user_id, scope, portfolio_id, bucket_date, captured_at, total_value_pln, total_value_usd, total_value_eur, net_external_cashflow_pln, net_external_cashflow_usd, net_external_cashflow_eur, net_implicit_transfer_pln, net_implicit_transfer_usd, net_implicit_transfer_eur, is_partial_pln, missing_quotes_pln, missing_fx_pln, as_of_pln, is_partial_usd, missing_quotes_usd, missing_fx_usd, as_of_usd, is_partial_eur, missing_quotes_eur, missing_fx_eur, as_of_eur"
          )
          .eq("user_id", input.userId)
          .eq("scope", "PORTFOLIO")
          .in("portfolio_id", portfolioIds)
          .order("bucket_date", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (allResult.error) {
    throw new Error(allResult.error.message);
  }

  if (portfolioResult.error) {
    throw new Error(portfolioResult.error.message);
  }

  const rows = [
    ...((allResult.data ?? []) as Database["public"]["Tables"]["portfolio_snapshots"]["Row"][]),
    ...((portfolioResult.data ?? []) as Database["public"]["Tables"]["portfolio_snapshots"]["Row"][]),
  ];
  if (rows.length === 0) {
    return;
  }

  const { error: deleteError } = await supabaseAdmin
    .from("demo_bundle_snapshot_cache")
    .delete()
    .eq("bundle_id", input.bundleId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const cacheRows = rows.map((row) => ({
    bundle_id: input.bundleId,
    scope: row.scope,
    portfolio_template_key:
      row.scope === "PORTFOLIO" ? (reverseMap.get(row.portfolio_id ?? "") ?? null) : null,
    bucket_date: row.bucket_date,
    captured_at: row.captured_at,
    total_value_pln: row.total_value_pln,
    total_value_usd: row.total_value_usd,
    total_value_eur: row.total_value_eur,
    net_external_cashflow_pln: row.net_external_cashflow_pln,
    net_external_cashflow_usd: row.net_external_cashflow_usd,
    net_external_cashflow_eur: row.net_external_cashflow_eur,
    net_implicit_transfer_pln: row.net_implicit_transfer_pln,
    net_implicit_transfer_usd: row.net_implicit_transfer_usd,
    net_implicit_transfer_eur: row.net_implicit_transfer_eur,
    is_partial_pln: row.is_partial_pln,
    missing_quotes_pln: row.missing_quotes_pln,
    missing_fx_pln: row.missing_fx_pln,
    as_of_pln: row.as_of_pln,
    is_partial_usd: row.is_partial_usd,
    missing_quotes_usd: row.missing_quotes_usd,
    missing_fx_usd: row.missing_fx_usd,
    as_of_usd: row.as_of_usd,
    is_partial_eur: row.is_partial_eur,
    missing_quotes_eur: row.missing_quotes_eur,
    missing_fx_eur: row.missing_fx_eur,
    as_of_eur: row.as_of_eur,
  }));

  for (const batch of chunk(cacheRows, CACHE_BATCH_SIZE)) {
    const { error: insertError } = await supabaseAdmin
      .from("demo_bundle_snapshot_cache")
      .insert(batch);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}
