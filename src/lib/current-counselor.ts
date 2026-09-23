import { cache } from "react";
import { createSupabaseServerClient } from "./supabase-server";
import { supabase } from "./supabase";

export interface CurrentCounselor {
  id: string;
  isAdmin: boolean;
}

// Looks up the counselor row linked to the currently signed-in Auth user
// (if any). Returns null for a parent session, an unlinked user, or when
// Supabase isn't configured / no one is signed in — in every one of those
// cases callers should treat the request as unrestricted (access is
// controlled elsewhere: middleware for parents, page-level checks for
// admin-only actions).
//
// Memoized per request with React's cache() so multiple data-layer calls
// in the same render (getStudents, getAllTasks, ...) don't each hit the
// DB separately to figure out who's asking.
export const getCurrentCounselor = cache(async (): Promise<CurrentCounselor | null> => {
  const serverClient = await createSupabaseServerClient();
  if (!serverClient || !supabase) return null;

  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return null;

  const role = (user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "counselor") return null;

  const { data } = await supabase
    .from("counselors")
    .select("id, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data ? { id: data.id, isAdmin: data.is_admin } : null;
});

// The counselor_id to restrict student/task queries to, or null when the
// current session should see everything (admin counselor, or not a
// counselor session at all).
export async function getCounselorRestriction(): Promise<string | null> {
  const counselor = await getCurrentCounselor();
  if (!counselor || counselor.isAdmin) return null;
  return counselor.id;
}
