'use client';

import React from 'react';
import Script from 'next/script';

import { useConsent } from '@/lib/consent';

/**
 * Google Analytics, loaded only after the guest accepts cookies.
 *
 * Nothing is requested from Google until then: the <Script> tags are not
 * rendered at all, so declining means no third-party request is ever made,
 * which is what the banner claims and what the privacy policy states.
 *
 * Set NEXT_PUBLIC_GA_ID to the GA4 measurement ID (G-XXXXXXXXXX) to switch it
 * on. Without it this renders nothing, so the consent gate is already in place
 * and measurement begins the moment the ID is configured.
 */
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  // Unknown on the server and until hydration, so nothing is requested from
  // Google before the stored choice has actually been read.
  const granted = useConsent() === 'accepted';

  if (!gaId || !granted) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
