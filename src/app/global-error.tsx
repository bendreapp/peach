"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ backgroundColor: "#FCFCFA", fontFamily: "Satoshi, sans-serif", margin: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 style={{ color: "#111", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#888", marginBottom: 24, textAlign: "center", maxWidth: 400, fontSize: 14 }}>
            We encountered an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: "10px 24px", backgroundColor: "#6B7E6C", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
