import type { SupabaseClient } from "@supabase/supabase-js";

import { touchProfileLastActive } from "@/features/auth/server/profiles";
import { markSnapshotRebuildDirty } from "@/features/portfolio/server/snapshots/rebuild-state";
import type {
  BrokerImportRunRowIssue,
  BrokerImportRunSummary,
  CreateBrokerImportJobResponse,
} from "@/features/transactions/lib/broker-import-types";
import type { BrokerImportProviderId } from "@/features/transactions/lib/broker-import-providers";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import { createTransaction } from "./create-transaction";
import {
  requireBrokerImportProvider,
} from "./broker-import/provider-registry";
import { brokerImportReadyRowSchema, type BrokerImportReadyRow } from "./broker-import/shared";

type SupabaseServerClient = SupabaseClient;
type ImportRunRow = Tables<"broker_import_runs">;
type ImportRunItemRow = Tables<"broker_import_run_rows">;

const RUNNING_STALE_AFTER_MS = 90_000;
const DEFAULT_MAX_ROWS_PER_RUN = 50;
const DEFAULT_TIME_BUDGET_MS = 1_500;

const nowIso = () => new Date().toISOString();

const logImportEvent = (
  event: string,
  details: Readonly<Record<string, string | number | null>>
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.info(`[broker-import][job] ${event}`, details);
};

const isRunningStale = (updatedAt: string) => {
  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(updatedAtMs)) {
    return true;
  }

  return Date.now() - updatedAtMs > RUNNING_STALE_AFTER_MS;
};

const mapBlockingRow = (row: ImportRunItemRow): BrokerImportRunRowIssue => ({
  id: row.id,
  rowIndex: row.row_index,
  sourceFileName: row.source_file_name,
  xtbRowId: row.source_row_id,
  sourceType: row.source_type,
  tradeDate: row.trade_date,
  status: row.status as BrokerImportRunRowIssue["status"],
  errorMessage: row.error_message,
});

const buildRunSummary = async (
  supabase: SupabaseServerClient,
  run: ImportRunRow
): Promise<BrokerImportRunSummary> => {
  const { data: blockingRows, error } = await supabase
    .from("broker_import_run_rows")
    .select(
      "id,row_index,source_file_name,source_row_id,source_type,trade_date,status,error_message"
    )
    .eq("run_id", run.id)
    .in("status", ["blocked", "failed"])
    .order("row_index", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: run.id,
    provider: run.provider as BrokerImportProviderId,
    portfolioId: run.portfolio_id,
    status: run.status as BrokerImportRunSummary["status"],
    totalRows: run.total_rows,
    completedRows: run.completed_rows,
    dedupedRows: run.deduped_rows,
    failedRows: run.failed_rows,
    blockedRows: run.blocked_rows,
    message: run.message,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    updatedAt: run.updated_at,
    blockingRows: (blockingRows ?? []).map((row) => mapBlockingRow(row as ImportRunItemRow)),
  };
};

const getRunForUser = async (
  supabase: SupabaseServerClient,
  userId: string,
  runId: string
) => {
  const { data, error } = await supabase
    .from("broker_import_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ImportRunRow | null) ?? null;
};

const parseStoredRowPayload = (row: ImportRunItemRow) => {
  const parsed = brokerImportReadyRowSchema.safeParse(row.row_payload);
  if (!parsed.success) {
    throw new Error(
      `${row.source_type} • ${row.source_file_name} • wiersz ${row.source_row_id}: zapisany payload importu jest nieprawidłowy.`
    );
  }

  return requireBrokerImportProvider(parsed.data.provider).parseReadyRow(parsed.data);
};

export async function createBrokerImportJob(
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  providerId: BrokerImportProviderId,
  portfolioId: string,
  rows: readonly BrokerImportReadyRow[]
): Promise<CreateBrokerImportJobResponse> {
  const startedAt = performance.now();
  const provider = requireBrokerImportProvider(providerId);
  const parsedRows = provider.sortReadyRows(
    rows.map((row) => provider.parseReadyRow(row))
  );
  const { data: runData, error: runError } = await supabaseAdmin
    .from("broker_import_runs")
    .insert({
      user_id: userId,
      provider: providerId,
      portfolio_id: portfolioId,
      status: "queued",
      total_rows: parsedRows.length,
      source_summary: provider.buildSourceSummary(parsedRows),
      updated_at: nowIso(),
    })
    .select("*")
    .single();

  if (runError || !runData) {
    throw new Error(runError?.message ?? "Nie udało się utworzyć importu brokera.");
  }

  const rowInserts: TablesInsert<"broker_import_run_rows">[] = parsedRows.map((row: BrokerImportReadyRow, index: number) => ({
    run_id: runData.id,
    user_id: userId,
    row_index: index,
    source_file_name: row.sourceFileName,
    source_row_id: row.xtbRowId,
    source_type: row.sourceType,
    trade_date: row.tradeDate,
    requires_instrument: row.requiresInstrument,
    row_payload: row,
    updated_at: nowIso(),
  }));

  const { error: rowsError } = await supabaseAdmin
    .from("broker_import_run_rows")
    .insert(rowInserts);

  if (rowsError) {
    throw new Error(rowsError.message);
  }

  logImportEvent("created", {
    userId,
    portfolioId,
    rowCount: parsedRows.length,
    totalMs: Math.round(performance.now() - startedAt),
  });

  return { run: await buildRunSummary(supabaseAdmin, runData as ImportRunRow) };
}

export async function getBrokerImportJob(
  supabase: SupabaseServerClient,
  userId: string,
  runId: string
): Promise<BrokerImportRunSummary | null> {
  const run = await getRunForUser(supabase, userId, runId);
  if (!run) {
    return null;
  }

  return buildRunSummary(supabase, run);
}

export async function runBrokerImportJob(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  runId: string,
  options: Readonly<{
    maxRowsPerRun?: number;
    timeBudgetMs?: number;
  }> = {}
): Promise<BrokerImportRunSummary | null> {
  const runStartedAt = performance.now();
  const run = await getRunForUser(supabaseAdmin, userId, runId);
  if (!run) {
    return null;
  }

  const provider = requireBrokerImportProvider(run.provider as BrokerImportProviderId);

  if (
    run.status === "completed" ||
    run.status === "failed" ||
    run.status === "blocked"
  ) {
    return buildRunSummary(supabaseAdmin, run);
  }

  if (run.status === "running" && !isRunningStale(run.updated_at)) {
    return buildRunSummary(supabaseAdmin, run);
  }

  const startedAt = run.started_at ?? nowIso();
  const runningAt = nowIso();
  const { error: updateRunningError } = await supabaseAdmin
    .from("broker_import_runs")
    .update({
      status: "running",
      started_at: startedAt,
      updated_at: runningAt,
      message: null,
    })
    .eq("id", run.id)
    .eq("user_id", userId);

  if (updateRunningError) {
    throw new Error(updateRunningError.message);
  }

  const deadline = Date.now() + Math.max(1, options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS);
  const maxRows = Math.max(1, options.maxRowsPerRun ?? DEFAULT_MAX_ROWS_PER_RUN);
  let processedCount = 0;
  let dedupedCount = 0;
  let earliestTradeDate: string | null = null;

  const { data: pendingRows, error: pendingRowsError } = await supabaseAdmin
    .from("broker_import_run_rows")
    .select("*")
    .eq("run_id", run.id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("row_index", { ascending: true })
    .limit(maxRows);

  if (pendingRowsError) {
    throw new Error(pendingRowsError.message);
  }
  const fetchedPendingAt = performance.now();

  for (const pendingRow of (pendingRows ?? []) as ImportRunItemRow[]) {
    if (processedCount > 0 && Date.now() >= deadline) {
      break;
    }

    const row = parseStoredRowPayload(pendingRow);
    if (earliestTradeDate === null || row.tradeDate < earliestTradeDate) {
      earliestTradeDate = row.tradeDate;
    }

    try {
      const { request, guardMode, settlementOverride } = provider.buildImportExecution(
        run.portfolio_id,
        row
      );
      const rowStartedAt = performance.now();
      const result = await createTransaction(
        supabaseUser,
        supabaseAdmin,
        userId,
        request,
        {
          guardMode,
          skipPostWriteSideEffects: true,
          settlementOverride,
        }
      );

      const { error: markDoneError } = await supabaseAdmin
        .from("broker_import_run_rows")
        .update({
          status: "done",
          asset_transaction_id: result.transactionId,
          was_deduped: result.deduped,
          error_message: null,
          updated_at: nowIso(),
        })
        .eq("id", pendingRow.id)
        .eq("run_id", run.id);

      if (markDoneError) {
        throw new Error(markDoneError.message);
      }

      processedCount += 1;
      if (result.deduped) {
        dedupedCount += 1;
      }

      logImportEvent("row-finished", {
        runId: run.id,
        provider: run.provider,
        xtbRowId: row.xtbRowId,
        tradeDate: row.tradeDate,
        deduped: result.deduped ? 1 : 0,
        durationMs: Math.round(performance.now() - rowStartedAt),
      });
    } catch (caughtError) {
      const message = provider.resolveErrorMessage(
        caughtError,
        `Nie udało się zapisać wiersza ${pendingRow.source_row_id} z importu brokera.`
      );
      const rowDebugLabel = provider.buildRowDebugLabel(row);
      const nextStatus = row.requiresInstrument ? "blocked" : "failed";

      await supabaseAdmin
        .from("broker_import_run_rows")
        .update({
          status: nextStatus,
          error_message: message,
          updated_at: nowIso(),
        })
        .eq("id", pendingRow.id)
        .eq("run_id", run.id);

      await supabaseAdmin
        .from("broker_import_runs")
        .update({
          status: nextStatus === "blocked" ? "blocked" : "failed",
          completed_rows: run.completed_rows + processedCount,
          deduped_rows: run.deduped_rows + dedupedCount,
          blocked_rows: run.blocked_rows + (nextStatus === "blocked" ? 1 : 0),
          failed_rows: run.failed_rows + (nextStatus === "failed" ? 1 : 0),
          message: `${rowDebugLabel}: ${message}`,
          finished_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq("id", run.id)
        .eq("user_id", userId);

      const failedRun = await getRunForUser(supabaseAdmin, userId, run.id);
      return failedRun ? buildRunSummary(supabaseAdmin, failedRun) : null;
    }
  }

  if (processedCount > 0 && earliestTradeDate) {
    const dirtyMarkStartedAt = performance.now();
    await Promise.all([
      touchProfileLastActive(supabaseUser, userId).catch(() => undefined),
      markSnapshotRebuildDirty(supabaseAdmin, {
        userId,
        portfolioId: run.portfolio_id,
        scope: "PORTFOLIO",
        dirtyFrom: earliestTradeDate,
      }).catch(() => undefined),
      markSnapshotRebuildDirty(supabaseAdmin, {
        userId,
        portfolioId: null,
        scope: "ALL",
        dirtyFrom: earliestTradeDate,
      }).catch(() => undefined),
    ]);

    logImportEvent("dirty-marked", {
      runId: run.id,
      provider: run.provider,
      portfolioId: run.portfolio_id,
      dirtyFrom: earliestTradeDate,
      durationMs: Math.round(performance.now() - dirtyMarkStartedAt),
    });
  }

  const { count: remainingRows, error: remainingRowsError } = await supabaseAdmin
    .from("broker_import_run_rows")
    .select("id", { count: "exact", head: true })
    .eq("run_id", run.id)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (remainingRowsError) {
    throw new Error(remainingRowsError.message);
  }

  const { data: updatedRunData, error: updatedRunError } = await supabaseAdmin
    .from("broker_import_runs")
    .update({
      status: (remainingRows ?? 0) === 0 ? "completed" : "queued",
      completed_rows: run.completed_rows + processedCount,
      deduped_rows: run.deduped_rows + dedupedCount,
      finished_at: (remainingRows ?? 0) === 0 ? nowIso() : null,
      updated_at: nowIso(),
      message: null,
    })
    .eq("id", run.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updatedRunError || !updatedRunData) {
    throw new Error(updatedRunError?.message ?? "Nie udało się zaktualizować importu brokera.");
  }

  logImportEvent("run-finished", {
    runId: run.id,
    provider: run.provider,
    status: (updatedRunData as ImportRunRow).status,
    fetchedPendingMs: Math.round(fetchedPendingAt - runStartedAt),
    processedRows: processedCount,
    dedupedRows: dedupedCount,
    remainingRows: remainingRows ?? 0,
    totalMs: Math.round(performance.now() - runStartedAt),
  });

  return buildRunSummary(supabaseAdmin, updatedRunData as ImportRunRow);
}
