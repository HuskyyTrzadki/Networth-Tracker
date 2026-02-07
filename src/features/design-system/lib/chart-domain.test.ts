import { describe, expect, it } from "vitest";

import { buildPaddedDomain } from "./chart-domain";

describe("buildPaddedDomain", () => {
  it("returns padded min/max for a non-flat range", () => {
    expect(
      buildPaddedDomain([100, 110], {
        paddingRatio: 0.1,
        minAbsolutePadding: 0,
      })
    ).toEqual([99, 111]);
  });

  it("returns symmetric padding for a flat range", () => {
    expect(
      buildPaddedDomain([100, 100], {
        paddingRatio: 0.1,
        minAbsolutePadding: 0,
      })
    ).toEqual([90, 110]);
  });

  it("returns null when no finite values exist", () => {
    expect(buildPaddedDomain([null, undefined])).toBeNull();
  });
});
