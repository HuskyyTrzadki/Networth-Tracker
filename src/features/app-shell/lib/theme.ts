export const THEME_STORAGE_KEY = "portfolio-theme";

export type ThemePreference = "light" | "dark";

export function isThemePreference(value: string): value is ThemePreference {
  return value === "light" || value === "dark";
}

