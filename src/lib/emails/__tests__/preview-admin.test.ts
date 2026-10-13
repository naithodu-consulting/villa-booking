import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { renderAdminNewBooking } from '@/lib/emails/admin-new-booking';

const OUT = process.env.ADMIN_PREVIEW_OUT;

/** Same-day arrival with a special request: the two cases the host must notice. */
it.runIf(OUT)('writes an admin notice preview', () => {
  const { subject, html, text } = renderAdminNewBooking({
    bookingRef: 'V19-8PE-1D8',
    guestName: 'Prashanth Nayak',
    guestEmail: 'prashanthn52@gmail.com',
    guestPhone: '9999999999',
    checkIn: '2026-10-13',
    checkOut: '2026-10-14',
    checkInTime: '14:00',
    checkOutTime: '10:00',
    nights: 1,
    adults: 8,
    children: 0,
    baseAmount: 1_400_000,
    extraGuestAmount: 0,
    discountAmount: 0,
    taxAmount: 252_000,
    totalAmount: 1_652_000,
    amountPaidPaise: 1_652_000,
    paidInFull: true,
    channel: 'Online (Razorpay)',
    bookedAt: '2026-10-13T12:19:00Z',
    bookingUrl: 'https://villa-booking-psi.vercel.app/booking/sample-token',
    specialRequests: 'Arriving around 9pm, please keep the gate open. One guest is vegetarian.',
    today: '2026-10-13',
  });
  writeFileSync(OUT!, html);
  writeFileSync(`${OUT!}.txt`, text);
  console.log(subject);
});
