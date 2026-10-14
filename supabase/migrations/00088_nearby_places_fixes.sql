-- Remove KSRTC Bus Stand
DELETE FROM nearby_places WHERE name = 'KSRTC Bus Stand';

-- Fix store name casing
UPDATE nearby_places SET name = 'Supermarkets' WHERE name = 'SuperMarkets';

-- Full temple name
UPDATE nearby_places SET name = 'Kudroli Gokarnanatheshwara Temple' WHERE name = 'Kudroli Temple';

-- Correct Naturals Sundaes distance
UPDATE nearby_places SET distance_km = 1.3, travel_minutes = 4 WHERE name = 'Naturals Sundaes';
