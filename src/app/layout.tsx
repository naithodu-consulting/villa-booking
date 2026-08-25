import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Coastal Haven Private Villa — Mangalore",
    template: "%s | Coastal Haven Villa",
  },
  description:
    "Book a luxury private villa stay in Mangalore, Karnataka. Private pool, 4 bedrooms, ocean views, direct booking — no platform fees.",
  keywords: ["villa mangalore", "luxury villa mangalore", "private pool villa mangalore", "beach villa karnataka"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Coastal Haven Villa",
    title: "Coastal Haven Private Villa — Mangalore",
    description: "Luxury 4-bedroom private villa with pool in Mangalore. Direct booking, best rates guaranteed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coastal Haven Private Villa — Mangalore",
    description: "Luxury 4-bedroom private villa with pool in Mangalore. Direct booking, best rates guaranteed.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
