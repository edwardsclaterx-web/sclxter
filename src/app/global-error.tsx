"use client";

import { useEffect } from "react";
import { reloadOnceOnChunkError } from "@/lib/chunk-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reloadOnceOnChunkError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100%",
          background: "#050505",
          color: "#f4f4f4",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 20px",
          }}
        >
          <p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
            Something went wrong
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 32,
              height: 40,
              padding: "0 16px",
              border: 0,
              background: "#ffffff",
              color: "#050505",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
