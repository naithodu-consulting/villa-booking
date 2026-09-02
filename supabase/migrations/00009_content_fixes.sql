-- Content fixes: align cancellation policy (30/15 days), quiet hours (11 PM),
-- and remove em/en dashes from DB-stored text.

-- ── 1. Property policies (house rules) ──────────────────────────────────────
-- Fix quiet hours: change 22:00/23:00 to consistent "11 PM" language
UPDATE property_policies
SET body =
  'Quiet hours are observed from 11 PM to 7 AM. Music or amplified sound outside the villa is not permitted after 11 PM, out of respect for neighbours.'
WHERE key = 'quiet_hours'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix cancellation policy in property policies (if stored there)
UPDATE property_policies
SET body =
  '30 or more days before check-in: 90% refund. 15 to 30 days before check-in: 50% refund. Less than 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out, subject to no damage.'
WHERE key = 'cancellation'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix government ID rule (em dash removal)
UPDATE property_policies
SET body =
  'All adult guests must present valid government-issued photo ID at check-in: Aadhaar card, passport, or driving licence. This is a legal requirement under Karnataka state regulations. Soft copies must be shared via WhatsApp before arrival.'
WHERE key = 'government_id'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix kitchen policy (em dash removal)
UPDATE property_policies
SET body =
  'The fully equipped kitchen is available for self-catering throughout your stay. Guests are welcome to bring their own groceries. Please clean up after cooking and leave the kitchen as you found it. The kitchen is not staffed - no in-house cook is provided.'
WHERE key = 'kitchen_policy'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- ── 2. FAQs ─────────────────────────────────────────────────────────────────
-- Fix cancellation policy FAQ answer
UPDATE faqs
SET answer =
  'Cancellations 30 or more days before check-in receive a 90% refund. 15 to 30 days before check-in: 50% refund. Less than 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out.'
WHERE question ILIKE '%cancellation policy%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix base price FAQ (em dash removal)
UPDATE faqs
SET answer =
  'The base price covers exclusive use of the entire villa: all 4 bedrooms, private lawn, balconies, covered parking, high-speed Wi-Fi, and 24/7 caretaker service. Cooking gas and kitchen basics are also included.'
WHERE question ILIKE '%base booking price%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix kitchen FAQ (em dash removal)
UPDATE faqs
SET answer =
  'Yes. The villa has a fully equipped kitchen: gas stove, refrigerator, microwave, cookware and utensils. Guests are welcome to bring groceries or order from nearby restaurants and food delivery services. No in-house cook is provided.'
WHERE question ILIKE '%kitchen available%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix beach distance FAQ (en dash removal)
UPDATE faqs
SET answer =
  'The nearest beach is approximately 1.5 km from the villa, about a 5-minute drive or a leisurely 15 to 20 minute walk. The villa is also close to the main road, local market and everyday shops.'
WHERE question ILIKE '%beach%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix events FAQ (em dash removal)
UPDATE faqs
SET answer =
  'Yes. The villa is well suited for private family gatherings, milestone celebrations and corporate offsites. The spacious lawn is ideal for outdoor celebrations. Please contact us before booking for event enquiries - special terms and event-specific pricing may apply.'
WHERE question ILIKE '%events%' OR question ILIKE '%gatherings%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- Fix government ID FAQ (em dash removal)
UPDATE faqs
SET answer =
  'Yes. All adult guests must present valid government-issued photo ID: Aadhaar card, passport or driving licence, at check-in. This is a legal requirement. We request that soft copies be shared via WhatsApp before arrival for faster check-in.'
WHERE question ILIKE '%government ID%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- ── 3. Nearby places notes (em dash removal) ────────────────────────────────
UPDATE nearby_places
SET note = REPLACE(note, ' — ', ': ')
WHERE property_id IN (SELECT id FROM properties WHERE slug = 'villa-19')
  AND note LIKE '%—%';
