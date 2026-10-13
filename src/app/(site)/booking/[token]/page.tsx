import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Clock, XCircle, Calendar, Users, MapPin, IdCard, ShieldCheck, Moon, CalendarPlus } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { getProperty } from '@/lib/data';
import { idShareWhatsAppUrl, ACCEPTED_ID_TYPES } from '@/lib/whatsapp';
import { formatTime12, formatPhone, PROPERTY_TZ } from '@/lib/format';
import ExternalLink from '@/components/guest/ExternalLink';
import RefreshWhilePending from '@/components/guest/RefreshWhilePending';

export const metadata: Metadata = {
  title: 'Your Booking',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

type PageState = 'confirmed' | 'pending' | 'cancelled' | 'expired';

/**
 * One state from the two status columns. Previously the page asked only
 * "is it paid?", so a cancelled or refunded booking read "Booking Pending".
 */
function pageState(status: string | null, paymentStatus: string | null): PageState {
  if (status === 'cancelled' || paymentStatus === 'refunded') return 'cancelled';
  if (status === 'expired') return 'expired';
  if (status === 'confirmed' && paymentStatus === 'paid') return 'confirmed';
  return 'pending';
}

const HEADINGS: Record<PageState, string> = {
  confirmed: 'Your booking is confirmed.',
  pending: 'Confirming Your Payment',
  cancelled: 'Booking Cancelled',
  expired: 'Booking Not Completed',
};

const STATUS_LABEL: Record<PageState, string> = {
  confirmed: 'Confirmed',
  pending: 'Awaiting payment confirmation',
  cancelled: 'Cancelled',
  expired: 'Not completed',
};

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

/** "20260928T140000", the local-time form Google Calendar takes with ctz. */
const calStamp = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '').padEnd(4, '0')}00`;

export default async function BookingConfirmationPage({ params }: Props) {
  const { token } = await params;
  // The token is the only key to this page. Reject anything that is not one
  // before touching the database.
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const supabase = createServiceClient();

  const [{ data: booking, error }, property] = await Promise.all([
    supabase
      .from('bookings')
      .select('booking_code, id_status, guest_name, guest_email, guest_phone, check_in, check_out, num_nights, num_adults, num_children, base_amount, extra_guest_amount, tax_amount, total_amount, status, payment_status, special_requests')
      .eq('access_token', token)
      .maybeSingle(),
    getProperty(),
  ]);

  if (error || !booking || !property) notFound();

  const state = pageState(booking.status, booking.payment_status);
  const isConfirmed = state === 'confirmed';

  // Booking dates are calendar dates at the property. Parse at noon UTC and
  // format in IST so no server timezone can shift them a day.
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: PROPERTY_TZ,
    });

  const checkInTime = formatTime12(property.check_in_time);
  const checkOutTime = formatTime12(property.check_out_time);
  const placeLine = `${property.name} by Habbaa, ${property.address}, ${property.city}`;

  const adults = booking.num_adults ?? 1;
  const children = booking.num_children ?? 0;
  const nights = booking.num_nights;
  const guestsLine = [
    `${adults} adult${adults !== 1 ? 's' : ''}`,
    children > 0 && `${children} ${children === 1 ? 'child' : 'children'}`,
  ].filter(Boolean).join(', ');

  const whatsapp = process.env.PROPERTY_WHATSAPP;
  const idShareUrl = whatsapp && booking.booking_code
    ? idShareWhatsAppUrl(whatsapp, booking.booking_code, adults)
    : undefined;
  const showIdCard = isConfirmed && booking.booking_code;

  // No exact address in the event: it is shared on WhatsApp 24 hours before.
  const calendarUrl = isConfirmed
    ? 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
        action: 'TEMPLATE',
        text: `${property.name} stay${booking.booking_code ? ` (${booking.booking_code})` : ''}`,
        dates: `${calStamp(booking.check_in, property.check_in_time)}/${calStamp(booking.check_out, property.check_out_time)}`,
        ctz: PROPERTY_TZ,
        location: `${property.address}, ${property.city}`,
        details: `Check-in from ${checkInTime}, check-out by ${checkOutTime}. The exact address is shared on WhatsApp 24 hours before check-in.`,
      }).toString()
    : undefined;

  const priceRows: [string, number][] = [
    [`Stay (${nights} night${nights !== 1 ? 's' : ''})`, booking.base_amount],
    ...(booking.extra_guest_amount ? [['Extra guests', booking.extra_guest_amount] as [string, number]] : []),
    ['GST (18%)', booking.tax_amount],
  ];

  const StateIcon = { confirmed: CheckCircle, pending: Clock, cancelled: XCircle, expired: XCircle }[state];
  const iconColor = isConfirmed ? 'var(--ok)' : state === 'pending' ? 'var(--brass)' : 'var(--ink-muted)';

  return (
    <div className="pb-24 md:pb-12" style={{ color: 'var(--ink)' }}>
      {state === 'pending' && <RefreshWhilePending />}

      {/* ── Header ────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 text-center"
        style={{
          backgroundColor: 'var(--paper-band)',
          color: 'var(--ink)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <StateIcon className="w-14 h-14 mx-auto mb-5" style={{ color: iconColor }} aria-hidden="true" />
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            {HEADINGS[state]}
          </h1>
          {booking.booking_code && (
            <p className="text-xl opacity-80">
              Booking number: <span className="font-bold" style={{ letterSpacing: '1.2px' }}>{booking.booking_code}</span>
            </p>
          )}
          <p className="text-base mt-2 opacity-70 break-words">
            {state === 'confirmed' && <>A confirmation email has been sent to {booking.guest_email}</>}
            {state === 'pending' && 'This usually takes a few seconds. This page updates by itself.'}
            {state === 'cancelled' && (booking.payment_status === 'refunded'
              ? 'Your payment has been refunded to the original payment method.'
              : 'This booking has been cancelled.')}
            {state === 'expired' && 'Payment was not completed in time, so these dates were released. You have not been charged.'}
          </p>
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
                  {booking.id_status === 'received' ? (
                    <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                      Thank you. We are checking them and will confirm on WhatsApp. If someone was missed, send theirs the same way.
                    </p>
                  ) : (
                    <>
                      <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        For a smooth check-in, a valid government-issued photo ID is required for <strong style={{ color: 'var(--ink)' }}>each adult guest</strong>. Please send a photo of each ID to us on WhatsApp before your arrival.
                      </p>
                      <div>
                        <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--ink)' }}>Accepted IDs:</p>
                        <ul className="flex flex-wrap gap-2 text-sm" aria-label="Accepted ID documents">
                          {ACCEPTED_ID_TYPES.map((t) => (
                            <li key={t} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--ink)' }}>{t}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        Sharing your IDs in advance helps us complete the verification process before you arrive and makes check-in quicker.
                      </p>
                      <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        <strong style={{ color: 'var(--ink)' }}>Please send ID documents only via WhatsApp. Do not email them.</strong> ID documents are not stored on this website.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {idShareUrl ? (
                <ExternalLink
                  href={idShareUrl}
                  className="btn-brass-filled flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                >
                  {booking.id_status === 'received' ? 'Send more IDs on WhatsApp' : 'Send IDs on WhatsApp'}
                </ExternalLink>
              ) : (
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  We will message you on WhatsApp to collect them before your stay.
                </p>
              )}
            </div>
          )
        )}

        {/* ── Stay Details ──────────────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-5" style={{ backgroundColor: 'var(--maroon-tint)', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-bold text-base" style={{ color: 'var(--maroon)' }}>Stay Details</h2>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]" style={{ backgroundColor: 'var(--surface)' }}>
            {[
              { icon: Calendar, label: 'Check-in',  value: `${fmt(booking.check_in)} from ${checkInTime}` },
              { icon: Calendar, label: 'Check-out', value: `${fmt(booking.check_out)} by ${checkOutTime}` },
              { icon: Moon,     label: 'Duration',  value: `${nights} night${nights !== 1 ? 's' : ''}` },
              { icon: Users,    label: 'Guests',    value: guestsLine },
              { icon: MapPin,   label: 'Property',  value: placeLine },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 px-5 py-4">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink-muted)' }}>{label}</p>
                  <p className="text-base font-medium" style={{ color: 'var(--ink)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
          {calendarUrl && (
            <div className="px-5 py-4" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border-subtle)' }}>
              <ExternalLink
                href={calendarUrl}
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: 'var(--maroon)' }}
              >
                <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                Add to Google Calendar
              </ExternalLink>
            </div>
          )}
        </div>

        {/* ── Guest & Payment ───────────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-5" style={{ backgroundColor: 'var(--maroon-tint)', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-bold text-base" style={{ color: 'var(--maroon)' }}>Guest & Payment</h2>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]" style={{ backgroundColor: 'var(--surface)' }}>
            {[
              { label: 'Guest Name', value: booking.guest_name },
              { label: 'Email',      value: booking.guest_email },
              { label: 'Phone',      value: booking.guest_phone ? formatPhone(booking.guest_phone) : 'Not provided' },
              { label: 'Status',     value: STATUS_LABEL[state] },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 px-5 py-4">
                <p className="text-sm font-semibold flex-shrink-0 pt-0.5" style={{ color: 'var(--ink-muted)' }}>{label}</p>
                <p className="text-base font-medium text-right min-w-0 break-words" style={{ color: 'var(--ink)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* The stored breakdown, not a recalculation: rates can change after booking. */}
          <div className="px-5 py-4 space-y-2 text-sm" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border-subtle)' }}>
            {priceRows.map(([label, amount]) => (
              <div key={label} className="flex justify-between gap-4" style={{ color: 'var(--ink-muted)' }}>
                <span>{label}</span>
                <span className="tabular-nums">{inr(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-2 text-base font-bold" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--ink)' }}>{isConfirmed ? 'Total Paid' : 'Total'}</span>
              <span className="tabular-nums" style={{ color: 'var(--maroon)' }}>{inr(booking.total_amount)}</span>
            </div>
          </div>
        </div>

        {booking.special_requests && (
          <div
            className="p-5 rounded-3xl text-base"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="font-semibold mb-1.5" style={{ color: 'var(--maroon)' }}>Special Requests</p>
            <p className="break-words" style={{ color: 'var(--ink-muted)' }}>{booking.special_requests}</p>
          </div>
        )}

        {/* ── What happens next ──────────────────────────── */}
        {isConfirmed && (
          <div
            className="p-6 rounded-3xl space-y-4 text-base"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <h2 className="font-bold text-lg" style={{ color: 'var(--maroon)' }}>What happens next</h2>
            <ol className="space-y-4 list-none" style={{ color: 'var(--ink-muted)' }}>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon)' }}>1</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>Before you arrive</p>
                  <p className="mt-0.5">Around 24 hours before check-in, we&apos;ll send the exact address, directions and access instructions to you on WhatsApp.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon)' }}>2</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>Need anything before then?</p>
                  <p className="mt-0.5">
                    Just{' '}
                    {whatsapp ? (
                      <ExternalLink
                        href={`https://wa.me/${whatsapp}`}
                        className="font-semibold underline"
                        style={{ color: 'var(--maroon)' }}
                      >
                        WhatsApp
                      </ExternalLink>
                    ) : 'WhatsApp'}
                    {' '}us. We&apos;re usually available during the day and aim to respond within an hour.{' '}
                    Plans changed? Review our{' '}
                    <Link href="/cancellation" className="font-semibold underline" style={{ color: 'var(--maroon)' }}>
                      cancellation policy
                    </Link>
                    {' '}for details.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {state === 'pending' && (
          <p className="text-sm text-center" style={{ color: 'var(--ink-muted)' }}>
            Still waiting after a minute? Message us on WhatsApp with your email address and we will check.
          </p>
        )}

        {/* ── Back to home ─────────────────────────────── */}
        <Link href="/" className="btn-secondary btn-secondary-solid w-full py-3.5 rounded-2xl">
          Back to Home
        </Link>

      </div>
    </div>
  );
}
