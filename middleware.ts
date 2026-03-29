import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Create Supabase client for auth session refresh
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  // Refresh auth session (single call, reused for protected route check)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If auth check fails on a protected route, treat as unauthenticated
  const isAuthenticated = !authError && !!user;

  // --- Subdomain Routing ---
  // In production: vidhya.bendre.app → booking page for "vidhya"
  // In dev: Use ?slug=vidhya query param or localhost subdomains
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const isSubdomain =
    hostname !== appDomain &&
    hostname !== `www.${appDomain}` &&
    !hostname.startsWith("localhost");

  if (isSubdomain) {
    const slug = hostname.split(".")[0];
    if (slug && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/booking/${slug}`;
      return NextResponse.rewrite(url, { headers: response.headers });
    }
  }

  // --- Protected Routes ---
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/onboarding");

  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/portal") ? "/login/client" : "/login/therapist";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
