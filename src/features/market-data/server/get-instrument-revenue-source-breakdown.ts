import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import {
  getInstrumentRevenueBreakdown,
  type InstrumentRevenueBreakdown,
  type InstrumentRevenueBreakdownEntry,
} from "./get-instrument-revenue-breakdown";

type SupabaseServerClient = SupabaseClient<Database>;

export type InstrumentRevenueSourceBreakdownEntry = InstrumentRevenueBreakdownEntry;
export type InstrumentRevenueSourceBreakdown = InstrumentRevenueBreakdown;

export async function getInstrumentRevenueSourceBreakdown(
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<InstrumentRevenueSourceBreakdown | null> {
  return getInstrumentRevenueBreakdown(supabase, providerKey, "source");
}
