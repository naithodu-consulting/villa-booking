# Product Requirements Document
## Villa Booking & Property Management Platform — Mangalore

**Version:** 1.0.0  
**Status:** Draft — Pending Business Review  
**Date:** 2026-08-09

---

## 1. Product Overview

A premium direct-booking platform for a private villa in Mangalore, Karnataka. The system enables guests to discover, book, pay for, and manage stays while giving property owners and operators full control over the property, pricing, availability, and guest experience. The underlying architecture must support multiple properties from day one without requiring a rewrite.

---

## 2. Core User Personas

### 2.1 Guest (Primary Customer)
- Indian traveler, family groups, couples, friend groups
- Mobile-first; likely uses WhatsApp
- Prefers transparent pricing, no surprise fees
- Wants confidence in property quality before paying
- May compare across platforms (Airbnb, StayVista, direct)
- Sensitive to cancellation terms given high-value bookings

### 2.2 Property Administrator
- Villa owner or designated manager
- Manages bookings, availability, pricing
- Needs operational efficiency, not a technical interface
- Must handle manual bookings from phone/WhatsApp/referrals
- Needs financial visibility (revenue, outstanding payments)

### 2.3 Operations Staff / Caretaker
- Handles on-ground logistics (check-in, check-out, housekeeping)
- Needs limited operational view: today's arrivals/departures
- Should NOT have access to financial data

---

## 3. Functional Requirements

### 3.1 Public Guest Experience

#### 3.1.1 Discovery & Property Showcase
- REQ-G-001: Display property hero with high-quality photography, name, location, capacity, CTA
- REQ-G-002: Showcase property highlights (bedrooms, bathrooms, pool, capacity)
- REQ-G-003: Full-screen photo gallery with category filters (exterior, rooms, pool, etc.)
- REQ-G-004: Detailed room-by-room breakdown with photos and bed configuration
- REQ-G-005: Structured amenities listing, grouped by category
- REQ-G-006: About the villa narrative (configurable, not hard-coded)
- REQ-G-007: Experiences and add-on services showcase
- REQ-G-008: Location section with approximate map (exact address post-booking)
- REQ-G-009: House rules display
- REQ-G-010: Cancellation policy display
- REQ-G-011: FAQ section
- REQ-G-012: Guest reviews display with rating breakdown
- REQ-G-013: Contact / enquiry capability

#### 3.1.2 Availability & Booking Flow
- REQ-B-001: Date picker with real-time availability visualization
- REQ-B-002: Guest count selector (adults, children, infants)
- REQ-B-003: Transparent pricing breakdown before payment
- REQ-B-004: Guest information collection (name, mobile, email, special requests)
- REQ-B-005: Secure online payment (Razorpay initial gateway)
- REQ-B-006: Booking confirmation page with reference number
- REQ-B-007: Email confirmation to guest
- REQ-B-008: Pre-arrival information and add-on requests
- REQ-B-009: Booking management (view, modify where permitted, cancel)

#### 3.1.3 Guest Account
- REQ-A-001: Optional account creation (guest checkout also supported)
- REQ-A-002: View all bookings
- REQ-A-003: Download invoice/confirmation
- REQ-A-004: Manage profile
- REQ-A-005: OTP-based authentication (email and/or mobile)

### 3.2 Admin / Property Management

#### 3.2.1 Dashboard
- REQ-ADM-001: Today's check-ins and check-outs
- REQ-ADM-002: Upcoming bookings (next 7, 30 days)
- REQ-ADM-003: Revenue summary (month, YTD)
- REQ-ADM-004: Occupancy metrics
- REQ-ADM-005: Pending payments
- REQ-ADM-006: Recent activity feed

#### 3.2.2 Calendar & Availability
- REQ-ADM-010: Visual calendar showing booked/available/blocked dates
- REQ-ADM-011: Block dates (maintenance, owner hold, other)
- REQ-ADM-012: Unblock dates
- REQ-ADM-013: View booking detail from calendar

#### 3.2.3 Reservation Management
- REQ-ADM-020: List all bookings with filters (status, date, guest)
- REQ-ADM-021: Booking detail view
- REQ-ADM-022: Create manual booking
- REQ-ADM-023: Edit booking (dates, guests, notes)
- REQ-ADM-024: Cancel booking with refund calculation
- REQ-ADM-025: Mark payment as received (for offline payments)
- REQ-ADM-026: Add notes to bookings
- REQ-ADM-027: View payment history per booking

#### 3.2.4 Property Content Management
- REQ-ADM-030: Edit property name, description, highlights
- REQ-ADM-031: Manage property images (upload, reorder, delete, categorize)
- REQ-ADM-032: Manage rooms (CRUD, images, bed configuration)
- REQ-ADM-033: Manage amenities (add, edit, enable/disable)
- REQ-ADM-034: Manage house rules
- REQ-ADM-035: Manage check-in/check-out information
- REQ-ADM-036: Manage FAQ content
- REQ-ADM-037: Manage cancellation policy

#### 3.2.5 Pricing Management
- REQ-ADM-040: Set base nightly rate
- REQ-ADM-041: Set weekend rate
- REQ-ADM-042: Set seasonal pricing periods
- REQ-ADM-043: Set holiday/special date pricing
- REQ-ADM-044: Configure minimum stay rules
- REQ-ADM-045: Configure extra guest charges
- REQ-ADM-046: Configure taxes and fees

#### 3.2.6 Add-on Services
- REQ-ADM-050: Create/edit services (BBQ, meals, transfers, etc.)
- REQ-ADM-051: Set service pricing and pricing unit
- REQ-ADM-052: Enable/disable services

#### 3.2.7 User & Role Management
- REQ-ADM-060: Create admin users
- REQ-ADM-061: Assign roles (Super Admin, Property Admin, Ops Manager, Staff)
- REQ-ADM-062: Deactivate users

---

## 4. Non-Functional Requirements

### 4.1 Performance
- First Contentful Paint < 1.5s on mobile (4G)
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s
- Core Web Vitals: pass all three (LCP, FID/INP, CLS)
- Image optimization mandatory (next/image, WebP, responsive sizes)

### 4.2 Availability
- Target 99.9% uptime (Vercel/cloud hosted)
- Booking creation must be ACID-compliant
- No double booking under any concurrent scenario

### 4.3 Security
- All financial operations server-side only
- Webhook signature validation
- Input validation at API boundaries
- Row Level Security on Supabase
- Rate limiting on auth and booking endpoints
- No secrets in client bundles

### 4.4 Accessibility
- WCAG 2.2 AA target
- Keyboard navigable booking flow
- Screen reader compatible gallery and calendar

### 4.5 SEO
- SSR for all public pages
- Structured data (LodgingBusiness, FAQPage)
- Sitemap, robots.txt
- Open Graph and Twitter metadata

### 4.6 Mobile
- Mobile-first design
- Touch-optimized date picker
- Sticky booking CTA on property page
- WhatsApp contact integration

---

## 5. Out of Scope (MVP)

- Multiple property marketplace
- OTA synchronization (Airbnb, Booking.com)
- Dynamic pricing automation
- WhatsApp chatbot integration
- Loyalty/referral program
- Gift cards
- Corporate accounts
- Full CMS (database-admin editing is sufficient for MVP)
- Native mobile applications
- Advanced analytics beyond operational dashboard
