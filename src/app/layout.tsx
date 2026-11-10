import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { BluetoothProvider } from "@/contexts/BluetoothContext";
import ConnectionStatus from "@/components/ConnectionStatus";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Community edition — self-hosted tyre inspection and fleet logistics for small fleets. MIT licensed. Clone it, point it at a free Supabase project, and it runs.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Zuri LMS",
  title: {
    default: "Zuri LMS — Tyre Inspection & Fleet Logistics, Open Source",
    template: "%s · Zuri LMS",
  },
  description: DESCRIPTION,
  keywords: [
    "tyre inspection",
    "fleet logistics",
    "small fleet",
    "depot management",
    "scrap tracking",
    "open source",
    "self-hosted",
    "Supabase",
    "Next.js",
    "MIT license",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Zuri LMS",
    title: "Zuri LMS — Tyre Inspection & Fleet Logistics, Open Source",
    description: DESCRIPTION,
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zuri LMS — Tyre Inspection & Fleet Logistics, Open Source",
    description: DESCRIPTION,
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = {
  themeColor: "#724b1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConnectionProvider>
          <BluetoothProvider>
            <ConnectionStatus />
            <AuthProvider>{children}</AuthProvider>
          </BluetoothProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
