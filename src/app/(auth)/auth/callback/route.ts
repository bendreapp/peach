import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Validate redirect target to prevent open redirect
  const isValidRedirect = (path: string | null): path is string =>
    !!path && path.startsWith("/") && !path.includes("//") && !path.includes(":");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If an explicit redirect was given, use it
      if (isValidRedirect(next)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise, check user role to decide redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleRow?.role === "client") {
          return NextResponse.redirect(`${origin}/portal`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // OAuth error — redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
