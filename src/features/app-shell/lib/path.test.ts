import { describe, expect, it } from "vitest";

import {
  getPortfolioIdFromPathname,
  isHrefActive,
  normalizeAppPath,
} from "./path";

describe("normalizeAppPath", () => {
  it("adds a leading slash", () => {
    expect(normalizeAppPath("search")).toBe("/search");
  });

  it("removes trailing slashes", () => {
    expect(normalizeAppPath("/transactions/")).toBe("/transactions");
  });

  it("normalizes empty to root", () => {
    expect(normalizeAppPath("")).toBe("/");
  });
});

describe("isHrefActive", () => {
  it("matches exact route", () => {
    expect(isHrefActive("/transactions", "/transactions")).toBe(true);
  });

  it("matches nested routes", () => {
    expect(isHrefActive("/transactions/new", "/transactions")).toBe(true);
  });

  it("does not match siblings", () => {
    expect(isHrefActive("/transactions-archive", "/transactions")).toBe(false);
  });

  it("treats root as exact match only", () => {
    expect(isHrefActive("/search", "/")).toBe(false);
    expect(isHrefActive("/", "/")).toBe(true);
  });
});

describe("getPortfolioIdFromPathname", () => {
  it("returns null for aggregate route", () => {
    expect(getPortfolioIdFromPathname("/portfolio")).toBeNull();
  });

  it("returns portfolio id for detail route", () => {
    expect(getPortfolioIdFromPathname("/portfolio/abc-123")).toBe("abc-123");
  });

  it("returns null outside portfolio routes", () => {
    expect(getPortfolioIdFromPathname("/transactions")).toBeNull();
  });
});
