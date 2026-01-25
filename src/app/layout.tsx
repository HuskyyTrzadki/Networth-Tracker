import type { Metadata } from "next";

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
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
