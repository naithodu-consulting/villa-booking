-- 00045: two villa rules back to the operator's wording, 2026-09-29.
--
-- 00040 had them edited: Occupancy explained the base rate and first charged
-- guest, and Care for the Property read as liability ("responsible for the
-- villa") rather than conduct ("using ... responsibly"). The site's shared list
-- (src/lib/villa-rules.ts) carries the same text.

UPDATE property_policies
   SET body = 'Up to 14 guests are permitted, with charges applicable beyond 8 guests.'
 WHERE key = 'occupancy'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE property_policies
   SET body = 'Guests are responsible for using the villa, furnishings and amenities responsibly.'
 WHERE key = 'property_care'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
