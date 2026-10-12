/**
 * Prefilled WhatsApp link for guests to send their ID documents.
 *
 * The message carries only the booking number and the adult count: no name,
 * no dates. The link text passes through WhatsApp's servers and the guest's
 * browser history, so it holds nothing a booking number does not already say.
 */
export const ACCEPTED_ID_TYPES = ['Aadhaar', 'Passport', 'Driving licence'] as const;

export function idShareWhatsAppUrl(whatsappNumber: string, bookingCode: string, adults: number): string {
  const count = adults === 1 ? '1 adult' : `${adults} adults`;
  const text =
    `Hi, sharing ID documents for booking ${bookingCode} (${count}). ` +
    'Attaching one photo per adult guest: Aadhaar, passport or driving licence.';
  return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
