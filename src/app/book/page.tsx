'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_MANGALORE_VILLA } from '@/lib/mock-data';
import { calculateBookingPrice } from '@/lib/pricing-engine';
import { Lock, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function BookingCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const property = MOCK_MANGALORE_VILLA;

  // Read all params from BookingWidget navigation
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const adults = parseInt(searchParams.get('adults') ?? '2', 10);
  const children = parseInt(searchParams.get('children') ?? '0', 10);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [serverError, setServerError] = useState('');

  // Validate that we have the required params before computing price
  const hasValidParams = checkIn && checkOut && !isNaN(adults);

  let breakdown = null;
  let paramError = '';

  if (!hasValidParams) {
    paramError = 'Missing booking details. Please select your dates from the property page.';
  } else {
    try {
      breakdown = calculateBookingPrice(property, [], checkIn, checkOut, adults, children);
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
      // Step 1: Create Razorpay order on server
      const orderRes = await fetch('/api/bookings/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn,
          checkOut,
          adults,
          children,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error ?? 'Could not create booking order. Please try again.');
      }

      // Step 2: Open Razorpay checkout (SDK must be loaded via script in layout)
      const { bookingReference } = orderData;
      setBookingRef(bookingReference);
      setIsSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#FFFCF0] text-[#1A1208] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[rgba(30,138,122,0.3)] shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-[rgba(30,138,122,0.08)] text-[#1E8A7A] rounded-full flex items-center justify-center mx-auto border border-[rgba(30,138,122,0.25)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold text-[#1E8A7A] uppercase tracking-widest">Payment Verified</span>
            <h1 className="text-2xl font-black text-[#562424] mt-1">Booking Confirmed!</h1>
            <p className="text-xs text-[#6B7A8A] mt-2">
              Thank you, <strong className="text-[#1A1208]">{guestName}</strong>. Your reservation has been locked.
            </p>
          </div>

          <div className="bg-[#F0EBE0] p-4 rounded-2xl border border-[rgba(0,0,0,0.09)] text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-[rgba(0,0,0,0.09)] pb-2">
              <span className="text-[#6B7A8A]">Booking Reference</span>
              <span className="font-mono font-extrabold text-[#A87432]">{bookingRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7A8A]">Check-In</span>
              <span className="font-semibold text-[#1A1208]">{checkIn} ({property.check_in_time})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7A8A]">Check-Out</span>
              <span className="font-semibold text-[#1A1208]">{checkOut} ({property.check_out_time})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7A8A]">Guests</span>
              <span className="font-semibold text-[#1A1208]">{adults} adults{children > 0 ? `, ${children} children` : ''}</span>
            </div>
            {breakdown && (
              <div className="flex justify-between pt-2 border-t border-[rgba(0,0,0,0.09)]">
                <span className="text-[#6B7A8A]">Total Paid</span>
                <span className="font-black text-[#1E8A7A]">₹{(breakdown.total_amount / 100).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#6B7A8A]">
            A confirmation receipt has been sent to <strong>{guestEmail}</strong>.
          </p>

          <Link href="/" className="btn-primary w-full block text-center text-xs font-bold uppercase tracking-wider">
            Return to Property
          </Link>
        </div>
      </main>
    );
  }

  if (paramError) {
    return (
      <main className="min-h-screen bg-[#FFFCF0] text-[#1A1208] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-lg text-center space-y-5">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#562424]">Invalid Booking Details</h1>
          <p className="text-xs text-[#6B7A8A]">{paramError}</p>
          <Link href="/" className="btn-primary block w-full text-xs">
            ← Back to Villa
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF0] text-[#1A1208] flex flex-col">
      {/* Minimal header — dark navy for consistency */}
      <header className="sticky top-0 z-40 bg-[#562424] backdrop-blur-xl border-b border-white/8 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/habbaa-logo-white.svg"
            alt="Habbaa"
            width={44}
            height={44}
            className="rounded-full flex-shrink-0"
            priority
          />
          <div className="flex flex-col leading-tight hidden sm:flex">
            <span className="text-base font-bold text-white">{property.name}</span>
            <span className="text-[11px] font-medium tracking-widest text-[#C9944A] uppercase mt-0.5">By Habbaa</span>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5DB8AC]" aria-hidden="true" />
            <span className="font-semibold text-white/70">Secured by Razorpay</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7A8A] hover:text-[#A87432] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Villa Details
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Guest Form */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[rgba(0,0,0,0.09)] shadow-md space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-[#A87432] text-white text-[10px] font-black flex items-center justify-center">1</span>
                <span className="text-[10px] font-bold text-[#6B7A8A] uppercase tracking-widest">Guest Details</span>
              </div>
              <h1 className="text-2xl font-black text-[#562424]">Complete Your Booking</h1>
              <p className="text-xs text-[#6B7A8A] mt-1">Enter the primary guest details. Booking confirmation will be sent to your email and WhatsApp. <span className="text-[#A87432]">* Required</span></p>
            </div>

            <form onSubmit={handlePayment} className="space-y-4" noValidate>
              <div>
                <label htmlFor="guestName" className="text-xs font-bold text-[#4A5568] block mb-1">
                  Full Name *
                </label>
                <input
                  id="guestName"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#FFFCF0] border border-[rgba(0,0,0,0.12)] rounded-xl px-4 py-3 text-xs text-[#1A1208] focus:outline-none focus:border-[#A87432]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guestEmail" className="text-xs font-bold text-[#4A5568] block mb-1">
                    Email Address *
                  </label>
                  <input
                    id="guestEmail"
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-[#FFFCF0] border border-[rgba(0,0,0,0.12)] rounded-xl px-4 py-3 text-xs text-[#1A1208] focus:outline-none focus:border-[#A87432]"
                  />
                </div>

                <div>
                  <label htmlFor="guestPhone" className="text-xs font-bold text-[#4A5568] block mb-1">
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
                    className="w-full bg-[#FFFCF0] border border-[rgba(0,0,0,0.12)] rounded-xl px-4 py-3 text-xs text-[#1A1208] focus:outline-none focus:border-[#A87432]"
                  />
                  <p className="text-[10px] text-[#8A9AAA] mt-1">10-digit Indian mobile number</p>
                </div>
              </div>

              <div>
                <label htmlFor="specialRequests" className="text-xs font-bold text-[#4A5568] block mb-1">
                  Special Requests <span className="text-[#8A9AAA] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="specialRequests"
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Early check-in, dietary restrictions, extra towels…"
                  className="w-full bg-[#FFFCF0] border border-[rgba(0,0,0,0.12)] rounded-xl px-4 py-3 text-xs text-[#1A1208] focus:outline-none focus:border-[#A87432] resize-none"
                />
              </div>

              <div className="p-4 bg-[rgba(168,116,50,0.06)] border border-[rgba(168,116,50,0.2)] rounded-2xl text-xs text-[#6B5020] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#A87432] mt-0.5" />
                <span>
                  <strong>Secure Payment via Razorpay.</strong> 256-bit SSL encrypted. Your card details are never stored on our servers.
                </span>
              </div>

              {serverError && (
                <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || !breakdown}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-extrabold"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pay ₹{breakdown ? (breakdown.total_amount / 100).toLocaleString('en-IN') : '—'} via Razorpay</>
                )}
              </button>
            </form>
          </div>

          {/* Stay Summary */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-[rgba(0,0,0,0.09)] shadow-md space-y-4">
            <h2 className="text-base font-bold text-[#562424] border-b border-[rgba(0,0,0,0.09)] pb-3">Stay Summary</h2>

            <div className="flex items-center gap-3 pb-3 border-b border-[rgba(0,0,0,0.09)]">
              <div className="w-12 h-12 rounded-full bg-[#562424] flex-shrink-0 overflow-hidden">
                <Image
                  src="/habbaa-logo-white.svg"
                  alt="Habbaa"
                  width={48}
                  height={48}
                  className="w-full h-full"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1208]">{property.name}</h3>
                <p className="text-[11px] text-[#C9944A] font-medium tracking-widest uppercase">By Habbaa</p>
              </div>
            </div>

            <div className="text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#6B7A8A]">Check-in</span>
                <span className="font-semibold text-[#1A1208]">{checkIn} at {property.check_in_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A8A]">Check-out</span>
                <span className="font-semibold text-[#1A1208]">{checkOut} at {property.check_out_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A8A]">Guests</span>
                <span className="font-semibold text-[#1A1208]">
                  {adults} adults{children > 0 ? `, ${children} children` : ''}
                </span>
              </div>
              {breakdown && (
                <div className="flex justify-between">
                  <span className="text-[#6B7A8A]">Duration</span>
                  <span className="font-semibold text-[#1A1208]">{breakdown.num_nights} nights</span>
                </div>
              )}
            </div>

            {breakdown && (
              <div className="pt-3 border-t border-[rgba(0,0,0,0.09)] text-xs space-y-2.5">
                <div className="flex justify-between text-[#6B7A8A]">
                  <span>Base stay ({breakdown.num_nights} nights)</span>
                  <span>₹{(breakdown.base_amount / 100).toLocaleString('en-IN')}</span>
                </div>
                {breakdown.extra_guest_amount > 0 && (
                  <div className="flex justify-between text-[#6B7A8A]">
                    <span>Extra guests ({breakdown.extra_guests_count})</span>
                    <span>₹{(breakdown.extra_guest_amount / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7A8A]">
                  <span>GST (18%)</span>
                  <span>₹{(breakdown.tax_amount / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#1A1208] pt-2.5 border-t border-[rgba(0,0,0,0.09)]">
                  <span>Total Payable</span>
                  <span className="text-[#A87432]">₹{(breakdown.total_amount / 100).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-[#8A9AAA] pt-1">
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

export default function BookingCheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FFFCF0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#A87432] animate-spin" />
      </main>
    }>
      <BookingCheckoutContent />
    </Suspense>
  );
}
