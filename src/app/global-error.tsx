"use client";

import { useEffect } from "react";
import Link from "next/link";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
          background: "rgb(250 249 247)",
          color: "rgb(20 20 20)",
          minHeight: "100dvh",
        }}
      >
        <main
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: "32px",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "560px",
              border: "1px solid rgb(219 214 206)",
              borderRadius: "14px",
              background: "white",
              padding: "24px",
              boxSizing: "border-box",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "26px", lineHeight: 1.2 }}>
              Coś poszło nie tak
            </h1>
            <p style={{ margin: "10px 0 0", color: "rgb(87 83 78)", lineHeight: 1.45 }}>
              Wystąpił nieoczekiwany błąd aplikacji. Odśwież widok albo spróbuj ponownie.
            </p>
            <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  border: "1px solid rgb(28 25 23)",
                  background: "rgb(28 25 23)",
                  color: "white",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Spróbuj ponownie
              </button>
              <Link
                href="/"
                style={{
                  border: "1px solid rgb(214 211 209)",
                  background: "white",
                  color: "rgb(28 25 23)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Wróć na start
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
