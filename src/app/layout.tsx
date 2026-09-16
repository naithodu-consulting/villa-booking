import type { Metadata } from "next";
import { Nunito_Sans, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Villa 19 | Private Villa in Mangalore by Habbaa",
    template: "%s | Villa 19 by Habbaa",
  },
  description:
    "Villa 19 is a premium 4-bedroom private villa in Urwa, Mangalore. Private lawn, 12-guest capacity, direct booking at the best rate. By Habbaa.",
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
    title: "Villa 19 | Private Villa in Mangalore",
    description: "Premium 4-bedroom private villa in Urwa, Mangalore. Sleeps 12. Direct booking at the best rate.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Villa 19 | Private Villa in Mangalore",
    description: "Premium 4-bedroom private villa in Urwa, Mangalore. Sleeps 12. Direct booking at the best rate.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${cormorant.variable} ${cinzel.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
