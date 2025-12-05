// src/services/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/public",
  "/complete-profile",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Use getClaims() instead of getUser() for proper JWT validation
  // This validates the JWT signature every time (Supabase recommendation)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If there's an auth error (expired/invalid token), treat as no user
  // This handles refresh_token_not_found and other auth errors gracefully
  const currentUser = error ? null : user;

  // If user is disabled (in Supabase Auth metadata), sign out and block
  // Type-safe check for user metadata disabled flag
  const isUserDisabled =
    currentUser &&
    typeof currentUser.user_metadata === "object" &&
    currentUser.user_metadata !== null &&
    "disabled" in currentUser.user_metadata &&
    currentUser.user_metadata.disabled === true;

  if (isUserDisabled) {
    await supabase.auth.signOut();
    const url = new URL("/login", request.url);
    url.searchParams.set("reason", "disabled");
    return NextResponse.redirect(url);
  }

  // Redirect to login if user not authenticated and trying to access protected route
  if (!currentUser && !isPublicPath(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
