-- 00067: the gallery is landscape only, per the operator 2026-10-10.
--
-- Every tile is now the same landscape shape, filled edge to edge, with no
-- border above or below the photograph. The fifteen vertical photographs are
-- removed rather than cropped: a 3:2 crop of a vertical bathroom frame cuts
-- the mirror or the toilet in half, which is worse than not showing it.
--
-- The cost, accepted by the operator with the list in front of them: the
-- Bathrooms section goes entirely, because all five bathroom frames in the
-- shoot are vertical, and so do both views of the living hall, the Villa 19
-- sign, the nameboard, the Buddha corner, the driver room, the check-in desk,
-- the table setting and the tea tray. 44 photographs become 29.
--
-- None of these subjects can be replaced from the shoot: of its 45 landscape
-- frames, not one is of a bathroom, the living hall, the signage, the driver
-- room or the desk. They need landscape frames at the next shoot:
--
--   * the three bathrooms            * the Villa 19 sign and nameboard
--   * the living hall (both ends)    * the Buddha corner
--   * the driver room                * the check-in desk
--
-- The Mangaladevi Temple photograph in Around Villa 19 is vertical too and
-- goes for the same reason.

DELETE FROM property_images
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND height > width;
