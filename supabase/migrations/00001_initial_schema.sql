-- Migration: 00001_initial_schema.sql
-- Description: Complete schema for Villa Direct Booking Platform

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Mangalore',
    state VARCHAR(100) DEFAULT 'Karnataka',
    pincode VARCHAR(20) DEFAULT '575001',
    geo_lat DECIMAL(10, 8),
    geo_lng DECIMAL(11, 8),
    base_occupancy INT NOT NULL DEFAULT 8,
    max_occupancy INT NOT NULL DEFAULT 14,
    extra_guest_rate BIGINT NOT NULL DEFAULT 75000,       -- paise (₹750)
    base_nightly_rate BIGINT NOT NULL DEFAULT 1450000,    -- paise (₹14,500)
    weekend_nightly_rate BIGINT NOT NULL DEFAULT 1850000, -- paise (₹18,500)
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    room_type VARCHAR(50) DEFAULT 'bedroom', -- master, guest, luxury_suite
    bed_type VARCHAR(100) DEFAULT 'King Bed',
    bed_count INT DEFAULT 1,
    max_guests INT DEFAULT 2,
    has_ensuite_bathroom BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PROPERTY IMAGES TABLE
CREATE TABLE IF NOT EXISTS property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    category VARCHAR(50) DEFAULT 'exterior', -- hero, exterior, room, pool, dining, living
    display_order INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRICING RULES TABLE (Seasonal / Holiday overrides)
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rule_name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    nightly_rate BIGINT NOT NULL, -- paise
    min_stay_nights INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 6. BLOCKED DATES TABLE (Maintenance, Owner Hold, Direct Reservations)
CREATE TABLE IF NOT EXISTS blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(50) DEFAULT 'maintenance', -- maintenance, owner_hold, offline_booking
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_blocked_range CHECK (end_date >= start_date)
);

-- 7. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(20) UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    num_adults INT NOT NULL DEFAULT 2,
    num_children INT DEFAULT 0,
    num_infants INT DEFAULT 0,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_nights INT NOT NULL,
    base_amount BIGINT NOT NULL,          -- paise
    extra_guest_amount BIGINT DEFAULT 0,  -- paise
    tax_amount BIGINT NOT NULL DEFAULT 0, -- paise (18% GST)
    total_amount BIGINT NOT NULL,         -- paise
    deposit_amount BIGINT DEFAULT 0,      -- paise (50% of total)
    status VARCHAR(30) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    payment_status VARCHAR(30) DEFAULT 'unpaid', -- unpaid, partially_paid, paid, refunded
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_booking_dates CHECK (check_out > check_in)
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount BIGINT NOT NULL, -- paise; matches Razorpay order amount
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) DEFAULT 'created', -- created, captured, failed, refunded
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ADDON SERVICES TABLE
CREATE TABLE IF NOT EXISTS addon_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL, -- paise
    pricing_unit VARCHAR(50) DEFAULT 'per_stay', -- per_stay, per_guest_per_day, per_session
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. INDEXES FOR HIGH-PERFORMANCE SEARCH & CONCURRENCY
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates ON bookings (property_id, check_in, check_out) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_blocked_dates_property ON blocked_dates (property_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_property ON pricing_rules (property_id, start_date, end_date);
