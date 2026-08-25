-- Migration: 00003_supporting_tables.sql
-- Description: User profiles, guest reviews, audit log, and notification templates

-- 1. USER PROFILES TABLE
--    Mirrors auth.users (one row per Supabase Auth user). Only admin-role users exist for now.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'admin', -- admin | owner | staff
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 2. GUEST REVIEWS TABLE
--    Only confirmed + completed bookings may leave a review (enforced by FK + check).
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    headline VARCHAR(150),
    body TEXT,
    is_approved BOOLEAN DEFAULT FALSE, -- admin-moderated before display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews (property_id, is_approved);


-- 3. AUDIT LOG TABLE
--    Append-only ledger for admin actions and payment state changes.
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role VARCHAR(30),
    event_type VARCHAR(100) NOT NULL, -- e.g. booking.confirmed, payment.captured, date.blocked
    entity_type VARCHAR(50),          -- e.g. booking, payment, blocked_date
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs (actor_id, created_at DESC);


-- 4. NOTIFICATION TEMPLATES TABLE
--    Stores email/WhatsApp template bodies keyed by event name.
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) UNIQUE NOT NULL, -- booking.confirmed, booking.cancelled, payment.failed
    channel VARCHAR(20) NOT NULL DEFAULT 'email', -- email | whatsapp
    subject VARCHAR(255),                    -- email subject (null for WhatsApp)
    body_html TEXT,                          -- HTML for email
    body_text TEXT NOT NULL,                 -- plain text / WhatsApp message
    variables JSONB,                         -- list of {{placeholders}} for documentation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed core templates
INSERT INTO notification_templates (event_name, channel, subject, body_html, body_text, variables) VALUES
(
    'booking.confirmed',
    'email',
    'Your booking at {{property_name}} is confirmed! Ref: {{reference_number}}',
    NULL,
    E'Hi {{guest_name}},\n\nYour booking is confirmed!\n\nRef: {{reference_number}}\nProperty: {{property_name}}\nCheck-in: {{check_in}} at 2:00 PM\nCheck-out: {{check_out}} at 11:00 AM\nGuests: {{num_guests}}\nTotal Paid: {{total_amount}}\n\nFor any queries, WhatsApp us at {{whatsapp_number}}.\n\nSee you soon!',
    '["guest_name","reference_number","property_name","check_in","check_out","num_guests","total_amount","whatsapp_number"]'::jsonb
),
(
    'booking.cancelled',
    'email',
    'Booking {{reference_number}} Cancelled',
    NULL,
    E'Hi {{guest_name}},\n\nYour booking (Ref: {{reference_number}}) has been cancelled.\n\nRefund of {{refund_amount}} will be credited within 5–7 business days to your original payment method.\n\nFor queries: {{whatsapp_number}}',
    '["guest_name","reference_number","refund_amount","whatsapp_number"]'::jsonb
),
(
    'payment.failed',
    'email',
    'Payment failed for your booking at {{property_name}}',
    NULL,
    E'Hi {{guest_name}},\n\nYour payment of {{total_amount}} for booking Ref: {{reference_number}} could not be processed.\n\nPlease retry: {{retry_url}}\nOr WhatsApp us: {{whatsapp_number}}',
    '["guest_name","reference_number","total_amount","retry_url","whatsapp_number"]'::jsonb
)
ON CONFLICT (event_name) DO NOTHING;


-- 5. ROW LEVEL SECURITY
--    Profiles: users can read/update their own row; service role bypasses RLS.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_write" ON profiles FOR UPDATE USING (auth.uid() = id);

--    Reviews: public can read approved reviews; only service role inserts/updates.
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_approved = TRUE);

--    Audit logs: read-only for authenticated admins; only service role inserts.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON audit_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

--    Notification templates: read-only for authenticated admins.
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_admin_read" ON notification_templates FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
