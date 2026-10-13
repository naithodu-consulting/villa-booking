import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { getProperty } from '@/lib/data';
import { formatTime12 } from '@/lib/format';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Service',
  path: '/terms',
  description:
    'Terms of Service for Villa 19 by Habbaa, Mangalore: booking and payment, occupancy, check-in and check-out, house rules, damages and the responsibilities of guests during a stay.',
});

// Effective date of the Terms of Service issued by Habbaa Solutions Pvt Ltd.
const EFFECTIVE_DATE = '7 October 2026';

export default async function TermsPage() {
  // Check-in/out times and occupancy were hardcoded here, so editing them in
  // admin silently left the Terms page stating the old figures.
  const property = await getProperty();
  const checkIn  = formatTime12(property?.check_in_time  ?? '14:00');
  const checkOut = formatTime12(property?.check_out_time ?? '10:00');
  const maxGuests = property?.max_occupancy ?? 14;

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
            Terms of Service
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>

          <p>
            These Terms of Service (&quot;Terms&quot;) govern the use of Villa 19, a private accommodation property in
            Urwa, Mangalore, and the booking and stay services provided in connection with it. Villa 19 is managed by
            Habbaa Solutions Pvt Ltd (&quot;Habbaa&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;).
          </p>
          <p>
            By making a booking, making payment, accessing the property, or staying at Villa 19, the person making the
            booking (&quot;Guest&quot; or &quot;you&quot;) confirms that they have read, understood and agreed to these
            Terms, the applicable Villa 19 house rules, and the applicable booking and cancellation policies.
          </p>

          <Section title="1. Booking and confirmation">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 is offered exclusively as a private whole-villa accommodation. Individual bedrooms are not available for separate booking.</li>
              <li>A booking is confirmed only after the required booking information and payment have been received and confirmation has been issued by Villa 19 or the applicable booking platform.</li>
              <li>The person making the booking is responsible for providing accurate information, including the number and details of all guests.</li>
              <li>The person making the booking must be authorised to make the reservation and accept these Terms on behalf of all guests staying at the property.</li>
              <li>Habbaa reserves the right to decline or cancel a booking where the information provided is inaccurate, incomplete, misleading, or inconsistent with the intended use of the property.</li>
            </ul>
          </Section>

          <Section title="2. Guest eligibility and registration">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 is primarily intended for families and family groups. Stays by unmarried couples are not encouraged.</li>
              <li>All guests must comply with the property&apos;s guest registration requirements.</li>
              <li>Valid government-issued photo identification may be required from all registered guests at check-in.</li>
              <li>The guest details provided at the time of booking or check-in must accurately represent the persons staying at the property.</li>
              <li>Unregistered guests are not permitted to stay at the property.</li>
              <li>Habbaa reserves the right to decline accommodation where guest information, identification or the stated purpose of the booking is inconsistent with the booking or applicable property policies.</li>
            </ul>
          </Section>

          <Section title="3. Occupancy and sleeping arrangements">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 has four guest bedrooms and is designed to comfortably accommodate eight guests.</li>
              <li>The villa can accommodate additional guests using mattresses in select bedrooms and the lounge, up to the property&apos;s maximum occupancy of {maxGuests} guests.</li>
              <li>The dedicated driver room is separate from the guest accommodation and is not included in the maximum guest occupancy.</li>
              <li>Guests must not exceed the confirmed occupancy for their booking without prior approval from Habbaa.</li>
              <li>Habbaa may require additional charges where applicable for occupancy beyond the base number of guests.</li>
            </ul>
          </Section>

          <Section title="4. Rates and charges">
            <ul className="list-disc list-inside space-y-1">
              <li>Applicable rates are displayed during the booking process or communicated to the guest.</li>
              <li>Rates may vary depending on dates, demand, season, length of stay, occupancy and other applicable booking conditions.</li>
              <li>Additional charges may apply for additional guests, special services, damages, excessive cleaning or other charges communicated to the guest.</li>
              <li>Any applicable taxes or statutory charges will be displayed or communicated as part of the booking process.</li>
            </ul>
          </Section>

          <Section title="5. Payment">
            <ul className="list-disc list-inside space-y-1">
              <li>Bookings are subject to payment of the amount specified at the time of booking.</li>
              <li>Payments may be processed directly by Villa 19 or through a third-party booking platform or payment service provider.</li>
              <li>A booking is not considered confirmed until the required payment and confirmation requirements have been completed.</li>
              <li>Where a refundable security deposit is applicable, it will be collected in accordance with the booking conditions.</li>
            </ul>
          </Section>

          <Section id="cancellation" title="6. Cancellation and refunds">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Cancellations and refunds are governed by the Villa 19{' '}
                <Link href="/cancellation" style={{ color: 'var(--brass-ink)' }}>Cancellation &amp; Refund Policy</Link>,
                as applicable to the booking.
              </li>
              <li>The applicable cancellation policy may vary depending on the booking channel, rate plan, promotional offer or other booking conditions.</li>
              <li>For bookings made through third-party platforms, the cancellation and refund terms of the relevant platform may also apply.</li>
              <li>The Cancellation &amp; Refund Policy forms part of these Terms.</li>
            </ul>
          </Section>

          <Section title="7. Booking changes">
            <ul className="list-disc list-inside space-y-1">
              <li>Requests to modify booking dates, guest numbers or other booking details may be considered at the discretion of Habbaa, subject to availability and the applicable booking and cancellation policy.</li>
              <li>Any additional charges arising from an approved change will be payable by the guest.</li>
              <li>A requested change is not confirmed until it has been accepted by Habbaa or the applicable booking platform.</li>
            </ul>
          </Section>

          <Section title="8. No-show">
            <ul className="list-disc list-inside space-y-1">
              <li>If the guest does not arrive for the booked stay and no prior arrangement has been made with Habbaa, the booking will be treated as a no-show.</li>
              <li>In the event of a no-show, the full booking amount will be forfeited, subject to any overriding terms of the booking platform or applicable law.</li>
            </ul>
          </Section>

          <Section title="9. Check-in and check-out">
            <ul className="list-disc list-inside space-y-1">
              <li>Standard check-in time is {checkIn}.</li>
              <li>Standard check-out time is {checkOut}.</li>
              <li>Early check-in or late check-out may be considered subject to availability and may attract additional charges.</li>
              <li>Guests must complete the required registration and verification process at check-in.</li>
              <li>Guests must vacate the property by the designated check-out time unless a late check-out has been expressly approved.</li>
              <li>Unauthorised late departure may result in additional charges.</li>
            </ul>
          </Section>

          <Section title="10. Guest conduct and house rules">
            <ul className="list-disc list-inside space-y-1">
              <li>Guests are expected to use the property responsibly and respect the comfort, safety and privacy of neighbours, staff and other persons.</li>
              <li>Only registered guests may stay at the property.</li>
              <li>Outside visitors are not permitted without prior approval.</li>
              <li>Parties, events and loud gatherings are not permitted.</li>
              <li>Quiet hours are 10:00 PM to 7:00 AM.</li>
              <li>Smoking is not permitted inside the villa, including bedrooms and bathrooms.</li>
              <li>Pets are not permitted.</li>
              <li>Guests must not engage in unlawful, dangerous or disruptive activities.</li>
              <li>Guests must use the villa, furnishings, appliances and amenities responsibly.</li>
              <li>Commercial activities, filming or other activities that materially alter the normal use of the property require prior approval from Habbaa.</li>
              <li>Guests are also expected to comply with any additional house rules communicated during check-in or displayed at the property.</li>
            </ul>
          </Section>

          <Section title="11. Parties, events and gatherings">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 is intended for private residential-style stays and relaxed family and group accommodation.</li>
              <li>Parties, events, functions, commercial activities and loud gatherings are not permitted, regardless of the number of guests included in the booking.</li>
              <li>Any unauthorised party or event may result in immediate termination of the stay without refund.</li>
            </ul>
          </Section>

          <Section title="12. Smoking">
            <ul className="list-disc list-inside space-y-1">
              <li>Smoking is not permitted anywhere inside the villa, including bedrooms, bathrooms and indoor common areas.</li>
              <li>Where smoking is permitted in designated outdoor areas, guests must dispose of cigarette waste responsibly.</li>
              <li>Cleaning and restoration charges may apply for violations.</li>
            </ul>
          </Section>

          <Section title="13. Pets">
            <p>Pets are not permitted anywhere on the Villa 19 property unless expressly approved by Habbaa in writing in advance.</p>
          </Section>

          <Section title="14. Property damage and security deposit">
            <ul className="list-disc list-inside space-y-1">
              <li>Guests are responsible for taking reasonable care of the property, furniture, fixtures, appliances, equipment and other belongings provided for their use.</li>
              <li>Guests may be charged for damage, loss, breakage, missing items, misuse or excessive cleaning resulting from their stay or the actions of their accompanying guests.</li>
              <li>Where a security deposit has been collected, applicable deductions may be made for such charges.</li>
              <li>Subject to property inspection following check-out, the refundable security deposit will be processed within 5 working days and returned to the original payment method, after deduction of any applicable amounts.</li>
              <li>Where the cost of damage or loss exceeds the security deposit, Habbaa reserves the right to recover the additional amount from the responsible guest.</li>
            </ul>
          </Section>

          <Section title="15. Driver accommodation">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 provides a dedicated driver room with an attached bathroom.</li>
              <li>The driver room is separate from the guest accommodation and is intended for driver or staff accommodation.</li>
              <li>Use of the driver room does not form part of the guest occupancy stated for the villa.</li>
            </ul>
          </Section>

          <Section title="16. Use of amenities">
            <ul className="list-disc list-inside space-y-1">
              <li>Guests may use the amenities and facilities provided at Villa 19 for their intended purposes.</li>
              <li>Guests must follow any operating instructions or safety instructions provided for appliances, equipment and other facilities.</li>
              <li>Habbaa may restrict access to any facility where it considers this necessary for safety, maintenance or operational reasons.</li>
              <li>Guests must not tamper with, disable or interfere with safety, security, electrical, water or other property systems.</li>
            </ul>
          </Section>

          <Section title="17. Power, water and other services">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 provides electricity, water, internet connectivity and other utilities as part of the stay.</li>
              <li>While reasonable efforts will be made to maintain these services, Habbaa cannot guarantee uninterrupted availability where an interruption is caused by circumstances beyond its reasonable control, including utility failures, maintenance, technical faults or external infrastructure issues.</li>
            </ul>
          </Section>

          <Section title="18. CCTV and security">
            <ul className="list-disc list-inside space-y-1">
              <li>CCTV surveillance may be used in common outdoor areas for property security and safety.</li>
              <li>CCTV cameras are not intended to be installed in private guest areas such as bedrooms or bathrooms.</li>
              <li>Guests must not interfere with, disable or tamper with security equipment.</li>
            </ul>
          </Section>

          <Section title="19. Personal belongings">
            <ul className="list-disc list-inside space-y-1">
              <li>Guests are responsible for their personal belongings, valuables, documents, cash and electronic devices during their stay.</li>
              <li>Habbaa will take reasonable measures to maintain property security but is not responsible for loss, theft or damage to personal belongings except where liability cannot lawfully be excluded.</li>
              <li>Guests should ensure that doors, windows and other access points are secured appropriately when leaving the property.</li>
            </ul>
          </Section>

          <Section title="20. Termination of stay">
            <p>
              Habbaa reserves the right to terminate a guest&apos;s stay and require the guest and accompanying persons to
              vacate the property immediately in the event of:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Serious or repeated violation of these Terms or house rules</li>
              <li>Unauthorised parties or events</li>
              <li>Unauthorised or excessive occupancy</li>
              <li>Illegal activity</li>
              <li>Conduct that endangers persons or property</li>
              <li>Material disturbance to neighbours or the surrounding community</li>
              <li>Deliberate or serious damage to the property</li>
              <li>Providing materially false or misleading booking information</li>
            </ul>
            <p className="mt-3">
              In such circumstances, the booking may be terminated without refund of the amount paid, without prejudice to
              Habbaa&apos;s right to recover any additional losses, damages or costs where applicable.
            </p>
            <p className="mt-3">
              Where a violation is minor and can reasonably be addressed, Habbaa may, at its discretion, provide the guest
              an opportunity to rectify the issue before taking further action.
            </p>
          </Section>

          <Section title="21. Force majeure">
            <ul className="list-disc list-inside space-y-1">
              <li>Habbaa will not be responsible for failure or inability to provide accommodation or services where this results from circumstances beyond its reasonable control, including natural disasters, severe weather, government restrictions, civil disturbance, strikes, utility failures, fire, major technical failures, public health emergencies or other force majeure events.</li>
              <li>Where such circumstances materially affect a confirmed booking, Habbaa will make reasonable efforts to provide an appropriate solution, which may include rescheduling, alternative arrangements or a refund, depending on the circumstances and applicable booking conditions.</li>
            </ul>
          </Section>

          <Section title="22. Third-party booking platforms">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 may accept bookings through third-party platforms including Airbnb, Booking.com, MakeMyTrip, Goibibo and other travel or accommodation platforms.</li>
              <li>Bookings made through such platforms are also subject to the applicable terms, cancellation policies and conditions of the platform through which the booking was made.</li>
              <li>In the event of any conflict relating specifically to the platform&apos;s booking, payment or cancellation process, the applicable platform terms may apply.</li>
            </ul>
          </Section>

          <Section title="23. Website use">
            <p>The Villa 19 website is provided for information, enquiries and booking purposes.</p>
            <p className="mt-3">Guests must not:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Use the website for unlawful purposes</li>
              <li>Attempt to gain unauthorised access to the website or its systems</li>
              <li>Introduce malicious code or interfere with website functionality</li>
              <li>Copy or reproduce website content without permission</li>
              <li>Use website content for commercial purposes without prior authorisation</li>
            </ul>
            <p className="mt-3">
              While we make reasonable efforts to ensure that information on the website is accurate and current,
              photographs, descriptions, amenities and other information may occasionally change.
            </p>
          </Section>

          <Section title="24. Intellectual property">
            <ul className="list-disc list-inside space-y-1">
              <li>The Villa 19 name, logo, website content, photographs, graphics, text and other materials relating to Villa 19 and Habbaa are owned by or licensed to Habbaa and are protected by applicable intellectual property laws.</li>
              <li>They may not be reproduced, modified, distributed or used commercially without prior written permission.</li>
            </ul>
          </Section>

          <Section title="25. Changes to these Terms">
            <ul className="list-disc list-inside space-y-1">
              <li>Habbaa may update these Terms from time to time to reflect changes in the property, services, booking processes, operational practices or applicable legal requirements.</li>
              <li>The latest version will be published on the Villa 19 website with the applicable effective date.</li>
              <li>The Terms applicable to a confirmed booking will generally be those accepted at the time of booking, subject to changes required by law or mutually agreed changes to the booking.</li>
            </ul>
          </Section>

          <Section title="26. Governing law and jurisdiction">
            <ul className="list-disc list-inside space-y-1">
              <li>These Terms shall be governed by and interpreted in accordance with the laws of India.</li>
              <li>Subject to applicable law, courts having jurisdiction in Mangalore, Karnataka shall have jurisdiction over disputes arising in connection with these Terms or a stay at Villa 19.</li>
            </ul>
          </Section>

          <Section title="27. Contact us">
            <p>
              Villa 19 by Habbaa<br />
              Managed by Habbaa Solutions Pvt Ltd<br />
              Property: {[property?.name, property?.address, property?.city, property?.state, property?.pincode].filter(Boolean).join(', ')}<br />
              Email: <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a><br />
              Reservations: <a href="tel:+918050484123" style={{ color: 'var(--brass-ink)' }}>+91 80504 84123</a><br />
              Registered Office: 209, Citadel Prism, PVS Kalakunj Road, Kodialbail, Mangalore 575003, Karnataka, India<br />
              CIN: U47711KA2025PTC207750<br />
              GSTIN: 29AAICH1682G1ZD
            </p>
          </Section>

          <p className="text-sm mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}>
            <strong style={{ color: 'var(--ink)' }}>Acceptance.</strong> By completing a booking, making payment, accessing
            the property, or staying at Villa 19, the guest confirms that they have read, understood and agreed to these
            Terms of Service, the applicable Villa 19 house rules and the applicable booking and cancellation policies.
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
