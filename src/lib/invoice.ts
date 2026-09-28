import 'server-only';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { ENTITY } from '@/lib/entity';

/**
 * GST tax invoice for a confirmed booking, as a PDF.
 *
 * Accommodation is taxed where the property is, and the supplier is registered
 * in the same state (Karnataka), so every invoice is intra-state: the 18% is
 * split into CGST 9% and SGST 9%, never IGST, whatever state the guest is from.
 *
 * Amounts come from the booking row (paise), not a recalculation, so the invoice
 * always matches what was charged. The standard PDF fonts have no rupee glyph,
 * so amounts print as "Rs.".
 */

/** SAC for room or unit accommodation services. */
export const ACCOMMODATION_SAC = '996311';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;      // YYYY-MM-DD
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestCompany?: string | null;
  guestGstin?: string | null;
  propertyName: string;
  propertyAddress: string;  // e.g. "Urwa, Mangalore, Karnataka 575006"
  checkIn: string;          // YYYY-MM-DD
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  baseAmount: number;       // paise
  extraGuestAmount: number; // paise
  taxAmount: number;        // paise
  totalAmount: number;      // paise
}

/** CGST gets the lower half of an odd paisa, SGST the rest, so the two always sum to the tax charged. */
export function splitGst(taxPaise: number): { cgst: number; sgst: number } {
  const cgst = Math.floor(taxPaise / 2);
  return { cgst, sgst: taxPaise - cgst };
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  return n < 20 ? ONES[n] : [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(' ');
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Indian numbering (lakh, crore): 7316000 paise -> "Rupees Seventy Three Thousand One Hundred Sixty Only". */
export function amountInWords(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5);  n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  const words = parts.length ? parts.join(' ') : 'Zero';
  return `Rupees ${words}${p ? ` and ${belowHundred(p)} Paise` : ''} Only`;
}

const rs = (paise: number) =>
  `Rs. ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Tax Invoice ${d.invoiceNumber}`);
  doc.setAuthor(ENTITY.name);

  const page: PDFPage = doc.addPage([595.28, 841.89]); // A4
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.07, 0.03);
  const muted = rgb(0.43, 0.38, 0.34);
  const maroon = rgb(0.36, 0.09, 0.2);
  const rule = rgb(0.85, 0.82, 0.78);

  const L = 48;
  const R = 595.28 - 48;
  let y = 800;

  const text = (s: string, x: number, size = 9.5, font = regular, color = ink) =>
    page.drawText(s, { x, y, size, font, color });
  const right = (s: string, xRight: number, size = 9.5, font = regular, color = ink) =>
    page.drawText(s, { x: xRight - font.widthOfTextAtSize(s, size), y, size, font, color });
  const hr = (gap = 10) => {
    y -= gap;
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.6, color: rule });
    y -= gap + 4;
  };

  // ── Title and supplier ──
  text('TAX INVOICE', L, 18, bold, maroon);
  right(d.invoiceNumber, R, 11, bold);
  y -= 16;
  right(`Date: ${longDate(d.invoiceDate)}`, R, 9.5, regular, muted);
  y -= 22;

  text(ENTITY.name, L, 11, bold);
  y -= 14;
  for (const line of wrap(ENTITY.address, regular, 9.5, 300)) { text(line, L, 9.5, regular, muted); y -= 12; }
  text(`GSTIN: ${ENTITY.gstin}    CIN: ${ENTITY.cin}`, L, 9.5, regular, muted);
  y -= 12;
  text(`State: ${ENTITY.stateName} (${ENTITY.stateCode})`, L, 9.5, regular, muted);
  hr();

  // ── Bill to / supply details ──
  const colR = 330;
  const top = y;
  text('BILL TO', L, 8.5, bold, muted);
  y -= 14;
  const billTo = [
    ...(d.guestCompany ? [[d.guestCompany, bold] as const] : []),
    ...(d.guestGstin ? [[`GSTIN: ${d.guestGstin}`, regular] as const] : []),
    [d.guestCompany ? `Attn: ${d.guestName}` : d.guestName, d.guestCompany ? regular : bold] as const,
    [d.guestEmail, regular] as const,
    ...(d.guestPhone ? [[d.guestPhone, regular] as const] : []),
  ];
  for (const [s, f] of billTo) { text(s, L, 9.5, f); y -= 12; }
  const leftEnd = y;

  y = top;
  text('SUPPLY DETAILS', colR, 8.5, bold, muted);
  y -= 14;
  for (const [k, v] of [
    ['Booking no.', d.bookingCode],
    ['Place of supply', `${ENTITY.stateName} (${ENTITY.stateCode})`],
    ['Reverse charge', 'No'],
  ]) {
    text(k, colR, 9.5, regular, muted);
    right(v, R);
    y -= 12;
  }
  y = Math.min(y, leftEnd);
  hr();

  // ── Line items ──
  const cSac = 330, cQty = 400;
  text('DESCRIPTION', L, 8.5, bold, muted);
  text('SAC', cSac, 8.5, bold, muted);
  text('NIGHTS', cQty, 8.5, bold, muted);
  right('AMOUNT', R, 8.5, bold, muted);
  y -= 16;

  const guests = `${d.adults} adult${d.adults !== 1 ? 's' : ''}${d.children ? `, ${d.children} child${d.children !== 1 ? 'ren' : ''}` : ''}`;
  const stay = `Accommodation at ${d.propertyName}, ${d.propertyAddress}. ${longDate(d.checkIn)} to ${longDate(d.checkOut)}, ${guests}.`;
  const items: [string, string, number][] = [
    [stay, String(d.nights), d.baseAmount],
    ...(d.extraGuestAmount ? [['Extra guest charge', '', d.extraGuestAmount] as [string, string, number]] : []),
  ];
  for (const [desc, qty, amt] of items) {
    const lines = wrap(desc, regular, 9.5, cSac - L - 16);
    text(ACCOMMODATION_SAC, cSac);
    if (qty) text(qty, cQty);
    right(rs(amt), R);
    for (const line of lines) { text(line, L); y -= 12; }
    y -= 6;
  }
  hr(4);

  // ── Totals ──
  const taxable = d.baseAmount + d.extraGuestAmount;
  const { cgst, sgst } = splitGst(d.taxAmount);
  const labelX = 330;
  for (const [k, v] of [
    ['Taxable value', taxable],
    ['CGST @ 9%', cgst],
    ['SGST @ 9%', sgst],
  ] as const) {
    text(k, labelX, 9.5, regular, muted);
    right(rs(v), R);
    y -= 14;
  }
  y -= 2;
  page.drawLine({ start: { x: labelX, y: y + 10 }, end: { x: R, y: y + 10 }, thickness: 0.6, color: rule });
  y -= 4;
  text('Total', labelX, 11, bold);
  right(rs(d.totalAmount), R, 11, bold, maroon);
  y -= 22;

  for (const line of wrap(amountInWords(d.totalAmount), regular, 9.5, R - L)) { text(line, L, 9.5, regular, muted); y -= 12; }
  y -= 4;
  text('Paid in full online.', L, 9.5, regular, muted);

  // ── Footer ──
  y = 60;
  page.drawLine({ start: { x: L, y: y + 14 }, end: { x: R, y: y + 14 }, thickness: 0.6, color: rule });
  text('This is a computer-generated invoice and does not require a signature.', L, 8.5, regular, muted);
  y -= 12;
  text('Security deposit, where applicable, is collected at check-in and is not part of this invoice.', L, 8.5, regular, muted);

  return doc.save();
}
