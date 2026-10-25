import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { CANCELLATION_TIERS, SECURITY_DEPOSIT_TERMS } from '@/lib/cancellation';


/**
 * Safety net for content staleness.
 *
 * This page is prerendered and reads live content from Supabase, so without a
 * revalidation period its only refresh path is Ooruda Villa calling
 * POST /api/revalidate. If that webhook is not wired, or CONTENT_REVALIDATE_SECRET
 * is unset (the endpoint then 503s), the page stays frozen at whatever was true
 * at build time until the next deploy: stale policies, stale FAQs, a stale
 * address. A day is the worst case rather than for ever. The webhook is still
 * the fast path and makes an edit appear at once.
 */
export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: 'Cancellation & Refund Policy',
  path: '/cancellation',
  description:
    'Cancellation and refund terms for direct bookings at Villa 19 by Habbaa, Mangalore: refund tiers, how to cancel, refund timelines, date changes, no-shows and force majeure.',
});

// Effective date of the Cancellation & Refund Policy issued by Habbaa Solutions Pvt Ltd.
const EFFECTIVE_DATE = '25 October 2026';

export default function CancellationPolicyPage() {
  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>

      <section
        className="py-8 sm:py-10"
        style={{
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>

          <p>
            This Cancellation &amp; Refund Policy (&quot;Policy&quot;) applies to bookings made directly with Villa 19 by
            Habbaa (&quot;Villa 19&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;).
          </p>
          <p>
            For bookings made through third-party platforms such as Airbnb, Booking.com, MakeMyTrip or Goibibo, the
            cancellation and refund terms displayed by the relevant platform at the time of booking will apply where they
            differ from this Policy.
          </p>

          <Section id="tiers" title="1. Cancellation by the guest">
            <p>
              For direct bookings, the following cancellation charges apply based on the time between cancellation and the
              scheduled check-in date:
            </p>
            {/* Tiers come from CANCELLATION_TIERS so this page, the Terms page and
                the homepage card cannot drift. Windows are exclusive: day 14 pays
                the top tier. */}
            <ul className="list-disc list-inside space-y-1 mt-2">
              {CANCELLATION_TIERS.map(({ when, amount }) => (
                <li key={when}>
                  <strong style={{ color: 'var(--ink)' }}>{when} check-in:</strong>{' '}
                  {amount === '0%' ? 'No refund.' : `${amount} refund.`}
                </li>
              ))}
              <li><strong style={{ color: 'var(--ink)' }}>No-show:</strong> No refund.</li>
            </ul>
            <p className="mt-3">
              <strong style={{ color: 'var(--ink)' }}>Cancellation timing.</strong> All cancellation periods are calculated
              according to Indian Standard Time (IST, UTC+5:30), based on the local time at Villa 19, Mangalore. A
              cancellation is considered received on the date and time it is successfully communicated to Villa 19 through
              the designated booking contact or, for third-party bookings, recorded by the applicable booking platform.
            </p>
          </Section>

          <Section title="2. How to cancel">
            <p>Cancellations for direct bookings must be made by contacting Villa 19 at:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Email: <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a></li>
              <li>Reservations: <a href="tel:+918050484123" style={{ color: 'var(--brass-ink)' }}>+91 80504 84123</a></li>
            </ul>
            <p className="mt-3">A cancellation will be considered effective only once it has been acknowledged by Villa 19.</p>
            <p className="mt-3">Guests should retain the cancellation acknowledgement for their records.</p>
          </Section>

          <Section title="3. Refunds">
            <ul className="list-disc list-inside space-y-1">
              <li>Refunds will be calculated based on the amount actually received by Villa 19 for the booking.</li>
              <li>Where applicable, payment gateway charges, transaction charges or other non-refundable charges may be deducted from the refund.</li>
              <li>Refunds will normally be processed to the original payment method.</li>
              <li>Approved refunds will generally be processed within 5 to 7 working days from confirmation of the cancellation and refund amount.</li>
              <li>The time taken for the refund to appear in the guest&apos;s account may depend on the payment provider or bank.</li>
            </ul>
          </Section>

          <Section title="4. Booking changes and date modifications">
            <ul className="list-disc list-inside space-y-1">
              <li>Requests to change the check-in date, check-out date or other material booking details are subject to availability and approval by Villa 19.</li>
              <li>A date-change request may be treated as a cancellation of the original booking and creation of a new booking, particularly where the requested change falls within a non-refundable cancellation period.</li>
              <li>Any difference in applicable rates, taxes or charges will be payable by the guest.</li>
              <li>Villa 19 may make reasonable exceptions at its discretion where circumstances warrant.</li>
            </ul>
          </Section>

          <Section title="5. Early departure">
            <ul className="list-disc list-inside space-y-1">
              <li>If a guest checks out earlier than the booked departure date, the unused portion of the booking will generally be non-refundable.</li>
              <li>Any exception will be at the discretion of Villa 19 and subject to the applicable booking conditions.</li>
            </ul>
          </Section>

          <Section title="6. No-show">
            <ul className="list-disc list-inside space-y-1">
              <li>If the guest does not arrive for the booked stay and has not made an approved cancellation or alternative arrangement with Villa 19, the booking will be treated as a no-show.</li>
              <li>No refund will be provided for a no-show.</li>
            </ul>
          </Section>

          <Section title="7. Cancellation by Villa 19">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 may cancel a confirmed booking where circumstances make it impossible or unsafe to provide the accommodation, or where the guest has provided materially false information or violated applicable booking or property policies.</li>
              <li>Where Villa 19 cancels a booking for reasons within its reasonable control, the guest will receive a 100% refund of the amount received for the affected booking.</li>
              <li>No additional compensation will ordinarily be payable beyond the refund of the amount received, unless required by applicable law.</li>
            </ul>
          </Section>

          <Section title="8. Force majeure and exceptional circumstances">
            <p>
              Where a booking is materially affected by circumstances beyond the reasonable control of Villa 19, including
              natural disasters, severe weather, government restrictions, civil disturbance, major utility failures, fire,
              public health emergencies or similar events, Villa 19 will make reasonable efforts to provide an appropriate
              solution.
            </p>
            <p className="mt-3">Depending on the circumstances, this may include:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Rescheduling the stay</li>
              <li>Providing a credit or alternative booking arrangement</li>
              <li>Providing a refund, in whole or in part</li>
            </ul>
            <p className="mt-3">
              The appropriate resolution will depend on the circumstances, the nature of the event and any applicable
              booking or platform terms.
            </p>
          </Section>

          <Section title="9. Promotional and special rates">
            <ul className="list-disc list-inside space-y-1">
              <li>Certain promotional, discounted, advance-purchase or other special-rate bookings may have different cancellation or refund conditions.</li>
              <li>Where different conditions apply, they will be clearly communicated or displayed at the time of booking and will take precedence over the standard cancellation terms in this Policy.</li>
            </ul>
          </Section>

          <Section title="10. Third-party booking platforms">
            <ul className="list-disc list-inside space-y-1">
              <li>For bookings made through Airbnb, Booking.com, MakeMyTrip, Goibibo or any other third-party platform, the cancellation, refund and modification terms displayed by that platform at the time of booking will apply where they differ from this Policy.</li>
              <li>Any refund for such bookings will generally be processed through the relevant booking platform.</li>
            </ul>
          </Section>

          <Section title="11. Security deposit">
            <ul className="list-disc list-inside space-y-1">
              <li>The cancellation of a booking does not affect any separate security deposit obligations.</li>
              <li>Where a security deposit has been collected, it will be handled in accordance with the applicable Villa 19 booking terms and property inspection process.</li>
              <li>{SECURITY_DEPOSIT_TERMS}</li>
            </ul>
          </Section>

          <Section title="12. Policy changes">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 may update this Policy from time to time. The version applicable to a booking will generally be the version communicated or displayed at the time the booking was confirmed.</li>
              <li>Any special cancellation terms expressly agreed with a guest or imposed by a third-party booking platform will take precedence over this general Policy where applicable.</li>
            </ul>
          </Section>

          <Section title="13. Contact">
            <p>
              Villa 19 by Habbaa<br />
              Managed by Habbaa Solutions Pvt Ltd<br />
              Property: Villa 19, Urwa Marigudi Cross Road, Urwa, Mangalore, Karnataka 575006, India<br />
              Booking &amp; Reservations: <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a><br />
              Reservations: <a href="tel:+918050484123" style={{ color: 'var(--brass-ink)' }}>+91 80504 84123</a><br />
              Registered Office: 209, Citadel Prism, PVS Kalakunj Road, Kodialbail, Mangalore 575003, Karnataka, India<br />
              CIN: U47711KA2025PTC207750<br />
              GSTIN: 29AAICH1682G1ZD
            </p>
          </Section>

          <p className="text-sm mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}>
            This Policy forms part of the Villa 19{' '}
            <Link href="/terms" style={{ color: 'var(--brass-ink)' }}>Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className={id ? 'scroll-mt-24' : undefined}>
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
