-- 00050: FAQs replaced with the operator's set, 2026-09-30.
--
-- 42 questions in ten sections (category holds the section name, display_order
-- the operator's numbering x10). is_featured marks the eight shown on the home
-- page; the full list lives on /faq. The previous nine FAQs are removed.

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

DELETE FROM faqs WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001';

INSERT INTO faqs (property_id, question, answer, category, display_order, is_published, is_featured) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is Villa 19 booked as an entire villa?', 'Yes. Villa 19 is available exclusively as a private whole-villa stay. Individual rooms cannot be booked separately.', 'About Villa 19', 10, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many guests can Villa 19 accommodate?', 'Villa 19 is designed for 8 guests comfortably and can accommodate up to 14 guests with additional sleeping arrangements and applicable charges.', 'About Villa 19', 20, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What is included in the base booking price?', 'The base price includes exclusive use of the entire villa, including all 4 bedrooms, private lounge, lawn, rooftop terrace, parking and shared spaces. The base rate is for up to 8 guests.', 'About Villa 19', 30, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many bedrooms and bathrooms are there?', 'Villa 19 has 4 bedrooms, 3 bathrooms and a private lounge.', 'About Villa 19', 40, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the villa suitable for families and groups?', 'Yes. Villa 19 is designed for families, groups of friends, family gatherings and relaxed group stays.', 'About Villa 19', 50, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can I book Villa 19 for more than 8 guests?', 'Yes. Additional guests can be accommodated up to the maximum capacity of 14 guests, with applicable additional-guest charges.', 'Booking & Guests', 60, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are children counted towards occupancy?', 'Yes. Children are included in the total occupancy. Children below 5 years stay free. Children aged 5-12 years are charged at 50% of the applicable guest rate, while guests above 12 years are charged at the full rate.', 'Booking & Guests', 70, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is government ID required at check-in?', 'Yes. A valid government-issued photo ID is required for all registered guests at check-in. Sharing ID details in advance can help make the check-in process faster.', 'Booking & Guests', 80, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are visitors allowed at the villa?', 'Only guests included in the booking are permitted within the premises. Unregistered outside visitors are not allowed.', 'Booking & Guests', 90, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is a security deposit required?', 'A refundable security deposit may be collected at check-in, depending on the booking. Subject to property inspection after check-out, it will be refunded to the original payment method within 5 working days.', 'Booking & Guests', 100, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are unmarried couples allowed to stay at Villa 19?', 'Villa 19 is primarily intended for families and family groups. Stays by unmarried couples are not encouraged. All guests must provide valid government-issued photo identification at check-in.', 'Booking & Guests', 110, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What are the check-in and check-out timings?', 'Standard check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in and late check-out may be available on request, subject to availability.', 'Check-in & Check-out', 120, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can I request early check-in or late check-out?', 'Yes. Requests can be made in advance and will be accommodated wherever possible, subject to availability and applicable charges.', 'Check-in & Check-out', 130, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can someone else check in on my behalf?', 'The person making the booking should normally be present at check-in. Alternative arrangements should be confirmed with Villa 19 in advance.', 'Check-in & Check-out', 140, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is a kitchen available for guests?', 'Yes. The villa has a fully equipped kitchen with a refrigerator, cookware, crockery and basic cooking essentials.', 'Kitchen & Amenities', 150, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can guests cook at the villa?', 'Yes. Guests are welcome to prepare simple meals using the kitchen facilities. Food can also be arranged from outside. Cooking pungent food items is not allowed.', 'Kitchen & Amenities', 160, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is Wi-Fi available?', 'Yes. High-speed Wi-Fi is available throughout the villa.', 'Kitchen & Amenities', 170, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is there a TV?', 'Yes. The lounge has a 50-inch Smart TV with OTT apps.', 'Kitchen & Amenities', 180, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are indoor games available?', 'Yes. A selection of indoor games is available in the lounge.', 'Kitchen & Amenities', 190, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is power backup available?', 'Yes. The villa has inverter power backup for essential loads including fans, lighting, Wi-Fi and other selected equipment.', 'Kitchen & Amenities', 200, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is hot water available?', 'Yes. 24/7 hot water is available.', 'Kitchen & Amenities', 210, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are all bedrooms air-conditioned?', 'Yes. All 4 bedrooms have air conditioning.', 'Bedrooms & Bathrooms', 220, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What type of beds are available?', 'Villa 19 has a combination of king and queen beds, with two guests comfortably accommodated in each bedroom.', 'Bedrooms & Bathrooms', 230, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are bed linen and towels provided?', 'Yes. Fresh bed linen, pillows, bath towels and hand towels are provided.', 'Bedrooms & Bathrooms', 240, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are toiletries provided?', 'Yes. Premium basic toiletries are provided for guests.', 'Bedrooms & Bathrooms', 250, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are additional sleeping arrangements available?', 'Yes. Additional sleeping arrangements are available for larger groups, allowing the villa to accommodate up to 14 guests.', 'Bedrooms & Bathrooms', 260, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many cars can be parked at the villa?', 'Villa 19 has private parking for up to 8 vehicles within the property, subject to vehicle size and parking arrangement.', 'Parking & Outdoor Spaces', 270, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Does Villa 19 have outdoor spaces?', 'Yes. The property includes a private lawn, outdoor seating and a covered rooftop terrace.', 'Parking & Outdoor Spaces', 280, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the rooftop terrace private?', 'Yes. The covered rooftop terrace is exclusively available to guests staying at Villa 19.', 'Parking & Outdoor Spaces', 290, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are parties or events allowed?', 'No. Parties, events, loud gatherings and commercial activities are not permitted.', 'House Rules', 300, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What are the quiet hours?', 'Guests are requested to maintain low noise levels between 10:00 PM and 7:00 AM, out of consideration for the neighbourhood.', 'House Rules', 310, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is smoking allowed?', 'Smoking is not permitted inside the villa, including bedrooms and bathrooms. Cleaning and restoration charges apply for violations.', 'House Rules', 320, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are pets allowed?', 'No. Pets are not permitted at Villa 19.', 'House Rules', 330, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are unregistered guests allowed?', 'No. Only guests included in the booking are permitted within the premises.', 'House Rules', 340, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the property monitored by CCTV?', 'Yes. CCTV surveillance is provided in common outdoor areas for property security. There are no cameras in private guest areas.', 'Safety & Security', 350, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are fire extinguishers available?', 'Yes. Fire extinguishers are provided at appropriate locations within the property.', 'Safety & Security', 360, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is a first-aid kit available?', 'Yes. A first-aid kit is available at the villa.', 'Safety & Security', 370, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Where is Villa 19 located?', 'Villa 19 is located in Urwa, Mangalore, in a peaceful residential setting with convenient access to the main road, local markets, shops and everyday amenities.', 'Location', 380, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is Villa 19 close to the city?', 'Yes. The villa offers a quiet setting while remaining conveniently connected to Mangalore''s key areas.', 'Location', 390, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the villa suitable as a base for exploring Mangalore?', 'Yes. Its location in Urwa provides convenient access to the city, while the private villa offers a relaxed space to return to after exploring Mangalore.', 'Location', 400, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the driver room included in the four bedrooms?', 'No. The dedicated Driver Room is separate from the four guest bedrooms and is intended for driver/staff accommodation.', 'Additional Accommodation', 410, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can the driver stay at the property?', 'Yes. A dedicated driver room with an attached bathroom is available separately from the guest accommodation.', 'Additional Accommodation', 420, TRUE, FALSE);
