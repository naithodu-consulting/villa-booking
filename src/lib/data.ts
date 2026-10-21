import { createServiceClient } from '@/lib/supabase/server';
import { todayISO } from '@/lib/format';
import type { Property, Room, PropertyImage, PricingRule, PropertyAmenity, FAQ, PropertyPolicy, NearbyPlace } from '@/types';

const PROPERTY_SLUG = 'villa-19';

export async function getProperty(): Promise<Property | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', PROPERTY_SLUG)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    // whatsapp_number is not a DB column — pull from env. No placeholder
    // fallback: a working link to a stranger's number is worse than no button,
    // and a fake default hides a missing setting until a guest messages it.
    whatsapp_number: process.env.PROPERTY_WHATSAPP || undefined,
    // Normalize time format (DB stores HH:MM:SS, UI uses HH:MM)
    check_in_time: data.check_in_time?.slice(0, 5) ?? '15:00',
    check_out_time: data.check_out_time?.slice(0, 5) ?? '10:00',
  } as Property;
}

export async function getRooms(propertyId: string): Promise<Room[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', propertyId)
    // Then by name: display_order was identical across all four bedrooms until
    // 00090, and `ORDER BY` on a tie has no defined result, so the Rooms page
    // showed Room 4 before Room 3. A tie must not be left to chance.
    .order('display_order')
    .order('name');

  if (error || !data) return [];
  return data as Room[];
}

export async function getImages(propertyId: string): Promise<PropertyImage[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('display_order');

  if (error || !data) return [];
  return data as PropertyImage[];
}

/**
 * The moment a server render read its rates, for comparing against the age of
 * the calendar endpoint's cached response so the newer of the two wins.
 *
 * It belongs here beside the queries it describes rather than being read in a
 * component: it is a property of the data, not of the render. On a cached page
 * it is the age of that cached copy, which is exactly what the comparison needs.
 */
export function ratesReadAt(): number {
  return Date.now();
}

export async function getPricingRules(propertyId: string): Promise<PricingRule[]> {
  const supabase = createServiceClient();
  // The date at the property, not UTC: toISOString() returns yesterday in
  // India between 00:00 and 05:30 IST, which would drop a rule starting today.
  const today = todayISO();
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('property_id', propertyId)
    .gte('end_date', today)
    .order('start_date');

  if (error || !data) return [];
  return data as PricingRule[];
}

export async function getAmenities(propertyId: string): Promise<PropertyAmenity[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('property_amenities')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_available', true)
    .order('display_order');

  if (error || !data) return [];
  return data as PropertyAmenity[];
}

export async function getFAQs(propertyId: string): Promise<FAQ[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_published', true)
    .order('display_order');

  if (error || !data) return [];
  return data as FAQ[];
}

export async function getPolicies(propertyId: string, category?: string): Promise<PropertyPolicy[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from('property_policies')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_published', true)
    .order('display_order');

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as PropertyPolicy[];
}

export async function getNearbyPlaces(propertyId: string, category?: string): Promise<NearbyPlace[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from('nearby_places')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_published', true)
    .order('display_order');

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as NearbyPlace[];
}

/**
 * The closest published place in a category. Headline facts such as "nearest
 * beach" come from here so the homepage, The Villa and structured data can
 * never disagree with the nearby-places list Ooruda Villa maintains.
 */
export function nearestPlace(places: NearbyPlace[], category: string): NearbyPlace | undefined {
  return places
    .filter((p) => p.category === category && p.distance_km != null)
    .sort((a, b) => Number(a.distance_km) - Number(b.distance_km))[0];
}

/**
 * The closest few places, one per category, for the homepage Location card.
 *
 * That card has room for four. It used to name them by regex ("main road",
 * "airport", "beach"), which put the airport at 22 minutes and a beach at 15
 * beside a bus stand 100 m away - the two entries that undersell the location
 * sitting next to the two that sell it. Nearest-first alone is no better: the
 * four closest here are a bus stand and three shops.
 *
 * So: sort by travel time, then distance, and take the first place in each
 * category. That yields a varied, genuinely-close set, and it re-sorts itself
 * as Ooruda Villa edits the list rather than needing a code change.
 */
export function closestByCategory(places: NearbyPlace[], limit = 4): NearbyPlace[] {
  const seen = new Set<string>();
  return places
    .filter((p) => p.distance_km != null)
    .sort(
      (a, b) =>
        (a.travel_minutes ?? Infinity) - (b.travel_minutes ?? Infinity) ||
        Number(a.distance_km) - Number(b.distance_km),
    )
    .filter((p) => !seen.has(p.category) && seen.add(p.category))
    .slice(0, limit);
}

export function formatDistance(place: NearbyPlace | undefined): string | undefined {
  if (!place?.distance_km) return undefined;
  // Under a kilometre reads as metres: "0.1 km" for the bus stand at the end of
  // the road undersells how close it is, and reads as a rounding artefact.
  const value = Number(place.distance_km);
  const km = value < 1 ? `${Math.round(value * 1000)} m` : `${value} km`;
  return place.travel_minutes ? `${km} · ~${place.travel_minutes} min` : km;
}
