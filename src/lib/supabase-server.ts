import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side (Server Components / Server Actions) client that reads the
// signed-in user's session from cookies. Used only by the parent portal —
// the counselor side has no auth yet and keeps using lib/supabase.ts.
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — cookies can't be set here.
          // The middleware refreshes the session on every request instead.
        }
      },
    },
  });
}
