-- 00049: check-in moves to 3:00 PM and parking is for up to 8 vehicles, per the
-- operator 2026-09-30.
--
-- check_in_time drives the booking widget, checkout, confirmation page and
-- emails, the Stay Guide, Terms and structured data. The policy and FAQ repeat
-- the time in prose, so they are updated too.

UPDATE properties
   SET check_in_time = '15:00', updated_at = NOW()
 WHERE slug = 'villa-19';

UPDATE property_policies
   SET body = replace(body, 'Check-in: 2:00 PM', 'Check-in: 3:00 PM')
 WHERE key = 'checkin_time'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE faqs
   SET answer = replace(answer, 'Standard check-in is at 2:00 PM', 'Standard check-in is at 3:00 PM')
 WHERE property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE property_amenities
   SET label = 'Private parking for up to 8 vehicles'
 WHERE label = 'Private parking for up to 10 vehicles'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
