# Open Business Decisions
## Villa Booking Platform — Mangalore

**Status:** Awaiting Owner Input  
**Date:** 2026-08-09

All items marked `[REQUIRED]` must be resolved before the related feature can go live.
Items marked `[RECOMMENDED]` have a suggested default that can be overridden.

---

## PRICING

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| P-01 | Base nightly rate (weekday) | REQUIRED | Used as default when no seasonal rule applies |
| P-02 | Weekend rate (Fri/Sat night) | REQUIRED | Typically 10–30% premium |
| P-03 | Minimum stay (weekdays) | REQUIRED | e.g., 2 nights minimum |
| P-04 | Minimum stay (weekends / long weekends) | REQUIRED | e.g., 3 nights minimum on long weekends |
| P-05 | Extra guest charge above base occupancy | REQUIRED | e.g., ₹500/night per extra adult above 6 |
| P-06 | Child pricing (ages 5–12) | REQUIRED | Half adult rate? No charge? |
| P-07 | Infant policy (ages 0–4) | RECOMMENDED | Usually free |
| P-08 | Security deposit amount | REQUIRED | Refundable; how much and when returned? |
| P-09 | Advance booking limit | RECOMMENDED | How far in advance can guests book? (e.g., 12 months) |
| P-10 | Last-minute booking window | RECOMMENDED | Can guests book same-day? How many days notice required? |
| P-11 | Platform/service fee to pass to guest | RECOMMENDED | Some properties add 2–5% booking fee |

---

## CANCELLATION POLICY

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| C-01 | Free cancellation window | REQUIRED | e.g., full refund if cancelled 30+ days before check-in |
| C-02 | Partial refund window | REQUIRED | e.g., 50% refund if cancelled 15–29 days before |
| C-03 | No refund window | REQUIRED | e.g., no refund if cancelled within 14 days |
| C-04 | Security deposit refund timeline | REQUIRED | How many days after check-out? |
| C-05 | Refund processing timeline | RECOMMENDED | Bank transfer timelines in India (typically 5–7 days) |

---

## TAXES

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| T-01 | Is GST applicable? | REQUIRED | Accommodation >₹7500/night attracts 18% GST |
| T-02 | GST registration number | REQUIRED | For invoices if GST applicable |
| T-03 | GST on add-on services | REQUIRED | May differ by service type |
| T-04 | Invoice format requirements | REQUIRED | Tax invoice vs. receipt; format for guests |

---

## PROPERTY OPERATIONS

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| O-01 | Check-in time | REQUIRED | e.g., 2:00 PM |
| O-02 | Check-out time | REQUIRED | e.g., 11:00 AM |
| O-03 | Early check-in availability and charge | RECOMMENDED | e.g., ₹1000 for early check-in before noon |
| O-04 | Late check-out availability and charge | RECOMMENDED | e.g., ₹1000 for check-out after 1 PM |
| O-05 | Maximum occupancy | REQUIRED | Critical for availability and safety |
| O-06 | Base occupancy (included in base price) | REQUIRED | e.g., price includes up to 8 guests |
| O-07 | Pet policy | REQUIRED | Allowed? Extra charge? Restrictions? |
| O-08 | Outside guests / day visitors allowed? | REQUIRED | If yes, limit and extra charge? |
| O-09 | Events / parties allowed? | REQUIRED | If yes, special pricing and conditions? |
| O-10 | Smoking policy | REQUIRED | Indoors? Anywhere? Designated area? |
| O-11 | Alcohol policy | REQUIRED | Allowed? Restrictions? |
| O-12 | Noise/quiet hours | RECOMMENDED | e.g., no loud music after 10 PM |

---

## PAYMENT

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| PAY-01 | Payment gateway confirmation (Razorpay) | REQUIRED | Need API keys for integration |
| PAY-02 | Full payment upfront or partial? | REQUIRED | e.g., 50% at booking, 50% before check-in |
| PAY-03 | Accepted payment methods | RECOMMENDED | UPI, cards, net banking? All Razorpay-supported? |
| PAY-04 | Offline payment acceptance (cash/transfer) | REQUIRED | Admin must mark these manually |
| PAY-05 | Payment currency | REQUIRED | INR only? INR primary with USD secondary for NRI? |

---

## GUEST REQUIREMENTS

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| GR-01 | Government ID requirement | REQUIRED | Mandatory for all guests? At check-in? |
| GR-02 | ID types accepted | REQUIRED | Aadhaar, passport, driving licence? |
| GR-03 | Guest registration form | REQUIRED | How many guest details to collect? |
| GR-04 | Minimum age for primary guest | RECOMMENDED | e.g., primary guest must be 21+ |

---

## ADD-ON SERVICES

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| SVC-01 | Which services are offered at launch? | REQUIRED | e.g., BBQ, breakfast, dinner, transfers |
| SVC-02 | Meal pricing | REQUIRED | Per person? Per meal? Package rates? |
| SVC-03 | BBQ pricing | REQUIRED | Per session? Setup + per person? |
| SVC-04 | Bonfire pricing | REQUIRED | |
| SVC-05 | Airport transfer pricing | REQUIRED | |
| SVC-06 | Notice period for services | REQUIRED | e.g., meal requests must be placed 24 hours in advance |

---

## COMMUNICATIONS

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| COM-01 | Preferred notification channels | REQUIRED | Email + SMS? WhatsApp? |
| COM-02 | SMS provider | REQUIRED | Twilio, MSG91, Fast2SMS? |
| COM-03 | WhatsApp Business account | RECOMMENDED | For Phase 2 |
| COM-04 | Property contact number | REQUIRED | Displayed on website |
| COM-05 | Property email address | REQUIRED | Bookings, enquiries |

---

## BRANDING

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| BR-01 | Villa name | REQUIRED | Public-facing brand name |
| BR-02 | Tagline / positioning statement | RECOMMENDED | e.g., "Your private escape by the coast" |
| BR-03 | Brand color palette | RECOMMENDED | Primary, secondary, accent |
| BR-04 | Typography preferences | RECOMMENDED | Serif? Sans-serif? |
| BR-05 | Logo | RECOMMENDED | SVG preferred |

---

## LEGAL

| # | Decision | Priority | Notes |
|---|----------|----------|-------|
| L-01 | Legal entity name (for invoices) | REQUIRED | Individual or registered business? |
| L-02 | Registered address | REQUIRED | For invoices if GST registered |
| L-03 | Terms & Conditions | REQUIRED | Requires legal review before launch |
| L-04 | Privacy Policy | REQUIRED | Required for any data collection |
| L-05 | Refund Policy | REQUIRED | Must match cancellation rules |

---

## NOTES

- All placeholder values in the codebase are clearly marked `PLACEHOLDER_` or `REQUIRES_BUSINESS_DECISION`
- No financial values are hard-coded; all are database-driven
- The system can launch with sensible defaults but all items marked REQUIRED must be confirmed before going live
