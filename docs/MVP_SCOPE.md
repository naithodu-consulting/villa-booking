# MVP Scope Definition
## Villa Booking Platform — Mangalore

**Version:** 1.0.0  
**Date:** 2026-08-09

---

## Priority Classification

| Code | Meaning |
|------|---------|
| P0 | Required for launch. MVP is not shippable without this. |
| P1 | Important. Ship within 2–4 weeks post-launch. |
| P2 | Valuable enhancement. Phase 2 roadmap. |
| P3 | Deliberately excluded. Revisit only after Phase 2. |

---

## Public Guest Experience

| Feature | Priority | Notes |
|---------|----------|-------|
| Property landing page (hero, gallery, amenities, rooms) | P0 | Core discovery |
| Availability calendar (guest view) | P0 | |
| Date + guest selection | P0 | |
| Transparent pricing breakdown | P0 | |
| Guest information form | P0 | |
| Online payment (Razorpay) | P0 | |
| Booking confirmation page | P0 | |
| Email confirmation | P0 | |
| House rules display | P0 | |
| Cancellation policy display | P0 | |
| Mobile-optimized experience | P0 | |
| WhatsApp CTA (click-to-chat) | P0 | No bot; just deep link |
| Guest account (view bookings) | P1 | Guest checkout sufficient for P0 |
| Guest account (download invoice) | P1 | |
| Self-serve cancellation | P1 | Admin cancellation is P0 |
| Pre-arrival form / add-on requests | P1 | |
| Guest reviews | P2 | Post-launch when stays complete |
| Referral/loyalty | P3 | |
| Multi-language support | P3 | English + Kannada/Hindi future |

---

## Booking Engine

| Feature | Priority | Notes |
|---------|----------|-------|
| Availability engine (prevents double booking) | P0 | |
| Pricing engine (base + weekend + seasonal) | P0 | |
| Booking state machine | P0 | |
| Payment webhook handling + idempotency | P0 | |
| Booking expiry (unpaid bookings auto-cancel) | P0 | |
| Minimum stay enforcement | P0 | |
| Extra guest charges | P0 | |
| Coupon/discount codes | P2 | |
| Dynamic pricing automation | P3 | |

---

## Admin / Property Management

| Feature | Priority | Notes |
|---------|----------|-------|
| Secure admin login | P0 | |
| Dashboard (check-ins, revenue, upcoming) | P0 | |
| Calendar view (booked/available/blocked) | P0 | |
| Block / unblock dates | P0 | |
| View all bookings | P0 | |
| Booking detail view | P0 | |
| Create manual booking | P0 | Critical for phone/WhatsApp bookings |
| Cancel booking + refund | P0 | |
| Mark offline payment received | P0 | |
| Edit property content (description, policies) | P0 | |
| Manage property images | P0 | |
| Manage rooms | P0 | |
| Manage amenities | P0 | |
| Set pricing (base, weekend, seasonal) | P0 | |
| Manage add-on services | P1 | |
| Edit house rules | P0 | |
| User / role management | P0 | At least Super Admin + Staff |
| Audit logs | P0 | |
| Bulk operations (bulk block dates) | P1 | |
| Advanced analytics | P2 | |
| Multi-property management | P2 | Architecture ready from day 1 |

---

## Notifications

| Feature | Priority | Notes |
|---------|----------|-------|
| Booking confirmation (email) | P0 | |
| Payment confirmation (email) | P0 | |
| Cancellation notification (email) | P0 | |
| Admin notification on new booking | P0 | |
| Pre-arrival reminder | P1 | 48h before check-in |
| Post-stay review request | P2 | |
| SMS notifications | P1 | After email is stable |
| WhatsApp notifications | P2 | |

---

## Technical Infrastructure

| Feature | Priority | Notes |
|---------|----------|-------|
| Supabase PostgreSQL with RLS | P0 | |
| Next.js App Router | P0 | |
| Supabase Auth | P0 | |
| Razorpay integration | P0 | |
| Image storage (Supabase Storage) | P0 | |
| Environment variable management | P0 | |
| Database migrations | P0 | |
| SEO (SSR, metadata, structured data) | P0 | |
| Core Web Vitals optimization | P0 | |
| Error tracking (Sentry-compatible) | P1 | |
| Analytics (GA4/GTM) | P1 | |
| Automated tests (critical paths) | P0 | |

---

## Explicitly Out of Scope for MVP

These will NOT be built unless explicitly requested:

- OTA synchronization (Airbnb iCal sync, Booking.com)
- WhatsApp chatbot / automated replies
- Native iOS/Android app
- Multiple property marketplace UI
- Gift cards
- Corporate accounts / invoicing
- Loyalty points
- Referral tracking system
- Full headless CMS
- Revenue management / dynamic pricing
- Staff scheduling / task management
- Expense tracking
- Integration with accounting software

---

## MVP Launch Criteria

The MVP is ready to ship when:

1. A guest can complete a full booking online and receive confirmation
2. Payment is processed and verified server-side
3. Admin can block dates and prevent bookings
4. Admin can create manual bookings
5. Admin can view all bookings and manage cancellations
6. Mobile experience is production-quality on iOS Safari and Android Chrome
7. No double-booking is possible under concurrent load
8. All critical path unit tests pass
9. HTTPS, secure headers, secrets in env vars
10. All open P0 business decisions are resolved
