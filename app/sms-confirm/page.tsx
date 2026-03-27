"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SmsConfirmInner() {
  const params  = useSearchParams();
  const phones  = params.get("phones") || "";
  const message = params.get("message") || "";

  useEffect(() => {
    if (phones && message) {
      window.location.href = `sms:${phones}?body=${encodeURIComponent(message)}`;
    }
  }, [phones, message]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0a0a0f", color: "#f0f0f8", fontFamily: "sans-serif", padding: 20,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
      <h2 style={{ marginBottom: 8 }}>SMS ilovasi ochilmoqda...</h2>
      <p style={{ color: "#7070a0", fontSize: 14 }}>Agar ochilmasa, quyidagi tugmani bosing</p>
      <a href={`sms:${phones}?body=${encodeURIComponent(message)}`} style={{
        marginTop: 20, padding: "14px 28px", background: "#6c63ff",
        color: "white", borderRadius: 12, textDecoration: "none",
        fontWeight: 700, fontSize: 16,
      }}>SMS Yuborish</a>
    </div>
  );
}

export default function SmsConfirmPage() {
  return (
    <Suspense>
      <SmsConfirmInner />
    </Suspense>
  );
}
