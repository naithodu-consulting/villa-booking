import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Calendar, Users, MapPin, IdCard, ShieldCheck } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { idShareWhatsAppUrl, ACCEPTED_ID_TYPES } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Booking Confirmed',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function BookingConfirmationPage({ params }: Props) {
  const { token } = await params;
  // The token is the only key to this page. Reject anything that is not one
  // before touching the database.
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('booking_code, id_status, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, total_amount, status, payment_status, special_requests')
    .eq('access_token', token)
    .maybeSingle();

  if (error || !booking) notFound();

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const totalRupees = (booking.total_amount / 100).toLocaleString('en-IN');
  const guests = (booking.num_adults ?? 0) + (booking.num_children ?? 0);
  const isPaid = booking.payment_status === 'paid';
  const whatsapp = process.env.PROPERTY_WHATSAPP;
  const adults = booking.num_adults ?? 1;
  const idShareUrl = whatsapp && booking.booking_code
    ? idShareWhatsAppUrl(whatsapp, booking.booking_code, adults)
    : undefined;
  const showIdCard = isPaid && booking.booking_code;

  return (
    <div className="pb-24 md:pb-12" style={{ color: 'var(--ink)' }}>

      {/* ── Header ────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 text-center"
        style={{
          backgroundColor: 'var(--paper-sunk)',
          color: 'var(--ink)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {isPaid ? (
            <CheckCircle className="w-14 h-14 mx-auto mb-5" style={{ color: 'var(--ok)' }} />
          ) : (
            <div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--border-subtle)' }}>
              <span className="text-2xl">⏳</span>
            </div>
          )}
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            {isPaid ? 'Booking Confirmed' : 'Booking Pending'}
          </h1>
          <p className="text-xl opacity-80">
            {booking.booking_code
              ? <>Booking number: <span className="font-bold" style={{ letterSpacing: '1.2px' }}>{booking.booking_code}</span></>
              : 'Your booking number will appear here once payment is confirmed.'}
          </p>
          {isPaid && (
            <p className="text-base mt-2 opacity-70">
              A confirmation has been emailed to {booking.guest_email}
            </p>
          )}
        </div>
      </section>

      {/* ── Booking Details ───────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-5">

        {/* ── Guest IDs ─────────────────────────────────── */}
        {showIdCard && (
          booking.id_status === 'verified' ? (
            <div
              className="flex items-center gap-3 p-5 rounded-3xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--ok)' }} aria-hidden="true" />
              <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                ID documents received and checked. You are all set for check-in.
              </p>
            </div>
          ) : (
            <div
              className="p-6 rounded-3xl space-y-4"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--brass)' }}
            >
              <div className="flex items-start gap-3">
                <IdCard className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <div className="space-y-1.5">
                  <h2 className="font-bold text-lg" style={{ color: 'var(--maroon)' }}>
                    {booking.id_status === 'received' ? 'ID documents received' : 'Share ID documents before you arrive'}
                  </h2>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                    {booking.id_status === 'received'
                      ? 'Thank you. We are checking them and will confirm on WhatsApp. If someone was missed, send theirs the same way.'
                      : `Government photo ID is required for every adult guest (${adults} for this booking). Send a photo of each on WhatsApp. It takes a minute and saves time at check-in.`}
                  </p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2 text-sm" aria-label="Accepted ID documents">
                {ACCEPTED_ID_TYPES.map((t) => (
                  <li key={t} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--ink)' }}>{t}</li>
                ))}
              </ul>
              {idShareUrl ? (
                <a
                  href={idShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brass-filled flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                >
                  {booking.id_status === 'received' ? 'Send more IDs on WhatsApp' : 'Send IDs on WhatsApp'}
                </a>
              ) : (
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  We will message you on WhatsApp to collect them before your stay.
                </p>
              )}
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                Please do not email ID documents. We do not store copies on this website.
              </p>
            </div>
          )
        )}

        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-5" style={{ backgroundColor: 'var(--maroon-tint)', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-bold text-base" style={{ color: 'var(--maroon)' }}>Stay Details</h2>
          </div>
          <div className="divide-y" style={{ backgroundColor: 'var(--surface)', '--tw-divide-opacity': '1' } as React.CSSProperties}>
            {[
              { icon: Calendar, label: 'Check-in',  value: fmt(booking.check_in) + ' from 2:00 PM' },
              { icon: Calendar, label: 'Check-out', value: fmt(booking.check_out) + ' by 11:00 AM' },
              { icon: Users,    label: 'Guests',     value: `${guests} guest${guests !== 1 ? 's' : ''}` },
              { icon: MapPin,   label: 'Property',   value: 'Villa 19 by Habbaa, Urwa, Mangalore' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 px-5 py-4">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink-muted)' }}>{label}</p>
                  <p className="text-base font-medium" style={{ color: 'var(--ink)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-5" style={{ backgroundColor: 'var(--maroon-tint)', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-bold text-base" style={{ color: 'var(--maroon)' }}>Guest & Payment</h2>
          </div>
          <div className="divide-y" style={{ backgroundColor: 'var(--surface)' }}>
            {[
              { label: 'Guest Name',   value: booking.guest_name },
              { label: 'Email',        value: booking.guest_email },
              { label: 'Phone',        value: booking.guest_phone ?? 'Not provided' },
              { label: 'Total Paid',   value: `₹${totalRupees}` },
              { label: 'Status',       value: booking.status === 'confirmed' ? 'Confirmed' : booking.status },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center px-5 py-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>{label}</p>
                <p className="text-base font-medium" style={{ color: label === 'Total Paid' ? 'var(--maroon)' : 'var(--ink)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {booking.special_requests && (
          <div
            className="p-5 rounded-3xl text-base"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="font-semibold mb-1.5" style={{ color: 'var(--maroon)' }}>Special Requests</p>
            <p style={{ color: 'var(--ink-muted)' }}>{booking.special_requests}</p>
          </div>
        )}

        {/* ── What happens next ──────────────────────────── */}
        <div
          className="p-6 rounded-3xl space-y-3 text-base"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="font-bold" style={{ color: 'var(--maroon)' }}>What happens next</p>
          <ul className="space-y-2" style={{ color: 'var(--ink-muted)' }}>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass-ink)' }}>1.</span>
              Check your inbox. A confirmation email has been sent to {booking.guest_email}.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass-ink)' }}>2.</span>
              Share a photo ID for every adult guest on WhatsApp before you arrive.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass-ink)' }}>3.</span>
              24 hours before check-in, we will share the exact address and access instructions on WhatsApp.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass-ink)' }}>4.</span>
              Questions? WhatsApp us. We respond within 30 minutes.
            </li>
          </ul>
        </div>

        {/* ── Contact quick links ───────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {process.env.PROPERTY_WHATSAPP && (
            <a
              href={`https://wa.me/${process.env.PROPERTY_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa-ghost flex items-center justify-center gap-2 py-3.5 rounded-2xl"
            >
              WhatsApp Us
            </a>
          )}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--maroon)', border: '1px solid var(--border-subtle)' }}
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
