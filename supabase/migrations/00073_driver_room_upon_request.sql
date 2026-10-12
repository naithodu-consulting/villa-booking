-- Driver's room is not always available, so the amenity now says so rather than
-- promising it outright. The villa highlight tiles that used to lead with the
-- driver room now lead with air conditioning, which applies to every stay.

UPDATE property_amenities
   SET label = 'Driver''s room with bathroom (Upon Request)'
 WHERE label = 'Dedicated driver''s room with bathroom';
