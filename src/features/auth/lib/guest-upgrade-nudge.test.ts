import { describe, expect, it } from "vitest";

import { resolveGuestUpgradeBanner } from "./guest-upgrade-nudge";

describe("resolveGuestUpgradeBanner", () => {
  it("returns no banner below the first threshold", () => {
    expect(
      resolveGuestUpgradeBanner({
        transactionCount: 5,
        dismissedStep5At: null,
        dismissedStep15At: null,
      })
    ).toBeNull();
  });

  it("returns the first banner after five transactions", () => {
    expect(
      resolveGuestUpgradeBanner({
        transactionCount: 6,
        dismissedStep5At: null,
        dismissedStep15At: null,
      })
    ).toMatchObject({ step: 5 });
  });

  it("returns the stronger second banner after fifteen transactions", () => {
    expect(
      resolveGuestUpgradeBanner({
        transactionCount: 16,
        dismissedStep5At: null,
        dismissedStep15At: null,
      })
    ).toMatchObject({ step: 15 });
  });

  it("skips a dismissed first banner", () => {
    expect(
      resolveGuestUpgradeBanner({
        transactionCount: 10,
        dismissedStep5At: "2026-02-28T12:00:00.000Z",
        dismissedStep15At: null,
      })
    ).toBeNull();
  });

  it("still shows the second banner even if the first was dismissed", () => {
    expect(
      resolveGuestUpgradeBanner({
        transactionCount: 20,
        dismissedStep5At: "2026-02-28T12:00:00.000Z",
        dismissedStep15At: null,
      })
    ).toMatchObject({ step: 15 });
  });

  it("returns no banner after the second banner is dismissed", () => {
    expect(
      resolveGuestUpgradeBanner({
        transactionCount: 20,
        dismissedStep5At: null,
        dismissedStep15At: "2026-02-28T12:00:00.000Z",
      })
    ).toBeNull();
  });
});
