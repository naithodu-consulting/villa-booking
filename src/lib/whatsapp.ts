/**
 * Prefilled WhatsApp link for guests to send their ID documents.
 *
 * The message carries only the booking number and the adult count: no name,
 * no dates. The link text passes through WhatsApp's servers and the guest's
 * browser history, so it holds nothing a booking number does not already say.
 */
export const ACCEPTED_ID_TYPES = ['Aadhaar', 'Passport', 'Driving Licence'] as const;

export function idShareWhatsAppUrl(whatsappNumber: string, bookingCode: string, adults: number): string {
  const count = adults === 1 ? '1 adult' : `${adults} adults`;
  const text =
    `Hi, sharing ID documents for booking ${bookingCode} (${count}). ` +
    'Attaching one photo per adult guest: Aadhaar, passport or driving licence.';
  return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

/**
 * "I want to book" as a prefilled WhatsApp message.
 *
 * The same wording the homepage's mobile CTA bar has always used, so a guest
 * who taps Enquire Now in either place arrives in the same conversation.
 */
export function enquiryWhatsAppUrl(whatsappNumber: string, propertyName?: string): string {
  const text = `Hi, I'm interested in booking ${propertyName ?? 'Villa 19'}`;
  return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
