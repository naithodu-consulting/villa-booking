-- Phase 1: new tables + schema corrections
-- All monetary values INTEGER PAISE (₹1 = 100 paise)

-- ─────────────────────────────────────────────────────────────────────
-- Amenities (replaces MOCK_AMENITIES hardcoded array)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_amenities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  label         TEXT NOT NULL,
  icon          TEXT,               -- Lucide icon name or emoji
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amenities_property ON property_amenities(property_id, display_order);

-- ─────────────────────────────────────────────────────────────────────
-- Policies (house rules, cancellation, check-in, ID, pets, etc.)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_policies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,      -- machine key: 'no_smoking', 'pets_not_allowed', etc.
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN (
                  'rules', 'cancellation', 'checkin', 'id',
                  'pets', 'smoking', 'events', 'kitchen', 'housekeeping'
                )),
  display_order INT  NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, key)
);
CREATE INDEX IF NOT EXISTS idx_policies_property ON property_policies(property_id, category, display_order);

-- ─────────────────────────────────────────────────────────────────────
-- FAQs
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general',
  display_order INT  NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faqs_property ON faqs(property_id, display_order) WHERE is_published;

-- ─────────────────────────────────────────────────────────────────────
-- Nearby places
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nearby_places (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,   -- 'beach', 'temple', 'shopping', 'food', 'transport', 'attraction'
  distance_km    NUMERIC(5,2),
  travel_minutes INT,
  note           TEXT,
  display_order  INT  NOT NULL DEFAULT 0,
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nearby_property ON nearby_places(property_id, category, display_order);

-- ─────────────────────────────────────────────────────────────────────
-- Offers / packages
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL,
  body           TEXT,
  image_url      TEXT,
  valid_from     DATE,
  valid_to       DATE,
  discount_type  TEXT CHECK (discount_type IN ('percent', 'flat', 'none')),
  discount_value INT,              -- percent (0-100) or paise flat reduction
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_offers_property ON offers(property_id, is_published, valid_to);

-- ─────────────────────────────────────────────────────────────────────
-- Events (admin-published, hostable at the villa)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL,
  body           TEXT,
  image_url      TEXT,
  event_date     DATE,
  event_time     TIME,
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_events_property ON events(property_id, is_published, event_date);

-- ─────────────────────────────────────────────────────────────────────
-- Page sections (editable homepage / section copy)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  page          TEXT NOT NULL,         -- 'home', 'experience', 'about', etc.
  section_key   TEXT NOT NULL,
  title         TEXT,
  body          TEXT,
  cta_label     TEXT,
  cta_href      TEXT,
  image_url     TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, page, section_key)
);

-- ─────────────────────────────────────────────────────────────────────
-- Enquiries (contact-form and WhatsApp-initiated)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID REFERENCES properties(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  check_in      DATE,
  check_out     DATE,
  guest_count   INT,
  message       TEXT,
  source        TEXT NOT NULL DEFAULT 'contact_form', -- 'contact_form' | 'whatsapp' | 'email'
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'converted', 'closed')),
  notes         TEXT,                                  -- internal staff notes
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_property ON enquiries(property_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- Channel sync log
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS channel_sync_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID REFERENCES properties(id) ON DELETE SET NULL,
  direction     TEXT NOT NULL CHECK (direction IN ('push', 'pull')),
  channel       TEXT NOT NULL,    -- 'booking_com' | 'airbnb' | 'mmt' | 'goibibo' | 'agoda'
  event_type    TEXT NOT NULL,    -- 'availability' | 'rate' | 'reservation' | 'cancellation'
  payload       JSONB,
  outcome       TEXT NOT NULL CHECK (outcome IN ('success', 'error', 'skipped')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_property ON channel_sync_log(property_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- External reservations (OTA bookings pulled from channel manager)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_reservations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id            UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel                TEXT NOT NULL,
  channel_reservation_id TEXT NOT NULL,
  guest_name             TEXT,
  check_in               DATE NOT NULL,
  check_out              DATE NOT NULL,
  guest_count            INT,
  amount_paise           BIGINT,
  status                 TEXT NOT NULL DEFAULT 'confirmed',
  raw_payload            JSONB,
  booking_id             UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel, channel_reservation_id)
);
CREATE INDEX IF NOT EXISTS idx_ext_reservations_property ON external_reservations(property_id, check_in, check_out);

-- ─────────────────────────────────────────────────────────────────────
-- Schema corrections to existing tables
-- ─────────────────────────────────────────────────────────────────────

-- properties: add descriptor and practical fields
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS descriptor       TEXT DEFAULT 'by Habbaa',
  ADD COLUMN IF NOT EXISTS bathroom_count   INT,
  ADD COLUMN IF NOT EXISTS bedroom_count    INT,
  ADD COLUMN IF NOT EXISTS parking_spaces   INT,
  ADD COLUMN IF NOT EXISTS has_power_backup BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS has_wifi         BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS google_place_id  TEXT,
  ADD COLUMN IF NOT EXISTS ota_links        JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS review_links     JSONB DEFAULT '{}';

-- rooms: add rich detail fields
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS slug            TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS features        TEXT[],
  ADD COLUMN IF NOT EXISTS bathroom_type   TEXT,   -- 'ensuite' | 'shared' | 'attached'
  ADD COLUMN IF NOT EXISTS has_ac          BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS size_sqft       INT;

-- bookings: add source tracking and expiry for hold sweeper
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source                 TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS channel_reservation_id TEXT,
  ADD COLUMN IF NOT EXISTS expires_at             TIMESTAMPTZ;

-- property_images: add blur placeholder and dimensions for CLS prevention
ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS blur_data_url TEXT,
  ADD COLUMN IF NOT EXISTS width         INT,
  ADD COLUMN IF NOT EXISTS height        INT,
  ADD COLUMN IF NOT EXISTS caption       TEXT,
  ADD COLUMN IF NOT EXISTS room_id       UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- Update allowed image categories (add missing, keep existing)
ALTER TABLE property_images
  DROP CONSTRAINT IF EXISTS property_images_category_check;
ALTER TABLE property_images
  ADD CONSTRAINT property_images_category_check
  CHECK (category IN ('hero', 'living', 'bedroom', 'dining', 'exterior',
                      'bathroom', 'kitchen', 'outdoor', 'surroundings'));

-- ─────────────────────────────────────────────────────────────────────
-- RLS on new tables
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE property_amenities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_policies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_places         ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_sync_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_reservations ENABLE ROW LEVEL SECURITY;

-- Public read on content tables (published only)
CREATE POLICY "public_read_amenities"    ON property_amenities    FOR SELECT USING (is_available);
CREATE POLICY "public_read_policies"     ON property_policies     FOR SELECT USING (is_published);
CREATE POLICY "public_read_faqs"         ON faqs                  FOR SELECT USING (is_published);
CREATE POLICY "public_read_nearby"       ON nearby_places         FOR SELECT USING (is_published);
CREATE POLICY "public_read_offers"       ON offers                FOR SELECT USING (is_published);
CREATE POLICY "public_read_events"       ON events                FOR SELECT USING (is_published);
CREATE POLICY "public_read_sections"     ON page_sections         FOR SELECT USING (is_published);

-- Enquiries: anyone can insert (contact form), service_role manages the rest
CREATE POLICY "public_insert_enquiries"  ON enquiries             FOR INSERT WITH CHECK (true);

-- channel_sync_log, external_reservations: service_role only (BYPASSRLS)
-- No permissive policies needed — service_role bypasses RLS.

-- ─────────────────────────────────────────────────────────────────────
-- Grants on new tables (read-only for anon + authenticated)
-- ─────────────────────────────────────────────────────────────────────
GRANT SELECT ON property_amenities    TO anon, authenticated;
GRANT SELECT ON property_policies     TO anon, authenticated;
GRANT SELECT ON faqs                  TO anon, authenticated;
GRANT SELECT ON nearby_places         TO anon, authenticated;
GRANT SELECT ON offers                TO anon, authenticated;
GRANT SELECT ON events                TO anon, authenticated;
GRANT SELECT ON page_sections         TO anon, authenticated;
GRANT INSERT ON enquiries             TO anon, authenticated;
GRANT SELECT ON enquiries             TO authenticated;
