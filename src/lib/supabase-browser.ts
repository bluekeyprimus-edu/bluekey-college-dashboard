import { createBrowserClient } from "@supabase/ssr";

// Browser client for the parent login page (email/password sign-in) and the
// logout button. Uses the same public anon key as the rest of the app.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
