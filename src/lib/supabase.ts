import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During early development the Supabase project may not be wired up yet —
// the app falls back to mock data (see mock-data.ts) whenever this is null,
// so the UI is never blocked on env vars being set.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);
