-- 00033: re-measured Location & Nearby distances and travel times,
-- per the operator 2026-09-25.
--
-- The previous figures were estimates and several were not achievable: four
-- entries implied 35-42 km/h through Mangalore city traffic, and the airport
-- claimed 20 minutes against a real 25-40. Three separate places all sat at
-- exactly "5 min", which is what gave the estimates away.
--
-- These are the operator's own measurements. Implied speeds now run 20-30 km/h,
-- which matches city driving; nothing reads as too fast.
--
-- Also in this pass: Someshwar Beach, St. Aloysius Chapel, Hotel Srinivas,
-- Forum Fiza Mall and Mangaladevi Temple are dropped; Ideal Ice Cream becomes
-- Pabbas Ideal Cafe, Big Bazaar becomes City Centre Mall, and Bajpe Airport
-- takes its full name; Nilgiris and Kudroli Temple are added.
--
-- Clears the property's rows and re-inserts, so this is safe to run twice.

DELETE FROM nearby_places WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001';

INSERT INTO nearby_places
  (property_id, name, category, distance_km, travel_minutes, note, display_order, is_published)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Main Road & Bus Stand',                 'transport',  0.1,  1, 'Local bus stand and the main road, a two-minute walk',  10, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Super Market',                          'shopping',   0.2,  2, 'Everyday groceries and essentials, a short walk away',  20, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Panambur Beach',                        'beach',      7.3, 15, 'Popular sandy beach, clean and family-friendly',        30, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Tannirbhavi Beach',                     'beach',      8.8, 20, 'Quieter, less crowded: good for morning walks',         40, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kadri Manjunath Temple',                'temple',     4.2, 10, NULL,                                                   50, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sharavu Mahaganapathi Temple',          'temple',     4.0, 10, NULL,                                                   60, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pabbas Ideal Cafe',                     'food',       2.2,  5, NULL,                                                   70, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Machali Restaurant',                    'food',       3.3,  8, NULL,                                                   80, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Nilgiris',                              'shopping',   0.7,  2, NULL,                                                   90, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Urwa Market',                           'shopping',   0.8,  3, NULL,                                                  100, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'City Centre Mall',                      'shopping',   3.8, 10, NULL,                                                  110, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangalore Central Station',             'transport',  5.0, 13, NULL,                                                  120, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangalore International Airport (IXE)', 'transport', 11.0, 22, NULL,                                                  130, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'KSRTC Bus Stand',                       'transport',  3.3, 10, NULL,                                                  140, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pilikula Nisarga Dhama',                'attraction',14.0, 30, NULL,                                                  150, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sultan Battery',                        'attraction', 1.7,  5, NULL,                                                  160, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kudroli Temple',                        'temple',     2.9,  8, NULL,                                                  170, TRUE);
