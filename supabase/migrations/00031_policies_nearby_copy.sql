-- 00031: house-rule wording, walking-distance landmarks and caretaker removal,
-- per the operator 2026-09-25.
--
-- Quiet hours move 11 PM -> 10 PM. The operator wrote "10AM to 7PM"; confirmed
-- as 10 PM to 7 AM, since daytime quiet hours would invert the rule.
--
-- The caretaker is withdrawn everywhere: the FAQ that advertised 24/7 caretaker
-- service is deleted outright rather than reworded, because a guest who booked
-- expecting it would otherwise still find it promised.
--
-- BBQ grill and bonfire are likewise withdrawn: dropped from the amenities in
-- 00030, so the FAQ and the gallery caption that still offered them go too.

-- ── Policies ────────────────────────────────────────────
UPDATE property_policies
   SET body = 'Quiet hours are observed from 10 PM to 7 AM. Music or amplified sound outside the villa is not permitted after 10 PM, out of respect for neighbours.'
 WHERE key = 'quiet_hours';

UPDATE property_policies
   SET title = 'Pets Are Not Entertained',
       body  = 'Pets are not entertained at the villa. Please make alternative arrangements for your animals before booking.'
 WHERE key = 'pets_policy';

UPDATE property_policies
   SET body = 'Government photo ID is mandatory at check-in for all guests: Aadhaar card, passport, or driving licence. This is a legal requirement under Karnataka state regulations. Soft copies must be shared via WhatsApp before arrival.'
 WHERE key = 'id_requirement';

-- Outside guests are no longer admitted on approval; the rule is absolute.
UPDATE property_policies
   SET body = 'The villa is well suited for private family gatherings and milestone celebrations. Outside guests are not allowed beyond the booked group. Loud DJ music is not permitted. Contact us before booking for event enquiries.'
 WHERE key = 'events_policy';

UPDATE property_policies
   SET body = 'The villa is professionally cleaned before each check-in. Mid-stay housekeeping is available on request and may carry an additional charge for stays beyond 3 nights.'
 WHERE key = 'housekeeping_policy';

-- ── FAQs ────────────────────────────────────────────────
UPDATE faqs
   SET answer = 'Yes. Government photo ID is mandatory at check-in for all guests: Aadhaar card, passport or driving licence. This is a legal requirement. We request that soft copies be shared via WhatsApp before arrival for faster check-in.'
 WHERE question ILIKE '%government ID%';

UPDATE faqs
   SET answer = 'The base price covers exclusive use of the entire villa: all 4 bedrooms, private lawn, covered parking and high-speed Wi-Fi. Cooking gas and kitchen basics are also included.'
 WHERE question ILIKE '%included in the base booking price%';

DELETE FROM faqs WHERE question ILIKE '%caretaker%';

-- ── Gallery caption ─────────────────────────────────────
UPDATE property_images
   SET alt_text = 'Outdoor Dining Area'
 WHERE alt_text ILIKE '%bbq%' OR alt_text ILIKE '%bonfire%';

-- ── Walking-distance landmarks ──────────────────────────
-- Both are under a kilometre; formatDistance renders sub-km values in metres.
-- Distinct from the existing "KSRTC Bus Stand" (5 km) and "Urwa Market" (0.8 km).
INSERT INTO nearby_places (property_id, name, category, distance_km, travel_minutes, note, display_order)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Main Road & Bus Stand', 'transport', 0.1, 2, 'Local bus stand and the main road, a two-minute walk', 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Super Market',          'shopping',  0.3, 4, 'Everyday groceries and essentials, a short walk away',  2)
ON CONFLICT ON CONSTRAINT uq_nearby_property_name DO UPDATE SET
  category       = EXCLUDED.category,
  distance_km    = EXCLUDED.distance_km,
  travel_minutes = EXCLUDED.travel_minutes,
  note           = EXCLUDED.note,
  display_order  = EXCLUDED.display_order;
