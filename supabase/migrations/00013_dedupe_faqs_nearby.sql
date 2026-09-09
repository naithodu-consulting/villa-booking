-- ── De-duplicate seeded content tables and prevent recurrence ────────────────
-- faqs, nearby_places and pricing_rules were each seeded twice (seed_phase1.sql,
-- then the consolidated seed.sql). Their INSERTs carried a bare
-- ON CONFLICT DO NOTHING, which only guards the primary key — and the primary
-- key is a gen_random_uuid(), so it never collides. Every row was inserted twice.
--
-- 00011 fixed exactly this for property_amenities with a unique constraint;
-- faqs, nearby_places and pricing_rules were missed. Same fix, applied
-- consistently. property_policies was never affected: it already had a real
-- ON CONFLICT (property_id, key) target.
--
-- pricing_rules is on a money path, so it is worth being explicit: no guest was
-- ever mischarged. calculatePricing() uses pricingRules.find(), which takes the
-- first match, and the duplicate rows are byte-identical (verified: one distinct
-- rate and one distinct date range per rule_name). The risk being closed is
-- future: once an admin edits one copy of a pair, .find() would choose
-- nondeterministically between two rows sharing a start_date.
--
-- Order matters: duplicates must go before a unique constraint can be added.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop duplicates, keeping the earliest physical row of each group ──────
DELETE FROM faqs
 WHERE ctid NOT IN (
     SELECT MIN(ctid) FROM faqs GROUP BY property_id, question
 );

DELETE FROM nearby_places
 WHERE ctid NOT IN (
     SELECT MIN(ctid) FROM nearby_places GROUP BY property_id, name
 );

DELETE FROM pricing_rules
 WHERE ctid NOT IN (
     SELECT MIN(ctid) FROM pricing_rules GROUP BY property_id, rule_name
 );

-- ── 2. Make a repeat impossible ─────────────────────────────────────────────
-- Guarded so the migration is safe to re-run (Postgres has no
-- ADD CONSTRAINT IF NOT EXISTS).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_faq_property_question') THEN
        ALTER TABLE faqs ADD CONSTRAINT uq_faq_property_question
            UNIQUE (property_id, question);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_nearby_property_name') THEN
        ALTER TABLE nearby_places ADD CONSTRAINT uq_nearby_property_name
            UNIQUE (property_id, name);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pricing_property_rule') THEN
        ALTER TABLE pricing_rules ADD CONSTRAINT uq_pricing_property_rule
            UNIQUE (property_id, rule_name);
    END IF;
END $$;
