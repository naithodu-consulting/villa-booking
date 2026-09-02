import { createServiceClient } from '@/lib/supabase/server';
import AdminDashboard, { type AdminBooking } from '@/components/admin/AdminDashboard';
import type { Property } from '@/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // Fetch property
  const { data: propertyData, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', 'villa-19')
    .single();

  if (propError || !propertyData) notFound();

  const property: Property = {
    ...propertyData,
    whatsapp_number: process.env.PROPERTY_WHATSAPP ?? '919876543210',
    check_in_time: propertyData.check_in_time?.slice(0, 5) ?? '14:00',
    check_out_time: propertyData.check_out_time?.slice(0, 5) ?? '11:00',
  };

  // Fetch bookings — last 90 days through next 180 days
  const from = new Date();
  from.setDate(from.getDate() - 90);
  const to = new Date();
  to.setDate(to.getDate() + 180);

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('id, reference_number, guest_name, guest_phone, check_in, check_out, status, payment_status, total_amount, num_adults, num_children, booking_channel')
    .eq('property_id', property.id)
    .gte('check_in', from.toISOString().slice(0, 10))
    .lte('check_in', to.toISOString().slice(0, 10))
    .order('check_in', { ascending: false });

  const bookings: AdminBooking[] = (bookingsData ?? []) as AdminBooking[];

  return <AdminDashboard property={property} bookings={bookings} />;
}
