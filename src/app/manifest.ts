import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portfolio Tracker",
    short_name: "Portfolio",
    description: "Śledź portfel z opóźnionymi notowaniami i przeliczeniem walut.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f4",
    theme_color: "#111111",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
