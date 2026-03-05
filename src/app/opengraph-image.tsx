import { ImageResponse } from "next/og";

export const alt = "Portfolio Tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, rgb(12 14 20) 0%, rgb(24 38 64) 55%, rgb(191 132 75) 100%)",
          color: "rgb(248 248 246)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "920px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Portfolio Tracker
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              opacity: 0.92,
              letterSpacing: "-0.01em",
            }}
          >
            Sledz portfel, kontroluj wyniki, porownuj waluty.
          </div>
        </div>
      </div>
    ),
    size
  );
}
