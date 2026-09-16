-- 00021: pricing and occupancy update, per the operator 2026-09-15.
--
-- Occupancy: the nightly rate now covers 12 guests (was 8). Up to 3 more can
-- stay for Rs 1,000 each per night (was Rs 750), so the hard cap is 15.
-- The site still advertises "up to 12 guests"; 15 is the booking limit.
--
-- Seasonal pricing: the Diwali, New Year and Summer rules are removed, with
-- their minimum stays. Dates are priced at the normal weekday/weekend rates
-- unless Ooruda Villa adds a rule. The one exception kept here: the nights of
-- 31 Dec 2026 and 1 Jan 2027 at Rs 16,000, no minimum stay.
-- end_date is exclusive (docs/OORUDA_VILLA_INTEGRATION.md): 2027-01-02 means
-- the last priced night is 1 Jan.
--
-- Weekday (Rs 12,000) and weekend (Rs 14,000) rates are unchanged.

UPDATE properties
   SET base_occupancy   = 12,
       max_occupancy    = 15,
       extra_guest_rate = 100000,
       updated_at       = NOW()
 WHERE slug = 'villa-19';

DELETE FROM pricing_rules
 WHERE property_id = (SELECT id FROM properties WHERE slug = 'villa-19');

INSERT INTO pricing_rules (property_id, rule_name, start_date, end_date, nightly_rate, min_stay_nights)
SELECT id, 'New Year''s Eve and New Year''s Day', '2026-12-31', '2027-01-02', 1600000, 1
  FROM properties
 WHERE slug = 'villa-19';
