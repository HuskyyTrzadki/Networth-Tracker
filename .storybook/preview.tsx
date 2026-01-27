import type { Decorator, Preview } from "@storybook/react";
import { type ReactNode, useEffect } from "react";
import "../src/app/globals.css";

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

const preview: Preview = {
  decorators: [withTheme],
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
  },
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
