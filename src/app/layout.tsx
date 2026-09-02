import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Villa 19 — Private Villa in Mangalore | By Habbaa",
    template: "%s | Villa 19 by Habbaa",
  },
  description:
    "Villa 19 — a premium 4-bedroom private villa in Urwa, Mangalore. Private lawn, 12-guest capacity, direct booking at the best rate. By Habbaa.",
  keywords: [
    "villa mangalore",
    "luxury villa mangalore",
    "private villa mangalore",
    "4 bedroom villa mangalore",
    "villa stay karnataka",
    "group stay mangalore",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Villa 19 by Habbaa",
    title: "Villa 19 — Private Villa in Mangalore",
    description: "Premium 4-bedroom private villa in Urwa, Mangalore. Sleeps 12. Direct booking — best rate guaranteed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Villa 19 — Private Villa in Mangalore",
    description: "Premium 4-bedroom private villa in Urwa, Mangalore. Sleeps 12. Direct booking — best rate guaranteed.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
