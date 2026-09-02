import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Calendar, Users, MapPin, Phone, Mail } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Booking Confirmed',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ ref: string }>;
}

export default async function BookingConfirmationPage({ params }: Props) {
  const { ref } = await params;
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('reference_number, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, total_amount, status, payment_status, special_requests')
    .eq('reference_number', ref)
    .maybeSingle();

  if (error || !booking) notFound();

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const totalRupees = (booking.total_amount / 100).toLocaleString('en-IN');
  const guests = (booking.num_adults ?? 0) + (booking.num_children ?? 0);
  const isPaid = booking.payment_status === 'paid';

  return (
    <div className="pb-24 md:pb-12" style={{ color: 'var(--ink)' }}>

      {/* ── Header ────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 text-center"
        style={{ backgroundColor: isPaid ? 'var(--maroon)' : 'var(--paper-sunk)', color: isPaid ? 'white' : 'var(--ink)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {isPaid ? (
            <CheckCircle className="w-14 h-14 mx-auto mb-5 opacity-90" style={{ color: 'var(--brass-light)' }} />
          ) : (
            <div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--border-subtle)' }}>
              <span className="text-2xl">⏳</span>
            </div>
          )}
          <h1
            className="text-4xl sm:text-5xl font-bold italic mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isPaid ? 'Booking Confirmed' : 'Booking Pending'}
          </h1>
          <p className="text-xl opacity-80">
            Reference: <span className="font-bold tracking-wider">{booking.reference_number}</span>
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
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass)' }}>1.</span>
              Check your inbox. A confirmation email has been sent to {booking.guest_email}.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass)' }}>2.</span>
              24 hours before check-in, we will share the exact address and access instructions on WhatsApp.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5" style={{ color: 'var(--brass)' }}>3.</span>
              Questions? WhatsApp us. We respond within 30 minutes.
            </li>
          </ul>
        </div>

        {/* ── Contact quick links ───────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
          >
            <Phone className="w-4 h-4" />
            WhatsApp Us
          </a>
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
