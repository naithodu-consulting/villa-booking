import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  path: '/privacy',
  description:
    'How Villa 19 by Habbaa collects, uses and protects your personal information when you enquire, book or stay with us, and the choices you have about it.',
});

const LAST_UPDATED = '23 September 2026';

export default function PrivacyPage() {
  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>

      <section
        className="py-8 sm:py-10"
        style={{
          backgroundColor: 'var(--paper-sunk)',
          color: 'var(--ink)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            Privacy Policy
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Last updated: {LAST_UPDATED}</p>
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
              <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a>.
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
            <p className="mt-3">
              <strong>Guest ID documents.</strong> Local regulations require us to see government photo ID for every
              adult guest. We accept Aadhaar (a masked copy, showing only the last four digits, is enough), passport or
              driving licence. After you book, you can send photos of these on WhatsApp using the link on your booking
              page. This website does not upload or store ID documents. They are seen only by our staff on WhatsApp,
              used only to register your stay, and never shared except where the law requires it. Please do not send
              ID documents by email.
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
              We do not use advertising or ad-targeting cookies. You can change your cookie preferences at
              any time by clearing this site&apos;s data in your browser.
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
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a>.</p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this policy from time to time. The &quot;Last updated&quot; date at the top of this page will reflect
              any changes. Continued use of our website after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For any privacy-related concerns: <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a><br />
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
