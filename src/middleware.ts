import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Guards the whole app now (counselor pages included), except /login.
// Role comes from user_metadata.role set at account-creation time
// (createParentAccount / createCounselorAccount in lib/actions.ts) — no
// extra DB round trip needed on every request.
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const role = (user?.user_metadata as { role?: string } | undefined)?.role;

  if (!user) {
    if (isLoginRoute) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in and hitting /login — bounce to the right home.
  if (isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = role === "counselor" ? "/" : "/parent";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Parents can only see /parent/**; counselors can't wander into it either
  // (keeps the two surfaces cleanly separated).
  const isParentArea = pathname.startsWith("/parent");
  if (role === "parent" && !isParentArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/parent";
    return NextResponse.redirect(url);
  }
  if (role !== "parent" && isParentArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and the public/ files the PWA and
    // browser need to load unauthenticated (manifest, icons, service
    // worker, favicon).
    "/((?!_next/static|_next/image|favicon-32\\.png|icon-192\\.png|icon-512\\.png|logo\\.png|apple-touch-icon\\.png|manifest\\.json|sw\\.js).*)",
  ],
};
