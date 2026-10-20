import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_URL, SITE_NAME, DEFAULT_SHARE_IMAGE } from "@/lib/seo";
import "./globals.css";

const nunitoSans = localFont({
  src: "../../public/fonts/NunitoSans.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 1000",
});

const cormorant = localFont({
  src: "../../public/fonts/CormorantGaramond-Regular.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
});

const cinzel = localFont({
  src: "../../public/fonts/Cinzel.woff2",
  variable: "--font-brand",
  display: "swap",
  weight: "400 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Villa19 | Private Urban Villa",
    template: "%s | Villa 19 by Habbaa",
  },
  description:
    "Villa 19: Premium 4-Bedroom Private Urban Villa in Mangalore. Private lawn, up to 14 guests, direct booking at the best rate. By Habbaa.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: "Villa 19 | Private Villa in Mangalore",
    description: "Premium 4-Bedroom Private Urban Villa. Sleeps 12. Direct booking at the best rate.",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Villa 19 | Private Villa in Mangalore",
    description: "Premium 4-Bedroom Private Urban Villa. Sleeps 12. Direct booking at the best rate.",
    images: [DEFAULT_SHARE_IMAGE.url],
  },
  robots: { index: true, follow: true },
  // Set in Vercel once Search Console and Bing Webmaster Tools are verified.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${cormorant.variable} ${cinzel.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        {/* First focusable thing on every page. Targets the <main> rendered by
            each route group's layout. */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
