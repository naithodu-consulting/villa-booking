import type { BookingConfirmationContext } from '@/lib/emails/booking-confirmation';
import { SITE_URL } from '@/lib/seo';

/**
 * A representative booking for the preview and the live test send: extra
 * guests, a discount code and a multi-night stay, so every conditional row in
 * the template renders.
 */
export const SAMPLE_CONFIRMATION: BookingConfirmationContext = {
  guestName: 'Prashanth Nayak',
  guestEmail: 'prashanth@example.com',
  guestPhone: '919876543210',
  bookingRef: 'V19-7KQ-M4X',
  // Built from the real configured site, never a literal: a preview or test
  // send must not go out carrying a domain that exists nowhere.
  bookingUrl: `${SITE_URL}/booking/sample-token`,
  cancellationUrl: `${SITE_URL}/cancellation`,
  whatsappNumber: '919876543210',
  propertyName: 'Villa 19 by Habbaa',
  propertyShortName: 'Villa 19',
  propertyLocation: 'Urwa, Mangalore, Karnataka',
  checkIn: '2026-11-20',
  checkOut: '2026-11-23',
  checkInTime: '14:00',
  checkOutTime: '10:00',
  nights: 3,
  adults: 6,
  children: 2,
  bookedAt: '2026-10-07T11:02:00Z',
  baseAmount: 6_000_000,
  extraGuestAmount: 600_000,
  extraGuests: 2,
  discountAmount: 660_000,
  discountCode: 'WELCOME10',
  taxAmount: 1_069_200,
  totalAmount: 7_009_200,
  paymentMethod: 'Razorpay',
  paidInFull: true,
  amountPaidPaise: 7_009_200,
  additionalGuestsNote: true,
};
