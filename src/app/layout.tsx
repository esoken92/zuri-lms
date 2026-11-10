import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { BluetoothProvider } from "@/contexts/BluetoothContext";
import ConnectionStatus from "@/components/ConnectionStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zuri LMS",
  description:
    "Community edition — self-hosted tyre inspection and fleet logistics for small fleets. MIT licensed.",
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
