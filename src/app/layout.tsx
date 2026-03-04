import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

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

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-newsreader",
  display: "swap",
});

const APP_NAME = "Portfolio Tracker";
const APP_DESCRIPTION = "Śledź portfel z opóźnionymi notowaniami i przeliczeniem walut.";

const getMetadataBase = () => {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pl_PL",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Props) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${ibmPlexMono.variable} ${newsreader.variable} ${geistSans.variable} ${geistMono.variable}`}
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
        <NuqsAdapter>
          <Suspense fallback={null}>{children}</Suspense>
        </NuqsAdapter>
      </body>
    </html>
  );
}
