import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import GalleryModal from '@/components/guest/GalleryModal';
import BookingWidget from '@/components/guest/BookingWidget';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';
import { MOCK_AMENITIES } from '@/lib/mock-data';
import { getProperty, getRooms, getImages, getPricingRules } from '@/lib/data';
import {
  ShieldCheck, MapPin, Users, Wifi, Waves, Home,
  MessageSquare, Check, Sparkles, Star, Phone,
  Clock, XCircle, AlertTriangle, ChevronDown,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Villa 19 — Urwa, Mangalore',
  description:
    'Book a premium 4-bedroom private villa in Urwa, Mangalore, Karnataka. Lush lawns, private balconies, ample parking, beach 1.5 km away. Hosts up to 12 guests. Direct booking — no platform fees.',
};

// Static FAQ data — will move to DB in later phase
const FAQS = [
  {
    q: 'What is included in the base booking price?',
    a: 'The base price covers exclusive use of the entire villa including all 4 bedrooms, private lawn, balconies, covered parking, and high-speed WiFi. Caretaker service is included throughout your stay.',
  },
  {
    q: 'Is there a kitchen available for guests?',
    a: 'Yes, the villa has a fully equipped kitchen for your use. Guests are welcome to bring their own groceries or order from nearby restaurants and food delivery services.',
  },
  {
    q: 'What are the check-in and check-out times?',
    a: 'Standard check-in is at 14:00 and check-out is at 11:00. Early check-in and late check-out are subject to availability. Please contact us in advance.',
  },
  {
    q: 'How far is the beach from the villa?',
    a: 'The nearest beach is approximately 1.5 km from the villa. A short drive of about 5 minutes, or a leisurely 15–20 minute walk. The villa is also conveniently located near the main road, local market and shops.',
  },
  {
    q: 'Is the property suitable for events or large gatherings?',
    a: 'The villa is well-suited for private family gatherings, milestone celebrations and corporate offsites. The spacious lawn is ideal for outdoor celebrations. Please contact us for event enquiries. Special terms and event-specific pricing apply.',
  },
  {
    q: 'What is the cancellation policy?',
    a: 'Cancellations made 14 or more days before check-in receive a full refund. Cancellations between 7–14 days receive a 50% refund. Cancellations within 7 days of check-in are non-refundable. The security deposit is refunded within 5 working days of check-out.',
  },
  {
    q: 'Is government ID required?',
    a: 'Yes. All adult guests are required to present valid government-issued photo ID (Aadhaar, passport or driving licence) at check-in. This is a legal requirement under local regulations.',
  },
];

const REVIEWS = [
  {
    name: 'Priya N.',
    location: 'Bangalore',
    rating: 5,
    date: 'July 2026',
    text: 'Absolutely stunning property. The lawn at sunset is something I will never forget — perfect for our evening get-togethers. The caretaker was incredibly attentive and the kitchen is very well-equipped. We had 10 people and it never felt crowded.',
    verified: true,
  },
  {
    name: 'Rohan M.',
    location: 'Mumbai',
    rating: 5,
    date: 'June 2026',
    text: 'Best villa stay we\'ve had in coastal Karnataka. Direct booking was seamless, the property was exactly as described. The BBQ setup and balconies were highlights. Beach is just a short drive away. Will definitely be back.',
    verified: true,
  },
  {
    name: 'Ananya & Family',
    location: 'Hyderabad',
    rating: 4,
    date: 'Auguest 2026',
    text: 'A truly private retreat. The kids loved running around the lawn and the property has great shade throughout the day. The beach was only 1.5 km away — we went every morning. Very conveniently located near shops and eateries. Overall excellent.',
    verified: true,
  },
];

export default async function LandingPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-screen bg-[#FFFCF0] flex items-center justify-center">
        <p className="text-[#6B7A8A] text-sm">Property not found. Please check your database setup.</p>
      </div>
    );
  }

  const [rooms, images, pricingRules] = await Promise.all([
    getRooms(property.id),
    getImages(property.id),
    getPricingRules(property.id),
  ]);

  const whatsappNumber = property.whatsapp_number ?? '919876543210';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in booking ${property.name}`)}`;
  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="min-h-screen bg-[#FFFCF0] text-[#1A1208] flex flex-col pb-20 md:pb-0">
      {/* ── Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#562424] backdrop-blur-xl border-b border-white/8 px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between shadow-lg">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/habbaa-logo.png"
            alt="Habbaa"
            width={52}
            height={52}
            className="rounded-full"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">{property.name}</span>
            <span className="text-[11px] font-medium tracking-widest text-[#C9944A] uppercase mt-0.5">By Habbaa</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-[15px] font-semibold text-white/75" aria-label="Main navigation">
          <a href="#overview" className="hover:text-[#C9944A] transition-colors py-1">Overview</a>
          <a href="#rooms" className="hover:text-[#C9944A] transition-colors py-1">Rooms</a>
          <a href="#amenities" className="hover:text-[#C9944A] transition-colors py-1">Amenities</a>
          <a href="#faq" className="hover:text-[#C9944A] transition-colors py-1">FAQ</a>
          <a href="#policies" className="hover:text-[#C9944A] transition-colors py-1">Policies</a>
          <Link
            href="/admin/login"
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all font-semibold"
          >
            Admin Login
          </Link>
        </nav>

        {/* Mobile nav trigger */}
        <MobileNav whatsappUrl={whatsappUrl} adminLoginHref="/admin/login" />
      </header>

      {/* ── Hero ──────────────────────────────────────── */}
      <section id="overview" className="pt-6 sm:pt-8">
        {/* Single container: title + gallery share the same left/right edge */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 sm:mb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(168,116,50,0.08)] border border-[rgba(168,116,50,0.2)] text-[#A87432] text-xs font-semibold tracking-wide mb-5">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Direct Verified Property Booking
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold italic text-[#562424] leading-tight mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                {property.name}
              </h1>
              <p className="text-[#6B7A8A] text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#A87432] flex-shrink-0" aria-hidden="true" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </p>
            </div>
            {/* Rating — right-aligned on desktop, inline on mobile */}
            <div className="flex items-center gap-2 sm:flex-shrink-0 pb-1">
              <div className="flex" aria-label={`Rated ${avgRating} out of 5`}>
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-[#A87432] fill-[#A87432]" aria-hidden="true" />
                ))}
              </div>
              <span className="text-sm font-bold text-[#1A1208]">{avgRating}</span>
              <span className="text-xs text-[#6B7A8A]">({REVIEWS.length} verified stays)</span>
            </div>
          </div>

          {/* Gallery — same container width, no extra padding */}
          <GalleryModal images={images} />
        </div>
      </section>

      {/* ── Main Layout: Content + Widget ─────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">

          {/* Highlights */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl grid grid-cols-2 sm:grid-cols-4 gap-0 text-center border border-[rgba(0,0,0,0.09)] shadow-md">
            {[
              { icon: Users, label: 'Capacity', value: `Up to ${property.max_occupancy} Guests`, color: 'text-[#A87432]', bg: 'bg-[rgba(168,116,50,0.13)]' },
              { icon: Waves, label: 'Beach', value: '1.5 km to Beach', color: 'text-[#1E8A7A]', bg: 'bg-[rgba(30,138,122,0.13)]' },
              { icon: Wifi, label: 'Internet', value: 'High-Speed WiFi', color: 'text-[#A87432]', bg: 'bg-[rgba(168,116,50,0.13)]' },
              { icon: Home, label: 'Outdoors', value: 'Lawn & Balconies', color: 'text-[#1E8A7A]', bg: 'bg-[rgba(30,138,122,0.13)]' },
            ].map(({ icon: Icon, label, value, color, bg }, i) => (
              <div key={label} className={`py-4 px-3 ${i > 0 ? 'border-l border-[rgba(0,0,0,0.09)]' : ''} ${i >= 2 ? 'border-t border-[rgba(0,0,0,0.09)] sm:border-t-0' : ''}`}>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
                </div>
                <p className="text-[11px] text-[#8A9AAA] font-bold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-[#562424] mt-1 leading-snug">{value}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#A87432]" aria-hidden="true" />
              <span className="text-xs font-bold text-[#A87432] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> About the Villa
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#562424] tracking-tight">{property.tagline}</h2>
            <p className="text-[#4A5568] leading-relaxed text-sm sm:text-base">{property.description}</p>
          </div>

          {/* Rooms */}
          <div id="rooms" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#A87432]" aria-hidden="true" />
              <h2 className="text-2xl font-black text-[#562424] tracking-tight">Room Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white p-5 rounded-2xl border border-[rgba(0,0,0,0.09)] hover:border-[rgba(168,116,50,0.4)] shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#A87432] uppercase tracking-wider">{room.room_type}</span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(86,36,36,0.08)] text-[#3E1818]">
                        {room.max_guests} Guests
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1A1208] mb-2">{room.name}</h3>
                  </div>
                  <div className="pt-3 border-t border-[rgba(0,0,0,0.09)] text-xs text-[#6B7A8A] flex items-center justify-between">
                    <span>{room.bed_count} × {room.bed_type}</span>
                    {room.has_ensuite_bathroom && (
                      <span className="text-[#1E8A7A] font-semibold">Ensuite Bath</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div id="amenities" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#1E8A7A]" aria-hidden="true" />
              <h2 className="text-2xl font-black text-[#562424] tracking-tight">Property Amenities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_AMENITIES.map((group, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-[rgba(0,0,0,0.09)] shadow-sm">
                  <h3 className="text-xs font-bold text-[#A87432] uppercase tracking-wider mb-3">{group.category}</h3>
                  <ul className="space-y-2.5">
                    {group.items.map((item, i) => (
                      <li key={i} className="text-[#4A5568] text-xs sm:text-sm flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[rgba(30,138,122,0.14)] text-[#1E8A7A] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" aria-hidden="true" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div id="location" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#A87432]" aria-hidden="true" />
              <h2 className="text-2xl font-black text-[#562424] tracking-tight">Location</h2>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-[rgba(0,0,0,0.09)] shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#A87432] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-[#1A1208]">{property.address}</p>
                  <p className="text-xs text-[#6B7A8A]">{property.city}, {property.state} — {property.pincode}</p>
                  <p className="text-xs text-[#8A9AAA] mt-1">
                    Exact address and directions shared after booking confirmation.
                  </p>
                </div>
              </div>
              {/* Placeholder map — replace with Google Maps embed after business decision on key */}
              <div className="w-full h-48 rounded-2xl bg-[#F0EBE0] border border-[rgba(0,0,0,0.09)] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="w-8 h-8 text-[rgba(168,116,50,0.4)] mx-auto" aria-hidden="true" />
                  <p className="text-xs text-[#8A9AAA]">Interactive map available after booking</p>
                  <a
                    href={`https://maps.google.com/?q=${property.geo_lat},${property.geo_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#A87432] hover:underline"
                  >
                    View approximate location →
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-[#4A5568]">
                {[
                  ['Mangalore International Airport', '~20 min'],
                  ['Nearest Beach', '~5 min drive / 1.5 km'],
                  ['Main Road & Market', 'Walking distance'],
                  ['Mangalore City Centre', '~15 min'],
                ].map(([place, time]) => (
                  <div key={place} className="flex items-center justify-between p-2.5 bg-[#F0EBE0] rounded-xl border border-[rgba(0,0,0,0.09)]">
                    <span className="text-[#6B7A8A]">{place}</span>
                    <span className="font-semibold text-[#1A1208]">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div id="reviews" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-[#A87432]" aria-hidden="true" />
                <h2 className="text-2xl font-black text-[#562424] tracking-tight">Guest Reviews</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex" aria-hidden="true">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-[#A87432] fill-[#A87432]" />
                  ))}
                </div>
                <span className="text-sm font-black text-[#1A1208]">{avgRating}</span>
                <span className="text-xs text-[#6B7A8A]">/ 5.0</span>
              </div>
            </div>
            <div className="space-y-4">
              {REVIEWS.map((review, i) => (
                <div key={i} className="bg-white p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.09)] shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1A1208]">{review.name}</p>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(30,138,122,0.08)] border border-[rgba(30,138,122,0.2)] text-[#1E8A7A] text-[11px] font-bold">
                            <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Verified Stay
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7A8A]">{review.location} · {review.date}</p>
                    </div>
                    <div className="flex flex-shrink-0" aria-label={`${review.rating} out of 5 stars`}>
                      {[1,2,3,4,5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-[#A87432] fill-[#A87432]' : 'text-[rgba(0,0,0,0.12)]'}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#4A5568] leading-relaxed">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div id="cancellation" className="scroll-mt-24 bg-white p-6 sm:p-8 rounded-3xl border border-[rgba(0,0,0,0.09)] shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#1E8A7A]" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-[#562424]">Cancellation Policy</h2>
            </div>
            <div className="space-y-3">
              {[
                { icon: Check, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200',
                  title: 'Full Refund', body: 'Above 14 days before check-in - 100% refund, no questions asked.' },
                { icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
                  title: 'Partial Refund', body: '7–14 days before check-in - 50% of booking amount refunded.' },
                { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
                  title: 'No Refund', body: 'Within 7 days of check-in - booking amount is non-refundable.' },
              ].map(({ icon: Icon, color, bg, border, title, body }) => (
                <div key={title} className={`flex items-start gap-3 p-4 rounded-2xl border ${bg} ${border}`}>
                  <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                  <div>
                    <p className={`text-sm font-bold ${color}`}>{title}</p>
                    <p className="text-xs text-[#4A5568] mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8A9AAA]">
              Security deposit, if applicable, is refunded within 5 working days of check-out, subject to property inspection.
              Refunds are processed to the original payment method.
            </p>
          </div>

          {/* House Rules */}
          <div id="policies" className="scroll-mt-24 bg-white p-6 sm:p-8 rounded-3xl border border-[rgba(0,0,0,0.09)] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#A87432]" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-[#562424]">House Rules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#4A5568]">
              {[
                `Check-in: ${property.check_in_time} · Check-out: ${property.check_out_time}`,
                'Government photo ID required at check-in for all adults',
                'Quiet hours: 10:00 PM - 7:00 AM',
                'No smoking indoors - designated outdoor area available',
                'No outside guests without prior permission',
                'Pets allowed with prior approval - additional charges apply',
                'Events and celebrations require advance notice',
                'Maximum occupancy: 12 guests',
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-[#F0EBE0] rounded-xl border border-[rgba(0,0,0,0.09)]">
                  <span className="w-2 h-2 rounded-full bg-[#A87432] flex-shrink-0" aria-hidden="true" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div id="faq" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#1E8A7A]" aria-hidden="true" />
              <h2 className="text-2xl font-black text-[#562424] tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <details key={i} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.09)] shadow-sm group">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-sm text-[#1A1208] select-none">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-[#6B7A8A] flex-shrink-0 group-open:rotate-180 transition-transform" aria-hidden="true" />
                  </summary>
                  <p className="px-5 pb-5 text-sm text-[#4A5568] leading-relaxed border-t border-[rgba(0,0,0,0.09)] pt-4">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Contact strip */}
          <div className="bg-white p-6 rounded-3xl border border-[rgba(0,0,0,0.09)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#1A1208]">Have a question before booking?</p>
              <p className="text-sm text-[#6B7A8A] mt-0.5">We typically respond within 30 minutes on WhatsApp.</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[rgba(30,138,122,0.08)] border border-[rgba(30,138,122,0.25)] text-[#1E8A7A] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[rgba(30,138,122,0.14)] transition-all"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" /> WhatsApp
              </a>
              <a
                href={`tel:+${whatsappNumber}`}
                className="flex items-center gap-2 bg-[#F0EBE0] border border-[rgba(0,0,0,0.09)] text-[#4A5568] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#E8E2D5] transition-all"
              >
                <Phone className="w-4 h-4" aria-hidden="true" /> Call Us
              </a>
            </div>
          </div>

        </div>

        {/* Right column — sticky booking widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <BookingWidget property={property} pricingRules={pricingRules} />
            {/* Check-in/out quick info */}
            <div className="mt-4 bg-white p-4 rounded-2xl border border-[rgba(0,0,0,0.09)] shadow-sm space-y-2 text-xs text-[#6B7A8A]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#A87432]" aria-hidden="true" />
                <span>Check-in from <strong className="text-[#1A1208]">{property.check_in_time}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#A87432]" aria-hidden="true" />
                <span>Check-out by <strong className="text-[#1A1208]">{property.check_out_time}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating WhatsApp (mobile) ─────────────────── */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 bg-emerald-500 text-white px-4 py-3 rounded-full font-extrabold text-xs flex items-center gap-2 shadow-2xl hover:bg-emerald-400 transition-all hover:scale-105"
        aria-label="Contact us on WhatsApp"
      >
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">WhatsApp Enquiry</span>
      </a>

      {/* ── Footer ────────────────────────────────────── */}
      <Footer property={property} whatsappUrl={whatsappUrl} />
    </div>
  );
}
