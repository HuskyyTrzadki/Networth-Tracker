import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";

import "./globals.css";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export const metadata: Metadata = {
  title: "Portfolio Tracker",
  description: "Śledź portfel z opóźnionymi notowaniami i przeliczeniem walut.",
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="theme-preference-init" strategy="beforeInteractive">
          {`(() => {
            try {
              const key = "portfolio-theme";
              const stored = window.localStorage.getItem(key);
              const isStoredTheme = stored === "light" || stored === "dark";
              if (isStoredTheme) {
                document.documentElement.dataset.theme = stored;
              }
            } catch {
              // Ignore read failures and keep CSS default/fallback behavior.
            }
          })();`}
        </Script>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
