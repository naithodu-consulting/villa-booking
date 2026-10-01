-- 00056: the 30+ day cancellation tier is a 100% refund, not 90%.
--
-- The homepage card said 100% while this policy row and the Terms page said
-- 90%, so a guest cancelling 30+ days out could read either. Resolved in favour
-- of 100% by the operator on 2026-10-01. Supersedes 00009 and 00015.
--
-- The site now renders both the homepage card and Terms from
-- src/lib/cancellation.ts; this row is the copy Ooruda Villa reads.

UPDATE property_policies
   SET body = replace(body, '30 or more days before check-in: 90% refund', '30 or more days before check-in: 100% refund')
 WHERE key = 'cancellation'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
