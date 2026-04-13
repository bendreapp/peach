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

  // Refresh auth session
  const { data: { user } } = await supabase.auth.getUser();

  // --- Protected Routes ---
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/onboarding");

  if (isProtected && !user) {
    const loginPath = pathname.startsWith("/portal") ? "/login/client" : "/login/therapist";
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // --- Subdomain Routing ---
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3035";
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

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/portal/:path*",
    "/onboarding",
    "/login/:path*",
    "/signup/:path*",
    "/auth/:path*",
    "/booking/:path*",
    // Public onboard pages (portal claim + legacy onboarding tokens)
    // Listed here so Supabase session cookies are refreshed, but NOT protected.
    "/onboard/:path*",
    "/intake/:path*",
    "/",
  ],
};
