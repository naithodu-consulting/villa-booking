UPDATE properties
   SET description = REPLACE(
     description,
     '**Ideal for 8 guests** and comfortably accommodating up to 14,',
     '**Ideal for 8 guests** and **comfortably accommodating up to 14**,'
   )
 WHERE slug = 'villa-19';
