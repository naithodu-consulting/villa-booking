'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import type { Property, PricingRule } from '@/types';
import { calculateBookingPrice, GST_PERCENT } from '@/lib/pricing-engine';
import DateSelectForm from '@/components/guest/DateSelectForm';
import { isRangeAvailable } from '@/lib/availability';
import { track, nightsBetween, leadTimeDays, paiseToRupees, getGaIdentifiers } from '@/lib/analytics';
import { useNightCalendar } from '@/components/guest/useNightCalendar';
import { Lock, ShieldCheck, ArrowLeft, AlertCircle, Loader2, Tag, X, CheckCircle } from 'lucide-react';
import { formatTime12 } from '@/lib/format';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Resolves once Razorpay's checkout script is on the page, injecting it if needed. */
function loadRazorpay(): Promise<void> {
  if (typeof window.Razorpay === 'function') return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = RAZORPAY_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Payment gateway could not be loaded. Check your connection and try again.')));
    // The script may have finished loading between the check above and the listeners.
    if (typeof window.Razorpay === 'function') resolve();
  });
}

interface Props {
  property: Property;
  pricingRules: PricingRule[];
  /** When the server read the rates in `property` and `pricingRules`. */
  ratesReadAt: number;
}

function CheckoutContent({ property, pricingRules, ratesReadAt }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkIn  = searchParams.get('checkIn')  ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const adults   = parseInt(searchParams.get('adults')   ?? String(property.ideal_occupancy), 10);

  const fmtDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const children = parseInt(searchParams.get('children') ?? '0', 10);

  // Written out rather than `${adults} adults`, which read "1 adults" and
  // "1 children" on the payment screen. Mirrors booking/[token]/page.tsx.
  const guestsLine = [
    `${adults} adult${adults === 1 ? '' : 's'}`,
    children > 0 && `${children} ${children === 1 ? 'child' : 'children'}`,
  ].filter(Boolean).join(', ');

  const [guestName,        setGuestName]        = useState('');
  const [guestEmail,       setGuestEmail]       = useState('');
  const [guestPhone,       setGuestPhone]       = useState('');
  const [specialRequests,  setSpecialRequests]  = useState('');

  const [isProcessing,     setIsProcessing]     = useState(false);
  const [serverError,      setServerError]      = useState('');
  const [fieldErrors,      setFieldErrors]      = useState<{ name?: string; email?: string; phone?: string }>({});
  const [promoInput,       setPromoInput]       = useState('');
  const [promoCode,        setPromoCode]        = useState<string | null>(null);
  const [promoDiscount,    setPromoDiscount]    = useState(0); // paise
  // GST and total after the discount, as the server worked them out.
  const [promoTax,         setPromoTax]         = useState<number | null>(null);
  const [promoTotal,       setPromoTotal]       = useState<number | null>(null);
  const [promoStatus,      setPromoStatus]      = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  // The booking the code was checked against, so a later change to the dates
  // or the guest count drops it instead of showing a saving that may no
  // longer apply. Derived below rather than cleared, so the two cannot drift.
  const [promoFor,         setPromoFor]         = useState('');
  const [promoMessage,     setPromoMessage]     = useState('');
  const [promoError,       setPromoError]       = useState('');
  // Set when create-order refuses because its own total differs from the one
  // shown here — a rate changed while this page was open. Holds the server's
  // figures, which are authoritative and already include any discount, and is
  // tied to the booking it was issued for so it cannot outlive it.
  const [correction,       setCorrection]       = useState<{
    tax_amount: number; total_amount: number; discount_amount: number;
  } | null>(null);
  const [correctionFor,    setCorrectionFor]    = useState('');
  // Catches a stale link or a night taken since the guest picked dates, before
  // they fill in the form. create-order still re-checks under a lock at payment.
  const { unavailable, rateForSince, loadRange, refresh } = useNightCalendar(property.id);
  const rateFor = rateForSince(ratesReadAt);
  useEffect(() => { loadRange(checkIn, checkOut); }, [checkIn, checkOut, loadRange]);

  // children is checked too: a non-numeric ?children= made totalGuests NaN,
  // which slips past the max-occupancy guard and renders the price as ₹NaN.
  const hasValidParams = checkIn && checkOut && !isNaN(adults) && !isNaN(children);
  // No dates at all is not an error state: the header BOOK NOW button on every
  // page links to a bare /book, so this is the commonest way in.
  const needsDates = !checkIn && !checkOut;

  let breakdown = null;
  let paramError = '';

  if (!hasValidParams) {
    paramError = 'Missing booking details. Please select your dates from the property page.';
  } else {
    try {
      breakdown = calculateBookingPrice(property, pricingRules, checkIn, checkOut, adults, children, rateFor);
      if (!isRangeAvailable(unavailable, checkIn, checkOut)) {
        breakdown = null;
        paramError = 'Some of those nights are already booked. Please choose different dates.';
      }
    } catch (err) {
      paramError = err instanceof Error ? err.message : 'Invalid date range. Please go back and reselect.';
    }
  }

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || !breakdown) return;
    setPromoStatus('checking');
    setPromoError('');
    setPromoMessage('');
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          propertyId: property.id,
          checkIn,
          checkOut,
          adults,
          children,
          guestPhone,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        // A discount re-prices the stay, so a correction from before it no
        // longer describes what is owed.
        setCorrection(null);
        setCorrectionFor('');
        setPromoCode(data.code);
        setPromoDiscount(data.discountAmountPaise);
        setPromoTax(data.taxAmountPaise ?? null);
        setPromoTotal(data.totalAmountPaise ?? null);
        setPromoMessage(data.message);
        setPromoStatus('valid');
        setPromoFor(`${checkIn}|${checkOut}|${adults}|${children}`);
        track('promo_applied', { promo_code: data.code });
      } else {
        setPromoCode(null);
        setPromoDiscount(0);
        setPromoError(data.error ?? 'Invalid promo code.');
        setPromoStatus('invalid');
        // The code the guest typed, not the server's message: the question this
        // answers is which codes are circulating that we do not honour.
        track('promo_rejected', { promo_code: code });
      }
    } catch {
      setPromoCode(null);
      setPromoDiscount(0);
      setPromoError('Could not check promo code. Please try again.');
      setPromoStatus('invalid');
    }
  };

  const clearPromo = () => {
    setCorrection(null);
    setCorrectionFor('');
    setPromoInput('');
    setPromoCode(null);
    setPromoDiscount(0);
    setPromoTax(null);
    setPromoTotal(null);
    setPromoStatus('idle');
    setPromoMessage('');
    setPromoError('');
    setPromoFor('');
  };

  // An applied code only counts while the booking still matches the one it
  // was validated against.
  const bookingKey = `${checkIn}|${checkOut}|${adults}|${children}`;
  const appliedCode = promoFor === bookingKey ? promoCode : null;
  const appliedDiscount = appliedCode ? promoDiscount : 0;

  // Likewise for a price correction: it belongs to the booking it was issued
  // for, so changing dates or guests discards it.
  const activeCorrection = correctionFor === bookingKey ? correction : null;

  // The discount comes off before GST, so an applied code lowers the tax too.
  // Both figures come from the server; the browser never re-derives the rule.
  // A correction outranks both: it is the price create-order just computed.
  const shownTax =
    activeCorrection?.tax_amount ??
    (appliedCode && promoTax !== null ? promoTax : (breakdown?.tax_amount ?? 0));
  const shownTotal =
    activeCorrection?.total_amount ??
    (appliedCode && promoTotal !== null
      ? promoTotal
      : (breakdown?.total_amount ?? 0));

  // The top of the measured funnel on the checkout: a stay that is priced and
  // available, with the form in front of the guest.
  //
  // Keyed on the booking, not on mount: the availability refresh and the rate
  // poller re-render this component repeatedly, and an effect without a key
  // would report a fresh checkout every few seconds. Changing dates or guests
  // is a genuinely new checkout, and does report again.
  const stayKey = breakdown ? `${checkIn}|${checkOut}|${adults}|${children}` : '';
  const reportedCheckout = useRef('');
  useEffect(() => {
    if (!stayKey || reportedCheckout.current === stayKey) return;
    reportedCheckout.current = stayKey;
    track('begin_checkout', {
      currency: 'INR',
      value: paiseToRupees(shownTotal),
      nights: nightsBetween(checkIn, checkOut),
      adults,
      children,
      lead_time_days: leadTimeDays(checkIn),
    });
    // shownTotal is deliberately not a dependency: a promo code lowering the
    // total must not re-report the checkout. promo_applied covers that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stayKey, checkIn, checkOut, adults, children]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown) return;

    // Validate fields and surface per-field errors before hitting the API.
    const errs: typeof fieldErrors = {};
    if (!guestName.trim()) errs.name = 'Please enter your full name.';
    if (!guestEmail.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!guestPhone.trim()) {
      errs.phone = 'Please enter your mobile number.';
    } else if (!/^[6-9][0-9]{9}$/.test(guestPhone.trim())) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setServerError('');
    setIsProcessing(true);

    // Whether this attempt has already reported why it failed. The catch below
    // is the last resort, and without this it reported a second time on top of
    // the specific reason, which double-counted every failure in the funnel.
    // A flag, not a test of the error message: messages come from the server
    // and change without anyone thinking about analytics.
    let failureReported = false;

    try {
      // Load the gateway first so a failure never leaves a pending hold on the dates.
      await loadRazorpay();

      // Read before the order is created, so the server can attribute the
      // purchase it will report once payment is confirmed. Resolves to nulls
      // when the guest declined cookies, which is the common case and not a
      // reason to hold up a payment.
      const ga = await getGaIdentifiers();

      const orderRes = await fetch('/api/bookings/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn, checkOut, adults, children,
          guestName, guestEmail, guestPhone, specialRequests,
          ...(appliedCode && { promoCode: appliedCode }),
          // What this page is showing. The server prices the stay itself and
          // refuses rather than charging a total the guest never saw.
          expectedTotal: shownTotal,
          ...(ga.clientId && { gaClientId: ga.clientId }),
          ...(ga.sessionId && { gaSessionId: ga.sessionId }),
        }),
      });

      const orderData = await orderRes.json();

      // The rate moved between this page loading and this click. Show the new
      // total and let the guest decide; no booking or hold was created.
      if (orderRes.status === 409 && orderData.error === 'PRICE_CHANGED') {
        setCorrection(orderData.breakdown);
        setCorrectionFor(bookingKey);
        setServerError(orderData.message);
        track('price_changed', { nights: nightsBetween(checkIn, checkOut) });
        refresh(); // bring the calendar's per-night prices in line too
        setIsProcessing(false);
        return;
      }

      if (!orderRes.ok) {
        // The other 409 from create-order: the nights went while this page was
        // open. Told apart from a price change because they mean opposite
        // things, one about money and one about availability.
        if (orderRes.status === 409) {
          track('booking_conflict', {
            nights: nightsBetween(checkIn, checkOut),
            lead_time_days: leadTimeDays(checkIn),
          });
        } else {
          track('payment_failed', { stage: 'order' });
        }
        failureReported = true;
        throw new Error(orderData.error ?? 'Could not create booking order. Please try again.');
      }

      const { bookingToken, razorpayOrderId, razorpayKeyId, amount } = orderData;

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:       razorpayKeyId,
          order_id:  razorpayOrderId,
          amount,
          currency:  'INR',
          name:      property.name,
          description: `Stay: ${checkIn} to ${checkOut}`,
          prefill: { name: guestName, email: guestEmail, contact: guestPhone },
          theme: { color: '#5A2626' },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch('/api/bookings/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              if (!verifyRes.ok) {
                const d = await verifyRes.json();
                // The guest has paid and we could not confirm it. The single
                // most expensive thing that can go wrong here, so it is
                // reported separately from a gateway error.
                track('payment_failed', { stage: 'verification' });
                failureReported = true;
                reject(new Error(d.error ?? 'Payment verification failed.'));
              } else {
                resolve();
              }
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
          modal: { ondismiss: () => reject(new Error('DISMISSED')) },
        });
        track('add_payment_info', {
          currency: 'INR',
          value: paiseToRupees(amount),
          nights: nightsBetween(checkIn, checkOut),
        });
        rzp.open();
      });

      router.replace(`/booking/${bookingToken}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (msg === 'DISMISSED') {
        // Closing the modal is not an error: it is the commonest exit from a
        // working payment screen, and a funnel report that files it as a
        // failure would send us hunting for a bug that is not there.
        track('payment_abandoned', { currency: 'INR', value: paiseToRupees(shownTotal) });
      } else {
        setServerError(msg);
        // Only when nothing more specific was reported: what is left here is
        // the gateway itself, or the script that loads it.
        if (!failureReported) {
          track('payment_failed', { stage: 'razorpay' });
        }
      }
      setIsProcessing(false);
    }
  };

  // ── Date selection: arrived without dates ─────────────────────────────
  if (needsDates) {
    return (
      <>
      <CheckoutHeader property={property} />
      <main id="main-content" className="flex-1 flex items-start sm:items-center justify-center p-4 py-10 sm:py-4">
        <div
          className="max-w-md w-full p-7 sm:p-8 rounded-3xl space-y-5 shadow-lg"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Choose your dates
            </h1>
          </div>

          <DateSelectForm
            source="checkout"
            maxOccupancy={property.max_occupancy}
            idealOccupancy={property.ideal_occupancy}
            propertyId={property.id}
            onContinue={(query) => router.push(`/book?${query}`)}
          />

          <Link href="/" className="block text-center text-sm font-semibold" style={{ color: 'var(--maroon)' }}>
            Back
          </Link>
        </div>
      </main>
      </>
    );
  }

  // ── Param error screen: dates were supplied but do not make sense ─────
  //
  // Not once payment is under way, and not over a server error.
  //
  // The availability refresh on visibilitychange fires when a guest returns
  // from their UPI app, and by then their own just-confirmed booking holds
  // those nights. Without the isProcessing guard the page answered a successful
  // payment with "Some of those nights are already booked" while the redirect
  // to the confirmation was still in flight.
  //
  // serverError matters for the same reason one step later: if verification
  // fails but the Razorpay webhook confirms the booking anyway, isProcessing is
  // back to false and the nights are genuinely taken, so this card would hide
  // the real message behind an availability one. serverError only renders
  // inside the form below, so it has to win here.
  if (paramError && !isProcessing && !serverError) {
    return (
      <>
      <CheckoutHeader property={property} />
      <main id="main-content" className="flex-1 flex items-center justify-center p-4">
        <div
          className="max-w-md w-full p-8 rounded-3xl text-center space-y-5 shadow-lg"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <AlertCircle className="w-12 h-12 mx-auto" style={{ color: 'var(--error)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
            Invalid Booking Details
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{paramError}</p>
          <Link href="/" className="btn-primary block w-full">Back</Link>
        </div>
      </main>
      </>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ color: 'var(--ink)', backgroundColor: 'var(--paper)' }}>
      <Script src={RAZORPAY_SRC} strategy="afterInteractive" />

      <CheckoutHeader property={property} />

      <main id="main-content" className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--ink-muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

            {/* ── Guest details form ─────────────────────────── */}
            <div
              className="md:col-span-7 p-6 sm:p-8 rounded-3xl shadow-md space-y-6"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center"
                    style={{ backgroundColor: 'var(--brass)' }}
                  >
                    1
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                    Guest Details
                  </span>
                </div>
                <h1 className="text-3xl font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
                  Complete Your Booking
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
                  Enter the primary guest details below. Your booking confirmation will be sent to your email.{' '}
                </p>
              </div>

              <form onSubmit={handlePayment} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="guestName" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Name
                  </label>
                  <input
                    id="guestName"
                    type="text"
                    required
                    value={guestName}
                    /* guest_name is VARCHAR(255); anything longer used to reach
                       Postgres and come back as a generic 503. create-order
                       caps at 120 too, so this is the friendly half of the
                       same rule. */
                    maxLength={120}
                    onChange={(e) => { setGuestName(e.target.value); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: undefined })); }}
                    placeholder="Full name as per Govt ID"
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow"
                    style={{
                      backgroundColor: 'var(--paper-sunk)',
                      border: fieldErrors.name ? '1.5px solid var(--error)' : '1px solid var(--border-subtle)',
                      color: 'var(--ink)',
                      '--tw-ring-color': fieldErrors.name ? 'var(--error)' : 'var(--brass)',
                    } as React.CSSProperties}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guestEmail" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                      Email Id
                    </label>
                    <input
                      id="guestEmail"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => { setGuestEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })); }}
                      placeholder="Email id"
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow"
                      style={{
                        backgroundColor: 'var(--paper-sunk)',
                        border: fieldErrors.email ? '1.5px solid var(--error)' : '1px solid var(--border-subtle)',
                        color: 'var(--ink)',
                        '--tw-ring-color': fieldErrors.email ? 'var(--error)' : 'var(--brass)',
                      } as React.CSSProperties}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="guestPhone" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                      Mobile Number
                    </label>
                    <input
                      id="guestPhone"
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={guestPhone}
                      onChange={(e) => { setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: undefined })); }}
                      placeholder="10-digit mobile no"
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow"
                      style={{
                        backgroundColor: 'var(--paper-sunk)',
                        border: fieldErrors.phone ? '1.5px solid var(--error)' : '1px solid var(--border-subtle)',
                        color: 'var(--ink)',
                        '--tw-ring-color': fieldErrors.phone ? 'var(--error)' : 'var(--brass)',
                      } as React.CSSProperties}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="specialRequests" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Special Requests <span className="font-normal" style={{ color: 'var(--ink-muted)' }}>(Optional)</span>
                  </label>
                  <textarea
                    id="specialRequests"
                    rows={3}
                    value={specialRequests}
                    maxLength={500}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Early check-in, extra towels…"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 resize-none transition-shadow"
                    style={{
                      backgroundColor: 'var(--paper-sunk)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                {/* Promo code */}
                <div className="space-y-2">
                  {appliedCode ? (
                    <div
                      className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor: 'rgba(21,128,61,0.07)',
                        border: '1px solid rgba(21,128,61,0.25)',
                        color: 'var(--ink)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#15803d' }} />
                        <span>
                          <span className="font-black tracking-wide">{appliedCode}</span>
                          {': '}
                          <span style={{ color: '#15803d' }}>{promoMessage}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearPromo}
                        data-test="discount-code-remove"
                        className="flex-shrink-0 rounded-full p-1 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        aria-label="Remove discount code"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color: 'var(--ink-muted)' }}
                        />
                        <input
                          type="text"
                          value={promoInput}
                          data-test="discount-code-input"
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20));
                            if (promoStatus === 'invalid') { setPromoStatus('idle'); setPromoError(''); }
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                          placeholder="Enter Coupon Code"
                          disabled={promoStatus === 'checking'}
                          className="w-full rounded-xl pl-9 pr-4 py-3 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 transition-shadow"
                          style={{
                            backgroundColor: 'var(--paper-sunk)',
                            border: promoStatus === 'invalid'
                              ? '1px solid rgba(179,38,30,0.5)'
                              : '1px solid var(--border-subtle)',
                            color: 'var(--ink)',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyPromo}
                        data-test="discount-code-apply"
                        disabled={!promoInput.trim() || promoStatus === 'checking'}
                        className="flex-shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--maroon)',
                          color: '#fff',
                        }}
                      >
                        {promoStatus === 'checking' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : 'Apply'}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--error)' }}>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {promoError}
                    </p>
                  )}
                </div>

                <div
                  className="p-4 rounded-2xl text-sm flex items-start gap-3"
                  style={{
                    backgroundColor: 'var(--maroon-tint)',
                    border: '1px solid var(--border-brass)',
                    color: 'var(--ink-muted)',
                  }}
                >
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                  <span>
                    <strong style={{ color: 'var(--ink)' }}>Secure Payment</strong>{' '}
                    256-bit SSL encrypted. Your card details are never stored on our servers.
                  </span>
                </div>

                {serverError && (
                  <div
                    className="flex items-center gap-2.5 p-3 rounded-xl text-sm"
                    style={{ backgroundColor: 'rgba(179,38,30,0.07)', border: '1px solid rgba(179,38,30,0.2)', color: 'var(--error)' }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || !breakdown}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {' Pay ₹'}
                      {breakdown
                        ? (shownTotal / 100).toLocaleString("en-IN")
                        : '...'}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* ── Stay summary ───────────────────────────────── */}
            <div
              className="md:col-span-5 p-6 rounded-3xl shadow-md space-y-4"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <h2 className="text-lg font-bold pb-3" style={{ color: 'var(--maroon)', borderBottom: '1px solid var(--border-subtle)' }}>
                Booking Summary
              </h2>

              <div className="text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>Check-in</span>
                  <span className="font-semibold">{fmtDate(checkIn)} at {formatTime12(property.check_in_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>Check-out</span>
                  <span className="font-semibold">{fmtDate(checkOut)} at {formatTime12(property.check_out_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>Guests</span>
                  <span className="font-semibold">{guestsLine}</span>
                </div>
                {breakdown && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ink-muted)' }}>Duration</span>
                    <span className="font-semibold">{breakdown.num_nights} night{breakdown.num_nights === 1 ? '' : 's'}</span>
                  </div>
                )}
              </div>

              {breakdown && (
                <div className="pt-3 text-sm space-y-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                    <span>Base price ({breakdown.num_nights} night{breakdown.num_nights === 1 ? '' : 's'})</span>
                    <span>₹{(breakdown.base_amount / 100).toLocaleString('en-IN')}</span>
                  </div>
                  {breakdown.extra_guest_amount > 0 && (
                    <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                      <span>Extra guests ({breakdown.extra_guests_count})</span>
                      <span>₹{(breakdown.extra_guest_amount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between font-semibold" style={{ color: '#15803d' }}>
                      <span>Discount ({appliedCode})</span>
                      <span>−₹{(appliedDiscount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                    <span>GST ({GST_PERCENT}%)</span>
                    <span>₹{(shownTax / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div
                    className="flex justify-between text-base font-black pt-2.5"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <span style={{ color: 'var(--ink)' }}>Total Payable</span>
                    <span style={{ color: 'var(--brass-ink)' }}>
                      ₹{(shownTotal / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-xs" style={{ color: 'var(--ink-muted)' }}>
                      <span>Original price</span>
                      <span className="line-through">₹{(breakdown.total_amount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                    All prices in INR and inclusive of GST. A security deposit, where applicable, is collected upon check-in.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Shared chrome for every step of the checkout route.
 *
 * The date-picker step used to render with no header at all, which made it the
 * only screen in the app floating on a bare background. It once took a
 * `secured` flag for a Razorpay badge; the badge is gone, so the flag went
 * with it rather than sitting unread in the signature.
 */
function CheckoutHeader({ property }: { property: Property }) {
  return (
    <header
      className="sticky top-0 z-40 px-4 sm:px-8 h-[80px] flex items-center justify-center"
      style={{ backgroundColor: 'var(--maroon-deep)', borderBottom: '1px solid rgba(168,116,50,0.28)' }}
    >
      <Link
        href="/"
        className="flex flex-col items-end group py-2"
        aria-label={`${property.name} by Habbaa home`}
      >
        <Image
          src="/villa19-wordmark-knockout.svg"
          alt={property.name}
          width={132}
          height={30}
          priority
          className="block w-[107px] md:w-[132px] h-auto transition-opacity group-hover:opacity-90"
        />
        <Image
          src="/by-habbaa-white.svg"
          alt="by Habbaa"
          width={70}
          height={25}
          priority
          className="block w-[46px] md:w-[60px] h-auto mt-[-3px] md:mt-[6px]"
        />
      </Link>
    </header>
  );
}

export default function BookingCheckout({ property, pricingRules, ratesReadAt }: Props) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--paper)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brass)' }} />
      </div>
    }>
      <CheckoutContent property={property} pricingRules={pricingRules} ratesReadAt={ratesReadAt} />
    </Suspense>
  );
}
