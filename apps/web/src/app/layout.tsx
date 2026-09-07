import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  title: {
    default: "آرالند — خانه دیجیتال کسب‌وکار شما",
    template: "%s | آرالند",
  },
  description:
    "سایت خودتان را بسازید، از گوشی مدیریت کنید و به مشتری‌ها نزدیک‌تر شوید.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
