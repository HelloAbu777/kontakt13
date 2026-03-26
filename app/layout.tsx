import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMS Yuboruvchi",
  description: "Kontaktlarga bir vaqtda SMS yuborish",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
