-- 00040: villa rules, per the operator 2026-09-28.
--
-- Eight rules in a fixed order: three new (visitors, occupancy, care for the
-- property) and five reworded. "No Parties" drops "events": the villa still
-- hosts private celebrations (see the Events page), just not parties, loud
-- gatherings or commercial use. The site's home page and Stay Guide carry the
-- same wording from src/lib/villa-rules.ts; keep the two in step.
-- Kitchen and housekeeping move after the rules; their text is unchanged.

INSERT INTO property_policies (property_id, key, title, body, category, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'id_requirement', 'Registered Guests Only', 'Government photo ID is required at check-in for every guest: Aadhaar, passport or driving licence. Please share copies on WhatsApp before arrival for a faster check-in.', 'id', 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'visitors', 'Visitors', 'Unregistered visitors are not permitted on the premises.', 'rules', 21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'occupancy', 'Occupancy', 'Up to 14 guests are permitted. The base rate covers 8 guests, with extra-guest charges from the ninth guest.', 'rules', 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'events_policy', 'No Parties', 'Parties, loud gatherings and commercial activities are not permitted.', 'events', 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'quiet_hours', 'Quiet Hours: 10 PM to 7 AM', 'Please keep noise to a minimum and respect the neighbourhood.', 'rules', 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'no_smoking', 'No Smoking Indoors', 'Smoking is prohibited inside the villa. Cleaning and restoration charges apply for violations.', 'smoking', 25),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'pets_policy', 'No Pets', 'Pets are not permitted anywhere on the property.', 'pets', 26),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'property_care', 'Care for the Property', 'Guests are responsible for the villa, its furnishings and amenities during their stay.', 'rules', 27)
ON CONFLICT (property_id, key) DO UPDATE
  SET title = EXCLUDED.title, body = EXCLUDED.body,
      category = EXCLUDED.category, display_order = EXCLUDED.display_order;

UPDATE property_policies SET display_order = 30 WHERE key = 'kitchen_policy'      AND property_id = 'a1b2c3d4-0000-0000-0000-000000000001';
UPDATE property_policies SET display_order = 31 WHERE key = 'housekeeping_policy' AND property_id = 'a1b2c3d4-0000-0000-0000-000000000001';
