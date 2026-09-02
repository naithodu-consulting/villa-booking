'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import type { Property, PricingRule } from '@/types';
import { calculateBookingPrice } from '@/lib/pricing-engine';
import { Lock, ShieldCheck, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
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
  const adults   = parseInt(searchParams.get('adults')   ?? '2', 10);

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
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [serverError,      setServerError]      = useState('');

  const hasValidParams = checkIn && checkOut && !isNaN(adults);

  let breakdown = null;
  let paramError = '';

  if (!hasValidParams) {
    paramError = 'Missing booking details. Please select your dates from the property page.';
  } else {
    try {
      breakdown = calculateBookingPrice(property, pricingRules, checkIn, checkOut, adults, children);
    } catch (err) {
      paramError = err instanceof Error ? err.message : 'Invalid date range. Please go back and reselect.';
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown) return;

    setServerError('');
    setIsProcessing(true);

    try {
      const orderRes = await fetch('/api/bookings/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn, checkOut, adults, children,
          guestName, guestEmail, guestPhone, specialRequests,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? 'Could not create booking order. Please try again.');

      const { bookingReference, razorpayOrderId, razorpayKeyId, amount } = orderData;

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

      router.replace(`/booking/${bookingReference}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (msg !== 'DISMISSED') setServerError(msg);
      setIsProcessing(false);
    }
  };

  // ── Param error screen ────────────────────────────────────────────────
  if (paramError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--paper)' }}>
        <div
          className="max-w-md w-full p-8 rounded-3xl text-center space-y-5 shadow-lg"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <AlertCircle className="w-12 h-12 mx-auto" style={{ color: 'var(--error)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
            Invalid Booking Details
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{paramError}</p>
          <Link href="/" className="btn-primary block w-full text-sm">← Back to Villa</Link>
        </div>
      </div>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ color: 'var(--ink)', backgroundColor: 'var(--paper)' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />

      {/* Minimal checkout header */}
      <header
        className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: 'var(--maroon)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Link href="/" className="flex items-center gap-3" aria-label="Back to villa">
          <Image src="/habbaa-logo-white.svg" alt="Habbaa" width={44} height={44} className="rounded-full flex-shrink-0" priority />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-bold text-white">{property.name}</span>
            <span className="text-xs font-medium tracking-widest uppercase mt-0.5" style={{ color: 'var(--brass-light)' }}>By Habbaa</span>
          </div>
        </Link>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--brass-light)' }} aria-hidden="true" />
          <span className="font-semibold text-white/70">Secured by Razorpay</span>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--ink-muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Villa Details
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
                <h1 className="text-2xl font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
                  Complete Your Booking
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
                  Enter the primary guest details. Confirmation goes to your email and WhatsApp.{' '}
                  <span style={{ color: 'var(--brass)' }}>* Required</span>
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
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
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
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                      style={{
                        backgroundColor: 'var(--paper)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="guestPhone" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                      Mobile (WhatsApp) *
                    </label>
                    <input
                      id="guestPhone"
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                      style={{
                        backgroundColor: 'var(--paper)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--ink)',
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>10-digit Indian mobile number</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="specialRequests" className="text-sm font-bold block mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Special Requests <span className="font-normal" style={{ color: 'var(--ink-faint)' }}>(Optional)</span>
                  </label>
                  <textarea
                    id="specialRequests"
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Early check-in, dietary restrictions, extra towels…"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--ink)',
                    }}
                  />
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
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-extrabold disabled:opacity-60"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Pay ₹{breakdown ? (breakdown.total_amount / 100).toLocaleString('en-IN') : '...'}</>
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

              <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--maroon)' }}>
                  <Image src="/habbaa-logo-white.svg" alt="Habbaa" width={48} height={48} className="w-full h-full" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{property.name}</p>
                  <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--brass)' }}>By Habbaa</p>
                </div>
              </div>

              <div className="text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>Check-in</span>
                  <span className="font-semibold">{fmtDate(checkIn)} at {property.check_in_time}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>Check-out</span>
                  <span className="font-semibold">{fmtDate(checkOut)} at {property.check_out_time}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>Guests</span>
                  <span className="font-semibold">{adults} adults{children > 0 ? `, ${children} children` : ''}</span>
                </div>
                {breakdown && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ink-muted)' }}>Duration</span>
                    <span className="font-semibold">{breakdown.num_nights} nights</span>
                  </div>
                )}
              </div>

              {breakdown && (
                <div className="pt-3 text-sm space-y-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                    <span>Base stay ({breakdown.num_nights} nights)</span>
                    <span>₹{(breakdown.base_amount / 100).toLocaleString('en-IN')}</span>
                  </div>
                  {breakdown.extra_guest_amount > 0 && (
                    <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                      <span>Extra guests ({breakdown.extra_guests_count})</span>
                      <span>₹{(breakdown.extra_guest_amount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                    <span>GST (18%)</span>
                    <span>₹{(breakdown.tax_amount / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div
                    className="flex justify-between text-base font-black pt-2.5"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <span style={{ color: 'var(--ink)' }}>Total Payable</span>
                    <span style={{ color: 'var(--brass)' }}>₹{(breakdown.total_amount / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
                    All prices in INR incl. 18% GST. Security deposit (if any) collected at check-in.
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
