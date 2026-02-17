import { describe, expect, it } from "vitest";

import { __test__ } from "./create-transaction";

describe("createTransaction snapshot sync helpers", () => {
  it("marks past-dated transactions as dirty", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-07", "2026-02-08")).toBe(
      true
    );
  });

  it("marks same-day transactions as dirty", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-08", "2026-02-08")).toBe(
      true
    );
  });

  it("does not mark future-dated transactions", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-09", "2026-02-08")).toBe(
      false
    );
  });
});

describe("createTransaction instrument helpers", () => {
  it("treats CURRENCY as cash instrument", () => {
    expect(__test__.resolveIsCashInstrument("yahoo", "CURRENCY")).toBe(true);
  });

  it("treats system provider as cash instrument", () => {
    expect(__test__.resolveIsCashInstrument("system", "EQUITY")).toBe(true);
  });

  it("normalizes instrument fields and provider casing", () => {
    const normalized = __test__.normalizeInstrument({
      provider: " Yahoo ",
      providerKey: " AAPL ",
      symbol: " AAPL ",
      name: " Apple Inc. ",
      currency: " usd ",
      instrumentType: "EQUITY",
      exchange: " NASDAQ ",
      region: " US ",
      logoUrl: " https://example.com/logo.png ",
    });

    expect(normalized.provider).toBe("yahoo");
    expect(normalized.providerKey).toBe("AAPL");
    expect(normalized.currency).toBe("USD");
    expect(normalized.exchange).toBe("NASDAQ");
    expect(normalized.region).toBe("US");
    expect(normalized.logoUrl).toBe("https://example.com/logo.png");
    expect(normalized.isCashInstrument).toBe(false);
  });

  it("throws when provider key is missing after normalization", () => {
    expect(() =>
      __test__.normalizeInstrument({
        provider: "yahoo",
        providerKey: "  ",
        symbol: "AAPL",
        name: "Apple Inc.",
        currency: "USD",
      })
    ).toThrow("Instrument wymaga provider_key.");
  });

  it("omits nullable logo/type fields from asset upsert payload", () => {
    const payload = __test__.buildAssetInstrumentUpsertPayload(
      {
        provider: "yahoo",
        providerKey: "AAPL",
        symbol: "AAPL",
        name: "Apple",
        currency: "USD",
        exchange: "NASDAQ",
        region: "US",
        logoUrl: null,
        instrumentType: null,
        isCashInstrument: false,
      },
      "2026-02-17T10:00:00.000Z"
    );

    expect(payload.logo_url).toBeUndefined();
    expect(payload.instrument_type).toBeUndefined();
  });

  it("includes logo/type when present in asset upsert payload", () => {
    const payload = __test__.buildAssetInstrumentUpsertPayload(
      {
        provider: "yahoo",
        providerKey: "BTC-USD",
        symbol: "BTC-USD",
        name: "Bitcoin",
        currency: "USD",
        exchange: null,
        region: null,
        logoUrl: "https://example.com/btc.png",
        instrumentType: "CRYPTOCURRENCY",
        isCashInstrument: false,
      },
      "2026-02-17T10:00:00.000Z"
    );

    expect(payload.logo_url).toBe("https://example.com/btc.png");
    expect(payload.instrument_type).toBe("CRYPTOCURRENCY");
  });
});
