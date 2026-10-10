-- 00068: the Around Villa 19 photographs cropped to 3:2, like the rest.
--
-- The gallery tile is 3:2 now (00067). These eleven were 4:3 and thereabouts,
-- so the tile was cropping one of them by 36% with no say in where. Each is
-- now cropped to 3:2 with the crop chosen by hand: the Kudroli gopuram and the
-- Milagres cross keep their tops, Pilikula keeps its gate and its sign, and
-- St Aloysius was already 3:2 and is untouched but for its size.

UPDATE property_images AS i
   SET width = v.w, height = v.h
  FROM (VALUES
         ('/gallery/around-kadri-park.jpg', 1600, 1067),
         ('/gallery/around-kadri.jpg', 1600, 1066),
         ('/gallery/around-kudroli.jpg', 1600, 1066),
         ('/gallery/around-milagres.jpg', 1600, 1067),
         ('/gallery/around-naturals.jpg', 1200, 800),
         ('/gallery/around-pabbas.jpg', 1200, 800),
         ('/gallery/around-panambur.jpg', 1600, 1066),
         ('/gallery/around-pilikula.jpg', 1594, 1062),
         ('/gallery/around-st-aloysius.jpg', 1600, 1067),
         ('/gallery/around-sultan-bathery.jpg', 1600, 1066),
         ('/gallery/around-tannirbavi.jpg', 1600, 1067)
       ) AS v(url, w, h)
 WHERE i.url = v.url;
