import { createClient } from "@supabase/supabase-js";

// Service-role client — full admin access, bypasses auth. Server-only:
// never import this file from a "use client" component. Used exclusively
// to create parent Auth accounts from the counselor's student profile page
// (supabase.auth.admin.* requires the service role key; the public anon
// key cannot create confirmed users).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

export const isAdminConfigured = Boolean(supabaseAdmin);
