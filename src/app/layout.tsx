import type { Metadata } from "next";
import { Nunito_Sans, Cormorant_Garamond, Cinzel } from "next/font/google";
import { SITE_URL, SITE_NAME, DEFAULT_SHARE_IMAGE } from "@/lib/seo";
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
