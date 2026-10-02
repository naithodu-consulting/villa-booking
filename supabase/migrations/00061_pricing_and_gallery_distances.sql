-- 00061: weekday / weekend rates increase and gallery captions without distance.
--
-- Pricing:
-- Weekday rate increased from Rs 12,000 to Rs 14,000 (1400000 paise).
-- Weekend rate increased from Rs 14,000 to Rs 16,000 (1600000 paise).
--
-- Gallery "Around Villa 19" captions:
-- Removed distances (" · X km") from captions and alt text so the labels
-- below the images show clean place names.

UPDATE properties
   SET base_nightly_rate    = 1400000,
       weekend_nightly_rate = 1600000,
       updated_at           = NOW()
 WHERE slug = 'villa-19';

UPDATE property_images AS i
   SET caption  = v.caption,
       alt_text = v.alt_text
  FROM (VALUES
         ('/gallery/around-sultan-bathery.jpg', 'Sultan Bathery Fort',      'Sultan Bathery Fort, Mangaluru'),
         ('/gallery/around-tannirbavi.jpg',     'Tannirbhavi Beach',        'Tannirbhavi Beach, Mangaluru'),
         ('/gallery/around-panambur.jpg',       'Panambur Beach',          'Panambur Beach at sunset'),
         ('/gallery/around-kudroli.jpg',        'Kudroli Temple',           'Kudroli Gokarnanatheshwara Temple, Mangaluru'),
         ('/gallery/around-kadri.jpg',          'Kadri Manjunatha Temple', 'Kadri Manjunatha Temple, Mangaluru'),
         ('/gallery/around-pilikula.jpg',       'Pilikula Park',           'Pilikula Nature Park and Zoo'),
         ('/gallery/around-pabbas.jpg',         'Pabbas',                  'Gudbad ice cream at Pabbas'),
         ('/gallery/around-naturals.jpg',       'Naturals',                'Naturals Sundaes ice cream')
       ) AS v(url, caption, alt_text)
 WHERE i.url = v.url
   AND i.property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
