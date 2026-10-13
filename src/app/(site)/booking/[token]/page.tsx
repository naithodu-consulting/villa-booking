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

/** "Aadhaar, Passport, or Driving Licence" from the shared list. */
const acceptedIdsLine = ACCEPTED_ID_TYPES.length > 1
  ? `${ACCEPTED_ID_TYPES.slice(0, -1).join(', ')}, or ${ACCEPTED_ID_TYPES[ACCEPTED_ID_TYPES.length - 1]}`
  : ACCEPTED_ID_TYPES[0];

/** "20260928T140000", the local-time form Google Calendar takes with ctz. */
const calStamp = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '').padEnd(4, '0')}00`;

/* The site's section heading: a brass rule, then a Cormorant title sitting on
   the page ground with the card below it. Used on the home, villa, rooms and
   policy pages; this page previously put its titles inside a --maroon-tint
   strip at the top of each card, which exists nowhere else. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
      <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
        {children}
      </h2>
    </div>
  );
}

/* Small label above a value, matching the uppercase micro-label used in the
   booking widget and the villa-rules tiles. */
const LABEL_CLASS = 'text-[11px] font-bold uppercase tracking-[1px]';

const CARD_CLASS = 'rounded-3xl shadow-sm overflow-hidden';
const CARD_STYLE = { backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' } as const;

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
      {/* The hero sits on the page ground. It used to be a --paper-band slab
          with a border under it, which since the sunk tones were resynced is a
          near-white block against cream: a hard seam across the page. */}
      <section className="pt-14 sm:pt-16 pb-8 text-center" style={{ color: 'var(--ink)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <StateIcon className="w-14 h-14 mx-auto mb-5" style={{ color: iconColor }} aria-hidden="true" />
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            {HEADINGS[state]}
          </h1>
          {booking.booking_code && (
            <p className="text-xl" style={{ color: 'var(--ink-muted)' }}>
              Booking number:{' '}
              <span className="font-bold" style={{ color: 'var(--ink)', letterSpacing: '1.2px' }}>{booking.booking_code}</span>
            </p>
          )}
          <p className="text-base mt-2 break-words" style={{ color: 'var(--ink-muted)' }}>
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-10 space-y-8">

        {/* ── Guest IDs ─────────────────────────────────── */}
        {showIdCard && (
          booking.id_status === 'verified' ? (
            <div className="flex items-center gap-3 p-5 rounded-3xl shadow-sm" style={CARD_STYLE}>
              <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--ok)' }} aria-hidden="true" />
              <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                ID documents received and checked. You are all set for check-in.
              </p>
            </div>
          ) : (
            /* A callout, so it keeps a brass edge, but --border-brass like the
               stay-guide callout rather than a solid --brass hairline. */
            <div
              className="p-6 rounded-3xl shadow-sm space-y-4"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-brass)' }}
            >
              <div className="flex items-start gap-3">
                <IdCard className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
                    {booking.id_status === 'received' ? 'ID documents received' : 'Share ID documents before you arrive'}
                  </h2>
                  {booking.id_status === 'received' ? (
                    <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                      Thank you. We are checking them and will confirm on WhatsApp. If someone was missed,{' '}
                      share theirs on{' '}
                      {idShareUrl
                        ? <ExternalLink href={idShareUrl} className="font-semibold underline" style={{ color: 'var(--maroon)' }}>WhatsApp</ExternalLink>
                        : 'WhatsApp'}{' '}
                      the same way.
                    </p>
                  ) : (
                    <>
                      <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        For a smooth check-in, please <strong style={{ color: 'var(--ink)' }}>share</strong> a valid <strong style={{ color: 'var(--ink)' }}>government-issued photo ID</strong> for <strong style={{ color: 'var(--ink)' }}>each adult guest</strong> with us on WhatsApp before arrival.
                      </p>
                      <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        <strong style={{ color: 'var(--ink)' }}>Accepted IDs:</strong> {acceptedIdsLine}.
                      </p>
                      <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        Share IDs on{' '}
                        {idShareUrl
                          ? <ExternalLink href={idShareUrl} className="font-semibold underline" style={{ color: 'var(--maroon)' }}>WhatsApp</ExternalLink>
                          : 'WhatsApp'}{' '}
                        in advance to help us complete the check-in formalities before you arrive.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {!idShareUrl && (
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  We will message you on WhatsApp to collect them before your stay.
                </p>
              )}
            </div>
          )
        )}

        {/* ── Stay Details ──────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading>Stay Details</SectionHeading>
          <div className={CARD_CLASS} style={CARD_STYLE}>
            <div className="divide-y divide-[var(--border-subtle)]">
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
                  <p className={`${LABEL_CLASS} mb-1`} style={{ color: 'var(--ink-muted)' }}>{label}</p>
                  <p className="text-base font-medium" style={{ color: 'var(--ink)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
          {calendarUrl && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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
        </div>

        {/* ── Guest & Payment ───────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading>Guest &amp; Payment</SectionHeading>
          <div className={CARD_CLASS} style={CARD_STYLE}>
            <div className="divide-y divide-[var(--border-subtle)]">
            {[
              { label: 'Guest Name', value: booking.guest_name },
              { label: 'Email',      value: booking.guest_email },
              { label: 'Phone',      value: booking.guest_phone ? formatPhone(booking.guest_phone) : 'Not provided' },
              { label: 'Status',     value: STATUS_LABEL[state] },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center gap-4 px-5 py-4">
                <p className={`${LABEL_CLASS} flex-shrink-0`} style={{ color: 'var(--ink-muted)' }}>{label}</p>
                <p className="text-base font-medium text-right min-w-0 break-words" style={{ color: 'var(--ink)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* The stored breakdown, not a recalculation: rates can change after booking. */}
          <div className="px-5 py-4 space-y-2 text-sm" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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
        </div>

        {booking.special_requests && (
          <div className="space-y-4">
            <SectionHeading>Special Requests</SectionHeading>
            <div className="p-5 rounded-3xl shadow-sm text-base" style={CARD_STYLE}>
              <p className="break-words" style={{ color: 'var(--ink-muted)' }}>{booking.special_requests}</p>
            </div>
          </div>
        )}

        {/* ── What happens next ──────────────────────────── */}
        {isConfirmed && (
          <div className="space-y-4">
          <SectionHeading>What happens next</SectionHeading>
          <div className="p-6 rounded-3xl shadow-sm text-base" style={CARD_STYLE}>
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
                      Cancellation Policy
                    </Link>
                    {' '}for details.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          </div>
        )}

        {state === 'pending' && (
          <p className="text-sm text-center" style={{ color: 'var(--ink-muted)' }}>
            Still waiting after a minute? Message us on WhatsApp with your email address and we will check.
          </p>
        )}

        {/* ── Back to home ─────────────────────────────── */}
        <Link href="/" className="btn-primary w-full py-3.5 rounded-2xl">
          Homepage
        </Link>

      </div>
    </div>
  );
}
