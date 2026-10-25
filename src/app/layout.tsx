import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import CookieConsent from "@/components/layout/CookieConsent";
import Analytics from "@/components/layout/Analytics";
import InteractionTracking from "@/components/layout/InteractionTracking";
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
    default: "Villa 19 | Private Villa in Mangalore",
    template: "%s | Villa 19 by Habbaa",
  },
  description:
    "Discover Villa 19, an exclusive private urban villa in Urwa, Mangalore. Featuring four spacious bedrooms, a private lounge, and ample parking, it offers the comfort, space, and privacy to make family getaways and group stays truly memorable.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: "Villa 19 | Private Villa in Mangalore",
    description:
      "Discover Villa 19, an exclusive private urban villa in Urwa, Mangalore. Featuring four spacious bedrooms, a private lounge, and ample parking, it offers the comfort, space, and privacy to make family getaways and group stays truly memorable.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Villa 19: Private Villa in Mangalore",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Villa 19 | Private Villa in Mangalore",
    description:
      "Discover Villa 19, an exclusive private urban villa in Urwa, Mangalore. Featuring four spacious bedrooms, a private lounge, and ample parking, it offers the comfort, space, and privacy to make family getaways and group stays truly memorable.",
    images: [`${SITE_URL}/og-image.png`],
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
        {/* Both live here rather than in (site) because /book is a real page a
            guest can link to or refresh into: mounted one level down, the
            checkout had no banner and no measurement at all. */}
        <CookieConsent />
        <Analytics />
        {/* One listener for every contact link and every FAQ on the site.
            Root level for the same reason as the two above: the links on /book
            are the whole conversion while online payment is paused. */}
        <InteractionTracking />
      </body>
    </html>
  );
}
