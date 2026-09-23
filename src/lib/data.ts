import { createServiceClient } from '@/lib/supabase/server';
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
    check_in_time: data.check_in_time?.slice(0, 5) ?? '14:00',
    check_out_time: data.check_out_time?.slice(0, 5) ?? '11:00',
  } as Property;
}

export async function getRooms(propertyId: string): Promise<Room[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', propertyId)
    .order('display_order');

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

export async function getPricingRules(propertyId: string): Promise<PricingRule[]> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
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

export function formatDistance(place: NearbyPlace | undefined): string | undefined {
  if (!place?.distance_km) return undefined;
  const km = `${Number(place.distance_km)} km`;
  return place.travel_minutes ? `${km} · ~${place.travel_minutes} min` : km;
}
