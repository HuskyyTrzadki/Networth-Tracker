import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/features/design-system",
              message:
                "Import design-system modules by direct file path (for predictable bundles).",
            },
            {
              name: "@/features/transactions",
              message:
                "Import transactions modules by direct file path (for predictable bundles).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/features/app-shell",
              message:
                "In src/app, import app-shell modules by direct component path.",
            },
            {
              name: "@/features/auth",
              message: "In src/app, import auth modules by direct file path.",
            },
            {
              name: "@/features/home",
              message: "In src/app, import home modules by direct file path.",
            },
            {
              name: "@/features/onboarding",
              message:
                "In src/app, import onboarding modules by direct file path.",
            },
            {
              name: "@/features/portfolio",
              message:
                "In src/app, import portfolio modules by direct file path.",
            },
            {
              name: "@/features/stocks",
              message:
                "In src/app, import stocks modules by direct file path.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
