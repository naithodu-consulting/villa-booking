export interface Property {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  geo_lat: number;
  geo_lng: number;
  base_occupancy: number;
  max_occupancy: number;
  /** All monetary fields are stored in PAISE (integer). ₹1 = 100 paise. */
  extra_guest_rate: number;
  base_nightly_rate: number;
  weekend_nightly_rate: number;
  check_in_time: string;
  check_out_time: string;
  is_active: boolean;
  bedroom_count?: number;
  bathroom_count?: number;
  whatsapp_number?: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  room_type: string;
  bed_type: string;
  bed_count: number;
  max_guests: number;
  has_ensuite_bathroom: boolean;
  display_order: number;
  /** Null for shared spaces that do not sit on one floor, e.g. the lounge. */
  floor?: string | null;
  size_sqft?: number | null;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  room_id?: string;
  url: string;
  alt_text: string;
  category: 'hero' | 'exterior' | 'bedroom' | 'dining' | 'living' | 'bathroom' | 'kitchen' | 'outdoor' | 'surroundings';
  display_order: number;
}

export interface PricingRule {
  id: string;
  property_id: string;
  rule_name: string;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  min_stay_nights: number;
}

export interface BlockedDate {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: 'maintenance' | 'owner_hold' | 'offline_booking';
  notes?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  reference_number: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  num_adults: number;
  num_children: number;
  num_infants: number;
  check_in: string;
  check_out: string;
  num_nights: number;
  base_amount: number;
  extra_guest_amount: number;
  tax_amount: number;
  total_amount: number;
  deposit_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests?: string;
  created_at: string;
}

export interface AmenityGroup {
  category: string;
  items: string[];
}

export interface PropertyAmenity {
  id: string;
  property_id: string;
  category: string;
  label: string;
  icon?: string;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface FAQ {
  id: string;
  property_id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
}

export interface PropertyPolicy {
  id: string;
  property_id: string;
  key: string;
  title: string;
  body: string;
  category: string;
  display_order: number;
  is_published: boolean;
}

export interface NearbyPlace {
  id: string;
  property_id: string;
  name: string;
  category: string;
  distance_km?: number;
  travel_minutes?: number;
  note?: string;
  display_order: number;
  is_published: boolean;
}

/** All amounts in this breakdown are in PAISE (integer). Divide by 100 to display rupees. */
export interface PricingBreakdown {
  num_nights: number;
  base_amount: number;
  extra_guests_count: number;
  extra_guest_amount: number;
  subtotal: number;
  tax_amount: number; // 18% GST in paise
  total_amount: number;
  nightly_details: {
    date: string;
    rate: number; // paise
    is_weekend: boolean;
    rule_applied?: string;
  }[];
}
