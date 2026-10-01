-- 00051: check-in moves back to 2:00 PM and check-out moves to 10:00 AM, per
-- the operator 2026-10-01. Supersedes the 3:00 PM check-in set in 00049.
--
-- check_in_time/check_out_time drive the booking widget, checkout, confirmation
-- page and emails, the Stay Guide, Terms and structured data. The policy and FAQ
-- repeat both times in prose, so they are updated too.

UPDATE properties
   SET check_in_time = '14:00', check_out_time = '10:00', updated_at = NOW()
 WHERE slug = 'villa-19';

UPDATE property_policies
   SET body = replace(
         replace(body, 'Check-in: 3:00 PM', 'Check-in: 2:00 PM'),
         'Check-out: 11:00 AM', 'Check-out: 10:00 AM')
 WHERE key = 'checkin_time'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE faqs
   SET answer = replace(
         replace(answer, 'Standard check-in is at 3:00 PM', 'Standard check-in is at 2:00 PM'),
         'check-out is at 11:00 AM', 'check-out is at 10:00 AM')
 WHERE property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
