"use client";
import { useEffect } from "react";
export default function PublicSiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    document.title = "ارتباط با سایت برقرار نشد";
  }, []);
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f5f4ee",
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <span
          style={{
            display: "block",
            fontSize: 42,
            color: "#8d9b78",
            marginBottom: 20,
          }}
        >
          ↻
        </span>
        <h1 style={{ fontSize: 27, color: "#284c3e" }}>
          کمی بعد دوباره سر بزنید
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 2,
            color: "#73826c",
            margin: "16px 0 25px",
          }}
        >
          ارتباط با سرویس سایت موقتاً برقرار نیست. لطفاً دوباره تلاش کنید.
        </p>
        <button className="btn btn-primary" onClick={() => reset()}>
          تلاش دوباره
        </button>
      </div>
    </main>
  );
}
