-- Check-in moves from 2:00 PM to 3:00 PM. The site reads this column
-- everywhere it states the time (homepage, stay guide, terms, confirmation
-- email, calendar invite), so this one update covers all of them.
UPDATE properties SET check_in_time = '15:00';

-- Retire the driver room FAQ. Unpublished rather than deleted so the wording,
-- reworked three times (00073, 00074, 00081), survives if it is wanted back.
-- The answer is updated alongside it to match seed.sql, which appends the
-- "prior request" sentence: an unpublished row still has to agree with the
-- seed, or a local reset and the remote diverge the moment it is republished.
UPDATE faqs
   SET is_published = FALSE,
       answer = 'No. The dedicated Driver Room is separate from the four guest bedrooms and is intended for driver/staff accommodation. It can be arranged upon prior request.'
 WHERE question = 'Is the driver room included in the four bedrooms?';

-- Drop two FAQs out of the featured set, which is what the homepage shows.
-- seed.sql flips is_featured for both; without these the homepage would differ
-- between a local reset and the remote, since the remote never runs seed.sql.
UPDATE faqs
   SET is_featured = FALSE
 WHERE question IN (
   'How many guests can Villa 19 accommodate?',
   'Is smoking allowed?'
 );

-- Two places state the time as prose rather than reading check_in_time, so the
-- column update above does not reach them. Both are guest-facing: the FAQ
-- accordion and the policies block.
UPDATE faqs
   SET answer = 'Standard check-in is at 3:00 PM and check-out is at 10:00 AM. Early check-in and late check-out may be available on request, subject to availability.'
 WHERE question = 'What are the check-in and check-out timings?';

UPDATE property_policies
   SET body = 'Check-in: 3:00 PM · Check-out: 10:00 AM. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.'
 WHERE title = 'Check-In & Check-Out';
