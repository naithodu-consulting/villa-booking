import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Villa 19 by Habbaa. How we collect, use and protect your personal information.',
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '1 September 2026';

export default function PrivacyPage() {
  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>

      <section
        className="py-8 sm:py-10"
        style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Privacy Policy
          </h1>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="space-y-6 text-base leading-relaxed"
          style={{ color: 'var(--ink-muted)' }}
        >
          <Section title="1. Who we are">
            <p>
              HABBAA SOLUTIONS PVT LTD (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), CIN U47711KA2025PTC207750, trading as
              Villa 19 by Habbaa, operates the website habbaa.in and manages bookings for Villa 19, Urwa,
              Mangalore, Karnataka 575006. Our registered office is 209, Citadel Prism, PVS Kalakunj Road,
              Kodialbail, Mangalore 575003. We are the data fiduciary for the personal data described below.
              For privacy-related queries, email us at{' '}
              <a href="mailto:hello@habbaa.in" style={{ color: 'var(--brass)' }}>hello@habbaa.in</a>.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>When you make a booking or submit an enquiry, we collect:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Name, email address, and phone number</li>
              <li>Booking dates, guest count, and special requests</li>
              <li>Payment information processed securely by Razorpay. We do not store card details.</li>
              <li>Device and browser information for analytics (no personally identifiable data)</li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            <ul className="list-disc list-inside space-y-1">
              <li>To confirm and manage your booking</li>
              <li>To send booking confirmation, check-in instructions, and refund notifications</li>
              <li>To respond to your enquiries</li>
              <li>To improve our services</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </Section>

          <Section title="4. WhatsApp and messaging">
            <p>
              WhatsApp is our main enquiry and support channel. If you contact us there, your phone number,
              WhatsApp profile name and message content are processed by WhatsApp Ireland Ltd (part of Meta)
              under their own privacy policy, and are visible to us in the chat. We use that information only
              to answer your enquiry and manage your booking. If you would rather not use WhatsApp, email or
              call us instead and we will not contact you there.
            </p>
          </Section>

          <Section title="5. Payment processing">
            <p>
              Payments are processed by Razorpay (razorpay.com). Your payment details are transmitted directly to Razorpay over
              an encrypted connection and are governed by their privacy policy. We store only the Razorpay order and payment IDs
              for bookkeeping purposes.
            </p>
          </Section>

          <Section title="6. Data retention">
            <p>
              We retain booking records for a minimum of 3 years as required by applicable tax and accounting regulations.
              Enquiry records are retained for 12 months. You may request deletion of your personal data by emailing us,
              subject to our legal obligations.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use essential cookies required for the website to function (session state, security tokens).
              These are always active because the site cannot work without them.
            </p>
            <p className="mt-3">
              We also use Google Analytics to understand how the site is used. Analytics cookies are loaded
              only if you accept them in the cookie banner. If you decline, no analytics script is loaded and
              no request is made to Google. We do not use advertising or ad-targeting cookies. You can change
              your choice at any time by clearing this site&apos;s data in your browser.
            </p>
          </Section>

          <Section title="8. Your rights">
            <p>Under applicable Indian data protection law, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data (subject to legal obligations)</li>
              <li>Withdraw consent where processing is consent-based</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:hello@habbaa.in" style={{ color: 'var(--brass)' }}>hello@habbaa.in</a>.</p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this policy from time to time. The &quot;Last updated&quot; date at the top of this page will reflect
              any changes. Continued use of our website after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For any privacy-related concerns: <a href="mailto:hello@habbaa.in" style={{ color: 'var(--brass)' }}>hello@habbaa.in</a><br />
              HABBAA SOLUTIONS PVT LTD, 209, Citadel Prism, PVS Kalakunj Road, Kodialbail, Mangalore 575003
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-xl sm:text-2xl font-bold mb-3"
        style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
