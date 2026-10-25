-- 00106: realign the cancellation tiers to the Airbnb listing.
--
-- The Airbnb listing offers a full refund at least 14 days before check-in and
-- a partial refund from 7 to 14 days, while this row still carried the old
-- direct-booking ladder (100% at 30+, 50% at 15-29, nothing under 15). A guest
-- who priced the same stay on both channels before booking direct was quoted
-- two different policies, and the stricter one was ours.
--
-- Airbnb's own card overlaps at day 14 ("at least 14 days" for the full refund,
-- "7-14 days" for the partial one). The operator resolved it in favour of the
-- partial band, so day 14 pays 50% and the windows stay exclusive:
-- "15 or more" and "7 to 14" must not both claim day 14.
--
-- The site renders its own copy from src/lib/cancellation.ts, which changed in
-- the same commit. This row is the copy Ooruda Villa reads. Supersedes 00056,
-- 00015 and 00009.

UPDATE property_policies
   SET body = 'More than 14 days before check-in: 100% refund. 7 to 14 days before check-in: 50% refund. Under 7 days before check-in: no refund. A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.'
 WHERE key = 'cancellation'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
