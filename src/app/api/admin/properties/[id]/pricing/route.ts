import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { base_nightly_rate, weekend_nightly_rate, extra_guest_rate } = body;

    if (!id) return NextResponse.json({ error: 'Property ID required.' }, { status: 400 });

    // Rates must be positive integers in paise
    if (
      base_nightly_rate !== undefined &&
      (!Number.isInteger(base_nightly_rate) || base_nightly_rate <= 0)
    ) {
      return NextResponse.json({ error: 'base_nightly_rate must be a positive integer (paise).' }, { status: 422 });
    }
    if (
      weekend_nightly_rate !== undefined &&
      (!Number.isInteger(weekend_nightly_rate) || weekend_nightly_rate <= 0)
    ) {
      return NextResponse.json({ error: 'weekend_nightly_rate must be a positive integer (paise).' }, { status: 422 });
    }
    if (
      extra_guest_rate !== undefined &&
      (!Number.isInteger(extra_guest_rate) || extra_guest_rate < 0)
    ) {
      return NextResponse.json({ error: 'extra_guest_rate must be a non-negative integer (paise).' }, { status: 422 });
    }

    const update: Record<string, number> = {};
    if (base_nightly_rate !== undefined) update.base_nightly_rate = base_nightly_rate;
    if (weekend_nightly_rate !== undefined) update.weekend_nightly_rate = weekend_nightly_rate;
    if (extra_guest_rate !== undefined) update.extra_guest_rate = extra_guest_rate;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('properties')
      .update(update)
      .eq('id', id)
      .select('id, base_nightly_rate, weekend_nightly_rate, extra_guest_rate')
      .single();

    if (error) {
      console.error('[admin/pricing] update error:', error.message);
      return NextResponse.json({ error: 'Could not update pricing.' }, { status: 503 });
    }

    return NextResponse.json({ updated: true, property: data });
  } catch (err) {
    console.error('[admin/pricing] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
