import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addLocalDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const now = new Date();
const nowIso = now.toISOString();
const today = toIsoDate(now);
const yesterday = toIsoDate(addLocalDays(now, -1));

const deterministicInstruments = [
  {
    provider: "yahoo",
    provider_key: "E2E-FLAT-USD",
    symbol: "E2EF",
    name: "E2E Flat USD",
    currency: "USD",
    exchange: "E2E",
    region: "US",
    instrument_type: "EQUITY",
    updated_at: nowIso,
  },
  {
    provider: "yahoo",
    provider_key: "E2E-RISE-USD",
    symbol: "E2ER",
    name: "E2E Rise USD",
    currency: "USD",
    exchange: "E2E",
    region: "US",
    instrument_type: "EQUITY",
    updated_at: nowIso,
  },
];

const { error: instrumentUpsertError } = await supabase
  .from("instruments")
  .upsert(deterministicInstruments, {
    onConflict: "provider,provider_key",
  });

if (instrumentUpsertError) {
  throw new Error(`Failed to seed instruments: ${instrumentUpsertError.message}`);
}

const instrumentKeys = deterministicInstruments.map((row) => row.provider_key);
const { data: instrumentRows, error: instrumentReadError } = await supabase
  .from("instruments")
  .select("id, provider_key")
  .eq("provider", "yahoo")
  .in("provider_key", instrumentKeys);

if (instrumentReadError) {
  throw new Error(`Failed to read seeded instruments: ${instrumentReadError.message}`);
}

const instrumentIdByKey = new Map(
  (instrumentRows ?? []).map((row) => [row.provider_key, row.id])
);

for (const key of instrumentKeys) {
  if (!instrumentIdByKey.has(key)) {
    throw new Error(`Missing instrument id after seeding for key: ${key}`);
  }
}

const quoteRows = [
  {
    instrument_id: instrumentIdByKey.get("E2E-FLAT-USD"),
    provider: "yahoo",
    provider_key: "E2E-FLAT-USD",
    currency: "USD",
    price: 100,
    day_change: 0,
    day_change_percent: 0,
    as_of: nowIso,
    fetched_at: nowIso,
  },
  {
    instrument_id: instrumentIdByKey.get("E2E-RISE-USD"),
    provider: "yahoo",
    provider_key: "E2E-RISE-USD",
    currency: "USD",
    price: 120,
    day_change: 20,
    day_change_percent: 0.2,
    as_of: nowIso,
    fetched_at: nowIso,
  },
];

const { error: quoteUpsertError } = await supabase
  .from("instrument_quotes_cache")
  .upsert(quoteRows, {
    onConflict: "provider,instrument_id",
  });

if (quoteUpsertError) {
  throw new Error(`Failed to seed quote cache: ${quoteUpsertError.message}`);
}

const dailyRows = [
  {
    provider: "yahoo",
    provider_key: "E2E-FLAT-USD",
    price_date: yesterday,
    exchange_timezone: "America/New_York",
    currency: "USD",
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    adj_close: 100,
    volume: 1_000,
    as_of: `${yesterday}T21:00:00.000Z`,
    fetched_at: nowIso,
  },
  {
    provider: "yahoo",
    provider_key: "E2E-FLAT-USD",
    price_date: today,
    exchange_timezone: "America/New_York",
    currency: "USD",
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    adj_close: 100,
    volume: 1_000,
    as_of: `${today}T21:00:00.000Z`,
    fetched_at: nowIso,
  },
  {
    provider: "yahoo",
    provider_key: "E2E-RISE-USD",
    price_date: yesterday,
    exchange_timezone: "America/New_York",
    currency: "USD",
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    adj_close: 100,
    volume: 1_000,
    as_of: `${yesterday}T21:00:00.000Z`,
    fetched_at: nowIso,
  },
  {
    provider: "yahoo",
    provider_key: "E2E-RISE-USD",
    price_date: today,
    exchange_timezone: "America/New_York",
    currency: "USD",
    open: 120,
    high: 120,
    low: 120,
    close: 120,
    adj_close: 120,
    volume: 1_000,
    as_of: `${today}T21:00:00.000Z`,
    fetched_at: nowIso,
  },
];

const { error: dailyUpsertError } = await supabase
  .from("instrument_daily_prices_cache")
  .upsert(dailyRows, {
    onConflict: "provider,provider_key,price_date",
  });

if (dailyUpsertError) {
  throw new Error(`Failed to seed daily prices cache: ${dailyUpsertError.message}`);
}

const fxPairs = [
  { from: "USD", to: "PLN", rate: 4 },
  { from: "PLN", to: "USD", rate: 0.25 },
  { from: "USD", to: "EUR", rate: 0.9 },
  { from: "EUR", to: "USD", rate: 1.111111 },
  { from: "PLN", to: "EUR", rate: 0.225 },
  { from: "EUR", to: "PLN", rate: 4.444444 },
];

const fxRatesRows = fxPairs.map((pair) => ({
  provider: "yahoo",
  base_currency: pair.from,
  quote_currency: pair.to,
  rate: pair.rate,
  as_of: nowIso,
  fetched_at: nowIso,
}));

const { error: fxRatesUpsertError } = await supabase
  .from("fx_rates_cache")
  .upsert(fxRatesRows, {
    onConflict: "provider,base_currency,quote_currency",
  });

if (fxRatesUpsertError) {
  throw new Error(`Failed to seed fx rates cache: ${fxRatesUpsertError.message}`);
}

const fxDailyRows = [yesterday, today].flatMap((rateDate) =>
  fxPairs.map((pair) => ({
    provider: "yahoo",
    base_currency: pair.from,
    quote_currency: pair.to,
    rate_date: rateDate,
    rate: pair.rate,
    source_timezone: "Europe/Warsaw",
    as_of: `${rateDate}T21:00:00.000Z`,
    fetched_at: nowIso,
  }))
);

const { error: fxDailyUpsertError } = await supabase
  .from("fx_daily_rates_cache")
  .upsert(fxDailyRows, {
    onConflict: "provider,base_currency,quote_currency,rate_date",
  });

if (fxDailyUpsertError) {
  throw new Error(`Failed to seed fx daily rates cache: ${fxDailyUpsertError.message}`);
}

console.log("[e2e-seed] Deterministic market/FX fixtures seeded.");
console.log(
  `[e2e-seed] Instruments: ${instrumentKeys.join(", ")} | Dates: ${yesterday}, ${today}`
);
