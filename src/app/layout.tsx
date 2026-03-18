import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/theme-provider";
import NProgressHandler from "@/components/NProgressHandler";
import { RouteAwareToaster } from "@/components/route-aware-toaster";

export const metadata: Metadata = {
  title: "ERP",
  description: "Sistema de gestão para concessionárias",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP Oficina",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <NProgressHandler />
          </Suspense>
          {children}
          <RouteAwareToaster />
        </Providers>
      </body>
    </html>
  );
}
