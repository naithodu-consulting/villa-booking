'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import type { Property, PricingRule } from '@/types';
import { calculateBookingPrice } from '@/lib/pricing-engine';
import DateSelectForm from '@/components/guest/DateSelectForm';
import { isRangeAvailable } from '@/lib/availability';
import { useNightCalendar } from '@/components/guest/useNightCalendar';
import { Lock, ShieldCheck, ArrowLeft, AlertCircle, Loader2, Tag, X, CheckCircle } from 'lucide-react';
import { formatTime12 } from '@/lib/format';
import { GSTIN_PATTERN } from '@/lib/gstin';

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
}

function CheckoutContent({ property, pricingRules }: Props) {
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

  const [guestName,        setGuestName]        = useState('');
  const [guestEmail,       setGuestEmail]       = useState('');
  const [guestPhone,       setGuestPhone]       = useState('');
  const [specialRequests,  setSpecialRequests]  = useState('');
  const [wantsGstInvoice,  setWantsGstInvoice]  = useState(false);
  const [guestCompany,     setGuestCompany]     = useState('');
  const [guestGstin,       setGuestGstin]       = useState('');
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [serverError,      setServerError]      = useState('');
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
  // Catches a stale link or a night taken since the guest picked dates, before
  // they fill in the form. create-order still re-checks under a lock at payment.
  const { unavailable, loadRange } = useNightCalendar(property.id);
  useEffect(() => { loadRange(checkIn, checkOut); }, [checkIn, checkOut, loadRange]);

  const hasValidParams = checkIn && checkOut && !isNaN(adults);
  // No dates at all is not an error state: the header BOOK NOW button on every
  // page links to a bare /book, so this is the commonest way in.
  const needsDates = !checkIn && !checkOut;

  let breakdown = null;
  let paramError = '';

  if (!hasValidParams) {
    paramError = 'Missing booking details. Please select your dates from the property page.';
  } else {
    try {
      breakdown = calculateBookingPrice(property, pricingRules, checkIn, checkOut, adults, children);
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
        setPromoCode(data.code);
        setPromoDiscount(data.discountAmountPaise);
        setPromoTax(data.taxAmountPaise ?? null);
        setPromoTotal(data.totalAmountPaise ?? null);
        setPromoMessage(data.message);
        setPromoStatus('valid');
        setPromoFor(`${checkIn}|${checkOut}|${adults}|${children}`);
      } else {
        setPromoCode(null);
        setPromoDiscount(0);
        setPromoError(data.error ?? 'Invalid promo code.');
        setPromoStatus('invalid');
      }
    } catch {
      setPromoCode(null);
      setPromoDiscount(0);
      setPromoError('Could not check promo code. Please try again.');
      setPromoStatus('invalid');
    }
  };

  const clearPromo = () => {
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

  // The discount comes off before GST, so an applied code lowers the tax too.
  // Both figures come from the server; the browser never re-derives the rule.
  const shownTax =
    appliedCode && promoTax !== null ? promoTax : (breakdown?.tax_amount ?? 0);
  const shownTotal =
    appliedCode && promoTotal !== null
      ? promoTotal
      : (breakdown?.total_amount ?? 0);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown) return;

    setServerError('');
    setIsProcessing(true);

    try {
      // Load the gateway first so a failure never leaves a pending hold on the dates.
      await loadRazorpay();

      const orderRes = await fetch('/api/bookings/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn, checkOut, adults, children,
          guestName, guestEmail, guestPhone, specialRequests,
          ...(wantsGstInvoice && { guestCompany: guestCompany.trim(), guestGstin }),
          ...(appliedCode && { promoCode: appliedCode }),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? 'Could not create booking order. Please try again.');

      const { bookingToken, razorpayOrderId, razorpayKeyId, amount } = orderData;

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:       razorpayKeyId,
          order_id:  razorpayOrderId,
          amount,
          currency:  'INR',
          name:      `${property.name} by Habbaa`,
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
        rzp.open();
      });

      router.replace(`/booking/${bookingToken}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (msg !== 'DISMISSED') setServerError(msg);
      setIsProcessing(false);
    }
  };

  // ── Date selection: arrived without dates ─────────────────────────────
  if (needsDates) {
    return (
      <>
      <CheckoutHeader property={property} />
      <div className="flex-1 flex items-start sm:items-center justify-center p-4 py-10 sm:py-4">
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
            maxOccupancy={property.max_occupancy}
            idealOccupancy={property.ideal_occupancy}
            propertyId={property.id}
            onContinue={(query) => router.push(`/book?${query}`)}
          />

          <Link href="/" className="block text-center text-sm font-semibold" style={{ color: 'var(--maroon)' }}>
            Back
          </Link>
        </div>
      </div>
      </>
    );
  }

  // ── Param error screen: dates were supplied but do not make sense ─────
  if (paramError) {
    return (
      <>
      <CheckoutHeader property={property} />
      <div className="flex-1 flex items-center justify-center p-4">
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
      </div>
      </>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ color: 'var(--ink)', backgroundColor: 'var(--paper)' }}>
      <Script src={RAZORPAY_SRC} strategy="afterInteractive" />

      <CheckoutHeader property={property} />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
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
                  Enter the primary guest details. Confirmation goes to your email and WhatsApp.{' '}
                  <span style={{ color: 'var(--brass-ink)' }}>* Required</span>
                </p>
              </div>

              <form onSubmit={handlePayment} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="guestName" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Full Name *
                  </label>
                  <input
                    id="guestName"
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full name as per ID"
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 transition-shadow"
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guestEmail" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                      Email Address *
                    </label>
                    <input
                      id="guestEmail"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Your Email Address"
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 transition-shadow"
                      style={{
                        backgroundColor: 'var(--paper)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="guestPhone" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                      Mobile Number *
                    </label>
                    <input
                      id="guestPhone"
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 transition-shadow"
                      style={{
                        backgroundColor: 'var(--paper)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--ink)',
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>10-digit Indian mobile number</p>
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
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Early check-in, dietary restrictions, extra towels…"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 resize-none transition-shadow"
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                {/* Every booking gets a GST invoice. These fields only put a business
                    on it, so the company can claim the input tax. */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-sm font-bold cursor-pointer" style={{ color: 'var(--ink-muted)' }}>
                    <input
                      type="checkbox"
                      checked={wantsGstInvoice}
                      onChange={(e) => setWantsGstInvoice(e.target.checked)}
                      className="w-4 h-4 accent-[var(--maroon)]"
                    />
                    Invoice in a company name (GST)
                  </label>
                  {wantsGstInvoice && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="guestCompany" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                          Company Name *
                        </label>
                        <input
                          id="guestCompany"
                          type="text"
                          required
                          maxLength={120}
                          value={guestCompany}
                          onChange={(e) => setGuestCompany(e.target.value)}
                          placeholder="As registered for GST"
                          className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 transition-shadow"
                          style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--border-subtle)', color: 'var(--ink)' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="guestGstin" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                          GSTIN *
                        </label>
                        <input
                          id="guestGstin"
                          type="text"
                          required
                          pattern={GSTIN_PATTERN}
                          title="15-character GSTIN, e.g. 29ABCDE1234F1Z5"
                          value={guestGstin}
                          onChange={(e) => setGuestGstin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15))}
                          placeholder="29ABCDE1234F1Z5"
                          autoCapitalize="characters"
                          className="w-full rounded-xl px-4 py-3 text-base tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:ring-offset-1 transition-shadow"
                          style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--border-subtle)', color: 'var(--ink)' }}
                        />
                      </div>
                    </div>
                  )}
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
                          {' — '}
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
                            backgroundColor: 'var(--paper)',
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
                Stay Summary
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
                  <span className="font-semibold">{adults} adults{children > 0 ? `, ${children} children` : ''}</span>
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
                    <span>Base stay ({breakdown.num_nights} night{breakdown.num_nights === 1 ? '' : 's'})</span>
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
                    <span>GST (18%)</span>
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
                    All prices in INR and inclusive of GST. A security deposit, where applicable, is collected at check-in.
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
      className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between"
      style={{ backgroundColor: 'var(--maroon-deep)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Link href="/" className="flex items-center gap-3" aria-label="Back to villa">
        <Image src="/villa19-wordmark-knockout.svg" alt={property.name} width={107} height={24} className="flex-shrink-0" priority />
      </Link>
    </header>
  );
}

export default function BookingCheckout({ property, pricingRules }: Props) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--paper)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brass)' }} />
      </div>
    }>
      <CheckoutContent property={property} pricingRules={pricingRules} />
    </Suspense>
  );
}
