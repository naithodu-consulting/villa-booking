import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  path: '/privacy',
  description:
    'How Villa 19 by Habbaa collects, uses, discloses, stores and protects your personal information when you enquire, book or stay with us, and the choices you have about it.',
});

// Effective date of the Privacy Policy issued by Habbaa Solutions Pvt Ltd.
const EFFECTIVE_DATE = '7 October 2026';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="space-y-6 text-base leading-relaxed"
          style={{ color: 'var(--ink-muted)' }}
        >
          <p>
            Villa 19 by Habbaa (&quot;Villa 19&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) respects your
            privacy and is committed to protecting the personal information you share with us. Villa 19 is a private
            accommodation property in Urwa, Mangalore, managed by Habbaa Solutions Pvt Ltd (&quot;Habbaa&quot;).
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, store and protect personal information when you
            visit the Villa 19 website, enquire about a stay, make a booking, communicate with us, or stay at the property.
            By using our website or providing personal information to us, you acknowledge the practices described in this
            Privacy Policy.
          </p>

          <Section title="1. Information we collect">
            <p>
              We may collect personal information that is reasonably necessary to provide and manage your stay and our
              services. Information you provide to us may include:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Name, mobile or telephone number and email address</li>
              <li>Booking and stay details</li>
              <li>Number and details of guests</li>
              <li>Government-issued identification details where required</li>
              <li>Payment and transaction information</li>
              <li>Special requests or preferences</li>
              <li>Information provided through enquiries, emails, WhatsApp or other communications</li>
              <li>Feedback, reviews and other information you voluntarily provide</li>
            </ul>
            <p className="mt-3">
              We seek to collect only information that is reasonably necessary for providing accommodation, processing
              bookings, complying with applicable requirements and communicating with you.
            </p>
            <p className="mt-3">
              Information collected automatically may include your IP address, browser and device information, operating
              system, pages visited, date and time of access, referring website or source, and website usage and
              interaction information. This information may be collected through cookies, analytics tools and similar
              technologies.
            </p>
          </Section>

          <Section title="2. How we use your information">
            <p>We may use personal information for purposes including:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Processing and managing reservations</li>
              <li>Confirming and administering your stay</li>
              <li>Communicating with you regarding your booking or enquiry</li>
              <li>Verifying guest identity where required</li>
              <li>Completing check-in and check-out procedures</li>
              <li>Processing payments, refunds and security deposits</li>
              <li>Providing requested services and amenities</li>
              <li>Responding to questions, requests and complaints</li>
              <li>Improving our website, services and guest experience</li>
              <li>Maintaining property and guest security</li>
              <li>Preventing fraud, misuse or unlawful activity</li>
              <li>Sending promotional communications where permitted</li>
              <li>Complying with applicable laws, regulations and lawful requests</li>
              <li>Protecting the rights, safety and property of Villa 19, Habbaa, our guests and others</li>
            </ul>
          </Section>

          <Section title="3. Guest identification and verification">
            <ul className="list-disc list-inside space-y-1">
              <li>For the safety and security of our guests and property, Villa 19 may require valid government-issued photo identification from guests at check-in.</li>
              <li>Identification information may be used for guest verification, check-in and accommodation records, compliance with applicable legal or regulatory requirements, and security and fraud prevention.</li>
              <li>We will handle such information responsibly and retain it only for as long as reasonably necessary or as required by applicable law.</li>
            </ul>
            <p className="mt-3">
              We accept Aadhaar (a masked copy, showing only the last four digits, is enough), passport or driving licence.
              After you book, you can send photos of these on WhatsApp using the link on your booking page. This website
              does not upload or store ID documents. They are seen only by our staff on WhatsApp, used only to register
              your stay, and never shared except where the law requires it. Please do not send ID documents by email.
            </p>
          </Section>

          <Section title="4. WhatsApp and messaging">
            <p>
              WhatsApp is our main enquiry and support channel. If you contact us there, your phone number, WhatsApp
              profile name and message content are processed by WhatsApp Ireland Ltd (part of Meta) under their own privacy
              policy, and are visible to us in the chat. We use that information only to answer your enquiry and manage
              your booking. If you would rather not use WhatsApp, email or call us instead and we will not contact you
              there.
            </p>
          </Section>

          <Section title="5. Booking through third-party platforms">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 may be listed on third-party booking platforms including Airbnb, Booking.com, MakeMyTrip, Goibibo and other accommodation or travel platforms.</li>
              <li>If you make a reservation through a third-party platform, that platform will process your personal information in accordance with its own privacy policy and terms.</li>
              <li>Information shared with Villa 19 by such platforms may be used to administer and fulfil your reservation and provide the booked accommodation and services.</li>
              <li>You should review the privacy policy of the relevant booking platform before making a reservation.</li>
            </ul>
          </Section>

          <Section title="6. Payments">
            <ul className="list-disc list-inside space-y-1">
              <li>Payments may be processed through third-party payment gateways, booking platforms or financial institutions.</li>
              <li>Villa 19 does not ordinarily store complete debit or credit card numbers or other full payment credentials on its own systems.</li>
              <li>Payment information may be processed and retained by the relevant payment service provider in accordance with its own terms and privacy policy.</li>
            </ul>
            <p className="mt-3">
              Payments made on this website are processed by Razorpay (razorpay.com). Your payment details are transmitted
              directly to Razorpay over an encrypted connection and are governed by their privacy policy. We store only
              the Razorpay order and payment IDs for bookkeeping purposes.
            </p>
          </Section>

          <Section title="7. Cookies and analytics">
            <p>Our website may use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Enable essential website functionality</li>
              <li>Remember preferences</li>
              <li>Understand website traffic and usage</li>
              <li>Improve website performance</li>
              <li>Measure marketing effectiveness</li>
            </ul>
            <p className="mt-3">
              Where required by applicable law, we will seek appropriate consent before using non-essential cookies or
              similar technologies. You may also control or disable cookies through your browser settings. Disabling
              certain cookies may affect some website functionality.
            </p>
            <p className="mt-3">
              Essential cookies required for this website to function (session state, security tokens) are always active,
              because the site cannot work without them. We do not use advertising or ad-targeting cookies.
            </p>
          </Section>

          <Section title="8. Marketing communications">
            <ul className="list-disc list-inside space-y-1">
              <li>Where permitted by applicable law, we may use your contact information to send information about Villa 19, special offers, seasonal rates, promotions, new services and other relevant hospitality-related communications.</li>
              <li>Where consent is required, promotional communications will be sent only after obtaining the required consent.</li>
              <li>You may withdraw consent or opt out of promotional communications at any time by using the unsubscribe option provided in the communication or by contacting us.</li>
              <li>Booking-related and other necessary service communications may continue where required to administer your reservation or provide our services.</li>
            </ul>
          </Section>

          <Section title="9. Sharing of information">
            <p>We may share personal information, where reasonably necessary, with:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Habbaa personnel and authorised Villa 19 staff</li>
              <li>Booking and travel platforms</li>
              <li>Payment processors and financial institutions</li>
              <li>Technology, hosting, communications and analytics service providers</li>
              <li>Housekeeping, maintenance, security and other service providers</li>
              <li>Professional advisers where necessary</li>
              <li>Government authorities or law enforcement agencies where required by law or lawful process</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
            <p className="mt-3">
              Where service providers process personal information on our behalf, we take reasonable steps to ensure that
              the information is handled appropriately and in accordance with applicable requirements.
            </p>
          </Section>

          <Section title="10. CCTV and property security">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 may use CCTV surveillance in common outdoor areas for security, safety and protection of the property, guests and staff.</li>
              <li>CCTV cameras are not intended to be installed in private guest areas such as bedrooms or bathrooms.</li>
              <li>CCTV recordings may be accessed only by authorised persons and may be retained for a reasonable period or longer where required for security investigations, legal proceedings or applicable legal requirements.</li>
            </ul>
          </Section>

          <Section title="11. Data security">
            <ul className="list-disc list-inside space-y-1">
              <li>We take reasonable technical and organisational measures to protect personal information against unauthorised access, disclosure, alteration, loss or misuse.</li>
              <li>However, no method of electronic transmission or storage can be guaranteed to be completely secure.</li>
              <li>In the event of a personal data breach requiring notification under applicable law, we will take appropriate steps in accordance with the applicable legal requirements.</li>
            </ul>
          </Section>

          <Section title="12. Data retention">
            <p>
              We retain personal information only for as long as reasonably necessary for the purposes for which it was
              collected, including:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Providing and administering your stay</li>
              <li>Maintaining booking and transaction records</li>
              <li>Meeting legal, tax, accounting or regulatory requirements</li>
              <li>Resolving disputes</li>
              <li>Preventing fraud and misuse</li>
              <li>Protecting our legal rights</li>
            </ul>
            <p className="mt-3">
              In practice, booking records are retained for a minimum of 3 years as required by applicable tax and
              accounting regulations, and enquiry records are retained for 12 months.
            </p>
            <p className="mt-3">
              When personal information is no longer reasonably required, it may be securely deleted, anonymised or
              otherwise disposed of, subject to applicable legal and operational requirements.
            </p>
          </Section>

          <Section title="13. Your privacy rights">
            <p>
              Subject to applicable law, you may have rights in relation to your personal information, including rights to:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Request information about personal data processed by us</li>
              <li>Request correction of inaccurate or incomplete information</li>
              <li>Request deletion of personal information where permitted</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Raise a grievance regarding the processing of your personal information</li>
              <li>Exercise other rights available under applicable data protection law</li>
            </ul>
            <p className="mt-3">
              Requests may be submitted using the contact details provided below. We may need to verify your identity
              before processing certain requests. Where a request cannot be fulfilled, we may explain the reason to the
              extent permitted by applicable law.
            </p>
          </Section>

          <Section title="14. Children's information">
            <ul className="list-disc list-inside space-y-1">
              <li>Villa 19 welcomes families and children as guests, subject to the property&apos;s booking and occupancy policies.</li>
              <li>Where information relating to a child is required for a booking, check-in, legal or safety requirement, it may be collected and processed as necessary and in accordance with applicable law.</li>
              <li>Parents or lawful guardians should ensure that information provided in relation to children is accurate and appropriately authorised.</li>
              <li>We do not knowingly use children&apos;s personal information for promotional purposes.</li>
            </ul>
          </Section>

          <Section title="15. Third-party websites and links">
            <ul className="list-disc list-inside space-y-1">
              <li>Our website may contain links to third-party websites, booking platforms, maps, social media platforms or other services.</li>
              <li>We are not responsible for the privacy practices, content or security of third-party websites.</li>
              <li>You should review the privacy policy of any third-party service before providing personal information to it.</li>
            </ul>
          </Section>

          <Section title="16. International data processing">
            <ul className="list-disc list-inside space-y-1">
              <li>Some of our technology, booking, communication, analytics or payment service providers may process information outside India.</li>
              <li>Where personal information is transferred or processed outside India, we will do so subject to applicable legal requirements and safeguards.</li>
            </ul>
          </Section>

          <Section title="17. Changes to this Privacy Policy">
            <ul className="list-disc list-inside space-y-1">
              <li>We may update this Privacy Policy from time to time to reflect changes in our services, technology, legal or regulatory requirements, or operational practices.</li>
              <li>The updated version will be published on this page with a revised effective date.</li>
              <li>We encourage you to review this Privacy Policy periodically.</li>
            </ul>
          </Section>

          <Section title="18. Contact us">
            <p>
              For questions, privacy requests or concerns regarding this Privacy Policy or the handling of your personal
              information, please contact:
            </p>
            <p className="mt-3">
              Villa 19 by Habbaa<br />
              Managed by Habbaa Solutions Pvt Ltd<br />
              Address: 209, Citadel Prism, PVS Kalakunj Road, Kodialbail, Mangalore 575003, Karnataka, India<br />
              Email: <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a><br />
              Phone: <a href="tel:+917760777876" style={{ color: 'var(--brass-ink)' }}>+91 77607 77876</a><br />
              CIN: U47711KA2025PTC207750<br />
              GSTIN: 29AAICH1682G1ZD
            </p>
          </Section>

          <Section title="19. Privacy grievances">
            <ul className="list-disc list-inside space-y-1">
              <li>If you have a concern regarding the collection, use or processing of your personal information, please contact us at <a href="mailto:reservations@habbaa.com" style={{ color: 'var(--brass-ink)' }}>reservations@habbaa.com</a>.</li>
              <li>Please include sufficient information to help us identify your booking, enquiry or interaction with Villa 19.</li>
              <li>We will review and respond to privacy-related grievances in accordance with applicable law and our internal procedures.</li>
            </ul>
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
