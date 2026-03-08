// @vitest-environment node

import { describe, expect, it } from "vitest";

import { __test__ } from "./preview-xtb-import";

describe("buildLabelQueries", () => {
  it("adds a compact variant for broker labels with separators", () => {
    expect(__test__.buildLabelQueries("Mo-Bruk")).toEqual([
      "Mo-Bruk",
      "Mo Bruk",
      "MoBruk",
    ]);
  });

  it("keeps unique variants only", () => {
    expect(__test__.buildLabelQueries("Cyber Folks")).toEqual(["Cyber Folks", "CyberFolks"]);
  });
});

describe("buildPlnTickerQueries", () => {
  it("tries GPW-style ticker variants first for short PLN broker labels", () => {
    expect(__test__.buildPlnTickerQueries("GPW", "PLN")).toEqual(["GPW.PL", "GPW.WA"]);
    expect(__test__.buildPlnTickerQueries("PGE", "PLN")).toEqual(["PGE.PL", "PGE.WA"]);
    expect(__test__.buildPlnTickerQueries("LPP", "PLN")).toEqual(["LPP.PL", "LPP.WA"]);
  });

  it("does not synthesize GPW ticker variants for non-PLN or long labels", () => {
    expect(__test__.buildPlnTickerQueries("GPW", "USD")).toEqual([]);
    expect(__test__.buildPlnTickerQueries("Cyfrowy Polsat", "PLN")).toEqual([]);
  });
});

describe("pickPreferredExactMatch", () => {
  it("prefers WSE, then NASDAQ, then NYSE among exact matches", () => {
    const result = __test__.pickPreferredExactMatch(
      [
        {
          id: "yahoo:MBK.F",
          provider: "yahoo",
          providerKey: "MBK.F",
          symbol: "MBK.F",
          ticker: "MBK",
          name: "MoBruk",
          currency: "EUR",
          exchange: "FRANKFURT",
        },
        {
          id: "yahoo:MBK.HK",
          provider: "yahoo",
          providerKey: "MBK.HK",
          symbol: "MBK.HK",
          ticker: "MBK",
          name: "MoBruk",
          currency: "HKD",
          exchange: "HKG",
        },
        {
          id: "yahoo:MBK.WA",
          provider: "yahoo",
          providerKey: "MBK.WA",
          symbol: "MBK.WA",
          ticker: "MBK",
          name: "MoBruk",
          currency: "PLN",
          exchange: "WSE",
        },
      ],
      (result) => result.name === "MoBruk",
      { accountCurrency: "PLN" }
    );

    expect(result?.providerKey).toBe("MBK.WA");
  });

  it("prefers European ETF listings over US ones on PLN imports", () => {
    const result = __test__.pickPreferredExactMatch(
      [
        {
          id: "yahoo:PHYS",
          provider: "yahoo",
          providerKey: "PHYS",
          symbol: "PHYS",
          ticker: "PHYS",
          name: "Physical Gold",
          currency: "USD",
          exchange: "NYSE MKT",
          instrumentType: "ETF",
        },
        {
          id: "yahoo:SGLN.L",
          provider: "yahoo",
          providerKey: "SGLN.L",
          symbol: "SGLN.L",
          ticker: "SGLN",
          name: "Physical Gold",
          currency: "GBP",
          exchange: "LSE",
          instrumentType: "ETF",
        },
      ],
      (result) => result.name === "Physical Gold",
      { accountCurrency: "PLN" }
    );

    expect(result?.providerKey).toBe("SGLN.L");
  });
});
