import { createServiceClient } from '@/lib/supabase/server';
import type { Property, Room, PropertyImage, PricingRule } from '@/types';

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
    // whatsapp_number is not a DB column — pull from env
    whatsapp_number: process.env.PROPERTY_WHATSAPP ?? '919876543210',
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
    .gte('end_date', today) // only future/active rules
    .order('start_date');

  if (error || !data) return [];
  return data as PricingRule[];
}
