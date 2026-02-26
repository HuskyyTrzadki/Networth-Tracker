import { describe, expect, it } from "vitest";

import {
  buildLogoDevTickerCandidates,
  buildLogoDevTickerProxyUrl,
  buildLogoDevTickerRemoteUrl,
  buildLogoDevTickerRemoteUrls,
} from "./logo-dev";

describe("logo-dev helpers", () => {
  it("returns null for empty ticker input", () => {
    expect(buildLogoDevTickerProxyUrl("")).toBeNull();
    expect(buildLogoDevTickerProxyUrl("   ")).toBeNull();
    expect(buildLogoDevTickerProxyUrl(null)).toBeNull();
  });

  it("builds local proxy URL for ticker fallback", () => {
    expect(buildLogoDevTickerProxyUrl(" brk-b ")).toBe(
      "/api/public/image?ticker=BRK-B"
    );
  });

  it("builds remote logo.dev URL with token for server route", () => {
    expect(buildLogoDevTickerRemoteUrl("AAPL", "sk_test_123")).toBe(
      "https://img.logo.dev/ticker/AAPL?token=sk_test_123"
    );
  });

  it("returns null when token is missing for remote URL", () => {
    expect(buildLogoDevTickerRemoteUrl("AAPL", "")).toBeNull();
    expect(buildLogoDevTickerRemoteUrl("AAPL", null)).toBeNull();
    expect(buildLogoDevTickerRemoteUrl(" ", "sk_test_123")).toBeNull();
  });
});

describe("buildLogoDevTickerRemoteUrl", () => {
  it("encodes ticker safely", () => {
    expect(buildLogoDevTickerRemoteUrl("BRK B", "sk")).toBe(
      "https://img.logo.dev/ticker/BRKB?token=sk"
    );
  });
});

describe("buildLogoDevTickerCandidates", () => {
  it("adds base ticker fallback for exchange suffix symbols", () => {
    expect(buildLogoDevTickerCandidates("CSPX.L")).toEqual(["CSPX.L", "CSPX"]);
  });
});

describe("buildLogoDevTickerRemoteUrls", () => {
  it("builds multiple remote URL candidates when suffix exists", () => {
    expect(buildLogoDevTickerRemoteUrls("CSPX.L", "sk_test")).toEqual([
      "https://img.logo.dev/ticker/CSPX.L?token=sk_test",
      "https://img.logo.dev/ticker/CSPX?token=sk_test",
    ]);
  });
});
