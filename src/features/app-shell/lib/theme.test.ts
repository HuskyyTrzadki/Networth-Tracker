import { describe, expect, it } from "vitest";

import { isThemePreference, THEME_STORAGE_KEY } from "./theme";

describe("theme", () => {
  it("uses a stable storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("portfolio-theme");
  });

  it("accepts only supported values", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(false);
    expect(isThemePreference("")).toBe(false);
  });
});

