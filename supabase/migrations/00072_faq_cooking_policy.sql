-- 00072: update FAQ answer for cooking at the villa.
UPDATE faqs
   SET answer = 'The kitchen is available for preparing simple meals. To keep the villa comfortable for everyone, we request that guests avoid foods with strong or lingering odours.'
 WHERE question = 'Can guests cook at the villa?'
   AND property_id = (SELECT id FROM properties WHERE slug = 'villa-19');
