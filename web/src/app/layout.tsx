import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Trocando as fontes originais pelo Inter (sans) e JetBrains Mono (mono)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Termômetro do Mercado · Fotus",
  description: "Visão panorâmica do mercado solar B2B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-500/30">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
