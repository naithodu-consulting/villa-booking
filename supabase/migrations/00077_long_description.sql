-- Separate the home-page pitch (description) from the fuller editorial
-- copy on The Villa page (long_description).

ALTER TABLE properties ADD COLUMN IF NOT EXISTS long_description text;

-- Restore the original home-page description.
UPDATE properties
   SET description = '**Villa 19 by Habbaa** is a spacious **4-bedroom private urban villa** set amidst lush greenery in Urwa, Mangalore. Spread across **5,000 sq. ft.**, it offers generous living spaces, a manicured lawn, balconies across every floor, and ample private parking.

Tucked away in a peaceful setting yet close to the heart of the city, the villa is just minutes from the main road, local markets, shops, and everyday conveniences. Its location makes it easy to explore Mangalore while giving you a quiet space to return to at the end of the day.

Designed with a relaxed, contemporary character, Villa 19 brings together the comforts of a well-appointed home with the space and privacy of a private getaway. The spacious lounge is made for conversations, family time and unwinding together, while the bedrooms offer a comfortable retreat after a day out in the city.

**Ideal for 8 guests** and comfortably **accommodating up to 14**, Villa 19 is designed for families and groups to come together, slow down, and enjoy their own private space in Mangalore. For larger groups, the spacious lounge can also be used as additional sleeping space with its convertible sofas.

Whether it is a family gathering, a weekend with friends, a milestone celebration, or simply a few days away together, Villa 19 offers the space, privacy and convenience to make the stay feel like your own.'
 WHERE slug = 'villa-19';

-- Set the extended editorial copy for The Villa page.
UPDATE properties
   SET long_description = '**A private space to stay together**

Villa 19 is designed around a simple idea - **when you travel together, you shouldn''t have to stay apart.**

**The entire villa is yours for the duration of your stay** - a place to slow down, settle in and enjoy time together, without the schedules and shared spaces of a hotel.

With four comfortable air-conditioned bedrooms, generous living and dining spaces, a fully equipped kitchen and plenty of room to relax, Villa 19 brings together the comfort of a well-appointed home with the privacy of an entire villa.

The shared spaces are made for easy, unhurried moments - enjoy a meal together, pick up a book, challenge each other to a board game, or simply unwind after a day exploring Mangalore. There''s room for everyone to find their own corner, while still coming together when it matters.

A landscaped lawn, balconies across the floors and ample private parking add to the sense of space, making Villa 19 feel less like a place to simply stay and more like a home that''s yours for a while.

**Your space. Your people. Your stay.**'
 WHERE slug = 'villa-19';
