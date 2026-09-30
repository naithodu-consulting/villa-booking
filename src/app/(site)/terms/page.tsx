import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getProperty } from '@/lib/data';
import { formatTime12 } from '@/lib/format';

export const metadata: Metadata = pageMetadata({
  title: 'Terms & Conditions',
  path: '/terms',
  description:
    'Booking terms for Villa 19 by Habbaa, Mangalore: payments, cancellations and refunds, house rules and the responsibilities of guests during a stay.',
});

// Bumped when the cancellation tiers changed on 2026-09-09.
const LAST_UPDATED = '9 September 2026';

export default async function TermsPage() {
  // Check-in/out times and occupancy were hardcoded here, so editing them in
  // admin silently left the Terms page stating the old figures.
  const property = await getProperty();
  const checkIn  = formatTime12(property?.check_in_time  ?? '15:00');
  const checkOut = formatTime12(property?.check_out_time ?? '11:00');
  const maxGuests = property?.max_occupancy ?? 14;

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
            Terms &amp; Conditions
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>

          <Section title="1. Booking and payment">
            <ul className="list-disc list-inside space-y-1">
              <li>Bookings are confirmed only upon full payment via Razorpay.</li>
              <li>Prices are displayed in Indian Rupees (INR) and are inclusive of all applicable taxes.</li>
              <li>A booking confirmation email will be sent to the email address provided at checkout.</li>
              <li>Villa 19 is rented as a whole property. Partial bookings are not available.</li>
            </ul>
          </Section>

          <Section id="cancellation" title="2. Cancellation and refund policy">
            <ul className="list-disc list-inside space-y-1">
              {/* These tiers are hardcoded here rather than read from
                  property_policies, so they must be kept in step with
                  00015_cancellation_boundary.sql and the homepage card.
                  The windows are exclusive: "more than 30" and "15 to 30" both
                  used to claim day 30, and read together they put day 30 at 50%
                  while every other surface put it at 90%. Day 30 pays 90%. */}
              <li><strong style={{ color: 'var(--ink)' }}>30 or more days before check-in:</strong> 90% refund.</li>
              <li><strong style={{ color: 'var(--ink)' }}>15 to 29 days before check-in:</strong> 50% refund.</li>
              <li><strong style={{ color: 'var(--ink)' }}>Under 15 days before check-in:</strong> No refund.</li>
              <li><strong style={{ color: 'var(--ink)' }}>Security deposit:</strong> A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.</li>
              <li>Refund requests must be submitted in writing to reservations@habbaa.com with your booking reference.</li>
              <li>Approved refunds will be processed to the original payment method within 7 to 10 business days.</li>
            </ul>
          </Section>

          <Section title="3. Check-in and check-out">
            <ul className="list-disc list-inside space-y-1">
              <li>Check-in time: {checkIn}. Early check-in is subject to availability and prior arrangement.</li>
              <li>Check-out time: {checkOut}. Late check-out may incur additional charges.</li>
              <li>Exact address and access instructions will be provided 24 hours before check-in.</li>
              <li>Government photo ID is mandatory at check-in for all guests.</li>
            </ul>
          </Section>

          <Section title="4. Guest conduct and property rules">
            <ul className="list-disc list-inside space-y-1">
              <li>Only registered guests may stay. Government photo ID is required at check-in for every guest, and unregistered visitors are not permitted on the premises.</li>
              <li>Maximum occupancy: {maxGuests} guests. Exceeding this limit is not permitted.</li>
              <li>Parties, loud gatherings and commercial activities are not permitted.</li>
              <li>Quiet hours are 10:00 PM to 7:00 AM. Please keep noise to a minimum and respect the neighbourhood.</li>
              <li>Smoking is prohibited inside the villa. Cleaning and restoration charges apply for violations.</li>
              <li>Pets are not permitted anywhere on the property.</li>
              <li>Guests are responsible for using the villa, furnishings and amenities responsibly, and for any damage beyond normal wear and tear.</li>
              <li>Illegal activities on the premises are strictly prohibited and will result in immediate eviction without refund.</li>
            </ul>
          </Section>

          <Section title="5. Liability">
            <p>
              Villa 19 by Habbaa and its operators are not liable for personal injury, loss, or damage to personal belongings
              during your stay, except where such liability arises from our proven negligence. Guests use all property
              facilities at their own risk.
            </p>
          </Section>

          <Section title="6. Force majeure">
            <p>
              In the event of circumstances beyond our reasonable control (natural disasters, government actions, etc.)
              that prevent a booking from proceeding, we will offer a rescheduling option or a full refund at our discretion.
            </p>
          </Section>

          <Section title="7. Governing law">
            <p>
              These terms are governed by the laws of the State of Karnataka, India. Any disputes will be subject to
              the exclusive jurisdiction of the courts of Mangalore, Karnataka.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              For any queries about these terms: <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a><br />
              Villa 19 by Habbaa, Urwa, Mangalore, Karnataka 575006
            </p>
          </Section>

          <p className="text-sm mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}>
            By completing a booking, you agree to these Terms &amp; Conditions.
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
