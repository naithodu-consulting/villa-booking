import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST|GET /api/bookings/../cron/expire-holds
 *
 * Housekeeping: flips lapsed unpaid holds from 'pending' to 'expired'.
 *
 * This is NOT load-bearing for availability — check_availability() already ignores
 * holds past hold_expires_at, so dates free themselves whether or not this ever runs.
 * Its job is to stop 'pending' from accumulating rows that will never be paid, so
 * admin views and reporting mean what they say.
 *
 * Protected by CRON_SECRET. Vercel Cron sends it as `Authorization: Bearer <secret>`.
 */
async function handler(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[cron/expire-holds] CRON_SECRET not set');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('expire_stale_booking_holds');

    if (error) {
      console.error('[cron/expire-holds] RPC failed:', error.message);
      return NextResponse.json({ error: 'Sweep failed' }, { status: 500 });
    }

    const expired = data ?? 0;
    if (expired > 0) console.info(`[cron/expire-holds] Expired ${expired} stale hold(s)`);

    return NextResponse.json({ expired });
  } catch (err) {
    console.error('[cron/expire-holds] Unexpected error:', err);
    return NextResponse.json({ error: 'Sweep failed' }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
