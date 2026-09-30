-- 00047: link gallery photos to their rooms, per the operator's room photos
-- (2026-09-30): Room 1 brown wall with grey bedding and wardrobes, Room 2 brown
-- wall with white bedding, Room 3 plum wall, Room 4 blue wall. The lounge photo
-- links to the Private Lounge. The Rooms page shows each room's linked photo.
-- Bedrooms are reordered 1-4 in the gallery; alt text names the room and its bed.

UPDATE property_images SET room_id = 'a1b2c3d4-0000-0000-0000-000000000011', display_order = 3,
       alt_text = 'Room 1: king bed, built-in wardrobes and air conditioning'
 WHERE url = '/gallery/bedroom-brown.jpg';
UPDATE property_images SET room_id = 'a1b2c3d4-0000-0000-0000-000000000012', display_order = 5,
       alt_text = 'Room 2: queen bed with a brown feature wall'
 WHERE url = '/gallery/bedroom-white.jpg';
UPDATE property_images SET room_id = 'a1b2c3d4-0000-0000-0000-000000000013', display_order = 8,
       alt_text = 'Room 3: queen bed with a plum feature wall and arched window'
 WHERE url = '/gallery/bedroom-plum.jpg';
UPDATE property_images SET room_id = 'a1b2c3d4-0000-0000-0000-000000000014', display_order = 9,
       alt_text = 'Room 4: king bed with a blue feature wall'
 WHERE url = '/gallery/bedroom-blue.jpg';
UPDATE property_images SET room_id = 'a1b2c3d4-0000-0000-0000-000000000015'
 WHERE url = '/gallery/lounge.jpg';
