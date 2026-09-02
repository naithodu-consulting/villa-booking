import { Property, Room, PropertyImage, AmenityGroup } from '@/types';

// All monetary values in PAISE (₹1 = 100 paise) — never use floats for money
export const MOCK_MANGALORE_VILLA: Property = {
  id: 'v101-mangalore-coastal',
  slug: 'villa-19',
  name: 'Villa 19',
  tagline: 'Premium 4-Bedroom Private Villa in Urwa, Mangalore',
  description: 'a premium 4-bedroom private villa nestled in lush green surroundings in Urwa, Mangalore. Spread across a spacious property with a manicured lawn, private balconies on every floor, and ample covered parking, this villa comfortably hosts up to 12 guests. The beach is just 1.5 km away. Main road, local market and shops are within easy reach. Perfect for family reunions, group getaways and milestone celebrations.',
  address: 'Urwa',
  city: 'Mangalore',
  state: 'Karnataka',
  pincode: '575006',
  geo_lat: 12.8634,
  geo_lng: 74.8422,
  base_occupancy: 8,
  max_occupancy: 12,
  extra_guest_rate: 75_000,         // ₹750 in paise
  base_nightly_rate: 1_200_000,     // ₹12,000 in paise
  weekend_nightly_rate: 1_400_000,  // ₹14,000 in paise
  check_in_time: '14:00',
  check_out_time: '11:00',
  is_active: true,
  whatsapp_number: process.env.PROPERTY_WHATSAPP ?? '919876543210',
};

export const MOCK_ROOMS: Room[] = [
  {
    id: 'r1',
    property_id: MOCK_MANGALORE_VILLA.id,
    name: 'Garden View Master Suite',
    room_type: 'Master Suite',
    bed_type: 'King Size Bed',
    bed_count: 1,
    max_guests: 3,
    has_ensuite_bathroom: true,
    display_order: 1
  },
  {
    id: 'r2',
    property_id: MOCK_MANGALORE_VILLA.id,
    name: 'Lawn View Bedroom',
    room_type: 'Luxury Bedroom',
    bed_type: 'Queen Size Bed',
    bed_count: 1,
    max_guests: 2,
    has_ensuite_bathroom: true,
    display_order: 2
  },
  {
    id: 'r3',
    property_id: MOCK_MANGALORE_VILLA.id,
    name: 'Sunset Balcony Suite',
    room_type: 'Balcony Suite',
    bed_type: 'King Size Bed',
    bed_count: 1,
    max_guests: 3,
    has_ensuite_bathroom: true,
    display_order: 3
  },
  {
    id: 'r4',
    property_id: MOCK_MANGALORE_VILLA.id,
    name: 'Heritage Courtyard Room',
    room_type: 'Standard Room',
    bed_type: 'Twin Double Beds',
    bed_count: 2,
    max_guests: 4,
    has_ensuite_bathroom: true,
    display_order: 4
  }
];

export const MOCK_IMAGES: PropertyImage[] = [
  {
    id: 'img-hero',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80',
    alt_text: 'Villa 19 - Main Exterior with Tropical Garden',
    category: 'hero',
    display_order: 1,
  },
  {
    id: 'img-living-1',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Bright Living Room with Natural Light',
    category: 'living',
    display_order: 2,
  },
  {
    id: 'img-bedroom-1',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Garden View Master Suite - King Bed',
    category: 'bedroom',
    display_order: 3,
  },
  {
    id: 'img-bedroom-2',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Lawn View Bedroom - Queen Bed & Ensuite',
    category: 'bedroom',
    display_order: 4,
  },
  {
    id: 'img-dining-1',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Dining - Fresh Coastal Cuisine',
    category: 'dining',
    display_order: 5,
  },
  {
    id: 'img-bedroom-3',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Sunset Balcony Suite - King Bed',
    category: 'bedroom',
    display_order: 6,
  },
  {
    id: 'img-living-2',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Living Room - Evening Ambience',
    category: 'living',
    display_order: 7,
  },
  {
    id: 'img-bedroom-4',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Heritage Courtyard Room - Twin Beds',
    category: 'bedroom',
    display_order: 8,
  },
  {
    id: 'img-exterior-1',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Villa Exterior - Garden & Green Surroundings',
    category: 'exterior',
    display_order: 9,
  },
  {
    id: 'img-living-3',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Open Living Area - Warm Evening Light',
    category: 'living',
    display_order: 10,
  },
  {
    id: 'img-dining-2',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Outdoor Dining - BBQ and Bonfire Evenings',
    category: 'dining',
    display_order: 11,
  },
  {
    id: 'img-exterior-2',
    property_id: MOCK_MANGALORE_VILLA.id,
    url: 'https://images.unsplash.com/photo-1475855581690-80accde3ae2b?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Villa Balcony - Lush Green Views',
    category: 'exterior',
    display_order: 12,
  },
];

export const MOCK_AMENITIES: AmenityGroup[] = [
  { category: 'Comfort & Leisure', items: ['Air Conditioning in All Rooms', 'High-Speed WiFi', '55" Smart TV with OTT', 'Private Balconies'] },
  { category: 'Kitchen & Dining', items: ['Fully Equipped Kitchen', 'BBQ Grill & Bonfire Kit', 'Outdoor Dining Area', 'Dining for up to 12 Guests'] },
  { category: 'Outdoor & Location', items: ['Spacious Private Lawn', 'Ample Covered Parking (4+ Cars)', 'Lush Green Surroundings', 'Beach 1.5 km Away', 'Near Main Road, Market & Shops'] },
  { category: 'Safety & Hygiene', items: ['24/7 On-Site Caretaker', 'CCTV Security', '100% Power Backup Generator'] }
];
