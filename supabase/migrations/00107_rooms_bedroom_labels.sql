-- 00107: name the four bedrooms "Bedroom N" instead of "Room N".
--
-- The rooms page renders rooms.name as the card heading, under a "BEDROOM"
-- room_type label, so each card read "BEDROOM / Room 1". The operator uses
-- "Bedroom 1" when talking to guests, so the site should too.
--
-- Only the display name changes. The slugs stay room-1..room-4 because they
-- are the stable handles used elsewhere; renaming them would break any link
-- already shared. Gallery captions still read "Room 1 · King bed" (00063,
-- 00064) and are left for a separate pass.

UPDATE rooms
   SET name = 'Bedroom ' || substring(slug from 'room-([0-9]+)$')
 WHERE slug ~ '^room-[0-9]+$'
   AND name ~ '^Room [0-9]+$';
