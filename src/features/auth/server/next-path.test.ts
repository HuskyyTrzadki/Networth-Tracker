import { describe, expect, it } from "vitest";

import { DEFAULT_POST_AUTH_PATH, getSafeNextPath } from "./next-path";

describe("getSafeNextPath", () => {
  it("returns fallback for empty values", () => {
    expect(getSafeNextPath(null)).toBe(DEFAULT_POST_AUTH_PATH);
    expect(getSafeNextPath(undefined)).toBe(DEFAULT_POST_AUTH_PATH);
    expect(getSafeNextPath("")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("accepts a relative path", () => {
    expect(getSafeNextPath("/settings")).toBe("/settings");
    expect(getSafeNextPath("/settings")).toBe("/settings");
  });

  it("rejects suspicious paths", () => {
    expect(getSafeNextPath("https://example.com")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(getSafeNextPath("//example.com")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(getSafeNextPath("\\\\evil")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("decodes url-encoded values", () => {
    expect(getSafeNextPath("%2Fsettings")).toBe("/settings");
  });
});
