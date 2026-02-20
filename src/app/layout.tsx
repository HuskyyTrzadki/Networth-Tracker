import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";

import "./globals.css";

type Props = Readonly<{
  children: React.ReactNode;
}>;

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio Tracker",
  description: "Śledź portfel z opóźnionymi notowaniami i przeliczeniem walut.",
};

export default function RootLayout({ children }: Props) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${ibmPlexMono.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
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
