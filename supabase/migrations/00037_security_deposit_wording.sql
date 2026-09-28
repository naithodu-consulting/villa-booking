-- 00037: security deposit wording, per the operator 2026-09-28.
--
-- The old sentences said when the deposit is refunded but not that it is
-- collected at check-in, and the policy version made the refund "subject to no
-- damage" while the site said "subject to property inspection". One wording
-- everywhere now, matching the Terms, home page and checkout copy.

UPDATE property_policies
   SET body = replace(body,
         'The security deposit is refunded within 5 working days of check-out, subject to no damage.',
         'A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.')
 WHERE key = 'cancellation'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE faqs
   SET answer = replace(answer,
         'The security deposit is refunded within 5 working days of check-out.',
         'A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.')
 WHERE question ILIKE '%cancellation policy%'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
