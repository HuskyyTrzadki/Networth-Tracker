import type { Decorator, Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect } from "react";

import pl from "../messages/pl.json";
import en from "../messages/en.json";
import "../src/app/globals.css";

const messagesByLocale = { pl, en } as const;

type ThemeMode = "system" | "light" | "dark";

function ThemeController({
  theme,
  children,
}: Readonly<{ theme: ThemeMode; children: ReactNode }>) {
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      root.removeAttribute("data-theme");
      return;
    }

    root.setAttribute("data-theme", theme);
  }, [theme]);

  return children;
}

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as ThemeMode | undefined;

  return (
    <ThemeController theme={theme ?? "system"}>
      <Story />
    </ThemeController>
  );
};

const withNextIntl: Decorator = (Story, context) => {
  const locale = context.globals.locale as keyof typeof messagesByLocale;
  const messages = messagesByLocale[locale] ?? messagesByLocale.pl;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Story />
    </NextIntlClientProvider>
  );
};

const preview: Preview = {
  decorators: [withTheme, withNextIntl],
  globalTypes: {
    theme: {
      description: "Preview theme",
      defaultValue: "system",
      toolbar: {
        title: "Theme",
        items: [
          { value: "system", title: "system" },
          { value: "light", title: "light" },
          { value: "dark", title: "dark" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: "UI locale",
      defaultValue: "pl",
      toolbar: {
        title: "Locale",
        items: [
          { value: "pl", title: "pl" },
          { value: "en", title: "en" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
