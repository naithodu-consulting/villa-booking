import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, checkIn, checkOut, guestCount, message } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a message (minimum 10 characters).' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (phone && !/^[6-9][0-9]{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid Indian mobile number.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', 'villa-19')
      .single();

    const { error } = await supabase.from('enquiries').insert({
      property_id: property?.id ?? null,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      check_in: checkIn || null,
      check_out: checkOut || null,
      guest_count: guestCount ? Number(guestCount) : null,
      message: message.trim(),
      source: 'contact_form',
    });

    if (error) {
      console.error('[enquiries] insert error:', error.message);
      return NextResponse.json({ error: 'Could not save your enquiry. Please try again.' }, { status: 503 });
    }

    return NextResponse.json({ submitted: true });
  } catch (err) {
    console.error('[enquiries] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
