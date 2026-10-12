-- 00071: update FAQ answer for bookings of more than 8 guests.
UPDATE faqs
   SET answer = 'Villa 19 comfortably accommodates 8 guests and can host up to 14. Additional guests are accommodated on extra mattresses in three bedrooms and the lounge.'
 WHERE question = 'Can I book Villa 19 for more than 8 guests?'
   AND property_id = (SELECT id FROM properties WHERE slug = 'villa-19');
