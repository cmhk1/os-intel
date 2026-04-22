import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Auth is removed — use service role key so all server queries bypass RLS.
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
