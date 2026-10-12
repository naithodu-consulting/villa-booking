-- Update About the Villa description on the home page
UPDATE properties
SET description = 'Villa 19 is a spacious 4-bedroom private villa in Mangalore, thoughtfully designed for families and groups seeking comfort, privacy and space to be together. Set amidst lush greenery in Urwa, the villa features generous living spaces, a manicured lawn, balconies across every floor, and ample private parking.

Set in Urwa, one of Mangalore''s well-connected residential neighbourhoods, Villa 19 is tucked away in a peaceful setting yet close to the heart of the city. Just minutes from the main road, local markets, shops and everyday conveniences, its location makes it easy to explore Mangalore while giving you a quiet space to return to at the end of the day.'
WHERE slug = 'villa19';
