-- Cancellation policy: remove the overlapping day-30 boundary.
--
-- 00009_content_fixes.sql wrote "30 or more days before check-in: 90% refund.
-- 15 to 30 days before check-in: 50% refund." Both clauses claim day 30, so a
-- guest cancelling exactly 30 days out could read either figure. On a refund
-- policy that ambiguity is a dispute waiting to happen.
--
-- Resolved in favour of the guest, per the operator 2026-09-09: day 30 pays 90%.
-- The middle tier therefore ends at day 29.

UPDATE property_policies
SET body = '30 or more days before check-in: 90% refund. 15 to 29 days before check-in: 50% refund. Under 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out, subject to no damage.'
WHERE key = 'cancellation'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE faqs
SET answer = 'Cancellations 30 or more days before check-in receive a 90% refund. 15 to 29 days before check-in: 50% refund. Under 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out.'
WHERE question ILIKE '%cancellation policy%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');


-- ── 12-hour clock across guest-facing copy ──────────────────────────────────
-- Times are stored as 24-hour "HH:MM" and formatted for display by
-- formatTime12() in src/lib/format.ts, but this prose had 24-hour times baked
-- into the text itself, so it read "14:00" beside a rendered "2:00 PM".

UPDATE faqs
SET answer = 'Standard check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out are available on request (subject to availability). Please contact us at least 24 hours in advance.'
WHERE answer LIKE '%Standard check-in is at 14:00%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE property_policies
SET body = 'Check-in: 2:00 PM · Check-out: 11:00 AM. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.'
WHERE key = 'checkin_time'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');


-- ── Corrected distance claim ────────────────────────────────────────────────
-- The description said "The beach is just 1.5 km away". Routing from the
-- corrected coordinates (Urwa Mariyamma Circle) puts the nearest beach
-- (Panambur) at 7.6 km by road and Tannirbhavi at 8.8 km, so 1.5 km overstated
-- proximity by roughly five times.
UPDATE properties
SET description = REPLACE(description, 'The beach is just 1.5 km away.', 'The beach is about 8 km away.')
WHERE slug = 'villa-19';

-- The beach FAQ carried the same overstated 1.5 km figure, plus a "15 to 20
-- minute walk" that is not achievable over 7.6 km.
UPDATE faqs
SET answer = 'The nearest beach, Panambur, is about 7.6 km from the villa, roughly a 15-minute drive. Tannirbhavi Beach is about 8.8 km. The villa is also close to the main road, local market and everyday shops.'
WHERE question ILIKE '%beach%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Featured amenity carried the same figure and shows in the homepage highlights.
UPDATE property_amenities SET label = 'Beach 8 km Away'
WHERE label = 'Beach 1.5 km Away'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- ── nearby_places distances re-routed for the corrected coordinates ────────
-- Every row was measured from the old pin, 3.2 km south-east of Urwa Mariyamma
-- Circle, so Panambur Beach was stored at 1.5 km when it is 7.6 km by road.
-- Figures are OSRM driving distance with times rounded up for city traffic.
-- Not updated (geocoding was unreliable or ambiguous, verify locally):
--   Someshwar Beach, Kadri Manjunath Temple, Sharavu Mahaganapathi Temple,
--   Pilikula Nisarga Dhama, Sultan Battery, Big Bazaar, KSRTC Bus Stand, Urwa Market.
UPDATE nearby_places SET distance_km = 7.6, travel_minutes = 10 WHERE name = 'Panambur Beach'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 8.8, travel_minutes = 20 WHERE name = 'Tannirbhavi Beach'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 13.0, travel_minutes = 20 WHERE name = 'Bajpe Airport (IXE)'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 4.3, travel_minutes = 10 WHERE name = 'Mangalore Central Station'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 4.4, travel_minutes = 10 WHERE name = 'Forum Fiza Mall'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 5.8, travel_minutes = 10 WHERE name = 'Mangaladevi Temple'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 3.2, travel_minutes = 5 WHERE name = 'St. Aloysius Chapel'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 2.7, travel_minutes = 5 WHERE name = 'Machali Restaurant'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 3.3, travel_minutes = 5 WHERE name = 'Ideal Ice Cream'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
UPDATE nearby_places SET distance_km = 3.5, travel_minutes = 5 WHERE name = 'Hotel Srinivas'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
