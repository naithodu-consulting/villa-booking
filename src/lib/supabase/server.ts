import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** Service-role client for server-side data access — NEVER expose to browser */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
