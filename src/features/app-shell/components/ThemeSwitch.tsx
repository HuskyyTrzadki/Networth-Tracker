"use client";

import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { Switch } from "@/features/design-system/components/ui/switch";
import { cn } from "@/lib/cn";

import {
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "../lib/theme";

type Props = Readonly<{
  className?: string;
}>;

function getInitialTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme && isThemePreference(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeSwitch({ className }: Props) {
  // Keep SSR and the first client render deterministic to avoid hydration mismatches.
  // The real preference is resolved after mount from localStorage or system setting.
  const [theme, setTheme] = React.useState<ThemePreference>("light");
  const skipFirstPersistRef = React.useRef(true);

  React.useEffect(() => {
    const domTheme = document.documentElement.dataset.theme;
    const resolved =
      domTheme && isThemePreference(domTheme) ? domTheme : getInitialTheme();

    applyTheme(resolved);
    setTheme(resolved);
  }, []);

  React.useEffect(() => {
    // The first run uses the SSR-stable "light" value; persisting it would overwrite
    // a stored "dark" preference before we resolve it on mount.
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return;
    }

    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-sidebar-border/80 bg-sidebar-accent/20 px-3 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-md border border-sidebar-border bg-sidebar">
          {theme === "dark" ? (
            <Moon className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <Sun className="size-4 text-primary" aria-hidden="true" />
          )}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-sidebar-foreground">Motyw</p>
          <p className="text-xs text-sidebar-foreground/65">
            {theme === "dark" ? "Ciemny" : "Jasny"}
          </p>
        </div>
      </div>

      <Switch
        checked={theme === "dark"}
        onCheckedChange={(checked) => {
          setTheme(checked ? "dark" : "light");
        }}
        aria-label="Przełącz motyw"
      />
    </div>
  );
}
