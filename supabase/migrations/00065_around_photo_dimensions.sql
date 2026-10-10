-- 00065: real dimensions for the Around Villa 19 photographs.
--
-- The gallery now gives each tile its own photograph's shape, which it reads
-- from width/height. These twelve rows predate those columns and were NULL,
-- so they fell back to 3:2 while most of them are 4:3 and one is portrait.

UPDATE property_images AS i
   SET width = v.w, height = v.h
  FROM (VALUES
         ('/gallery/around-kadri-park.jpg', 1920, 1440),
         ('/gallery/around-kadri.jpg', 1600, 1200),
         ('/gallery/around-kudroli.jpg', 1600, 1200),
         ('/gallery/around-mangaladevi.jpg', 1920, 2880),
         ('/gallery/around-milagres.jpg', 1920, 1370),
         ('/gallery/around-naturals.jpg', 1200, 900),
         ('/gallery/around-pabbas.jpg', 1200, 900),
         ('/gallery/around-panambur.jpg', 1600, 1200),
         ('/gallery/around-pilikula.jpg', 1594, 1440),
         ('/gallery/around-st-aloysius.jpg', 1920, 1280),
         ('/gallery/around-sultan-bathery.jpg', 1600, 1200),
         ('/gallery/around-tannirbavi.jpg', 1920, 1440)
       ) AS v(url, w, h)
 WHERE i.url = v.url;
