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

      // Check if therapist profile exists and has a slug
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: therapist } = await supabase
          .from("therapists")
          .select("phone")
          .eq("id", user.id)
          .single();

        // New user (no phone set yet) → onboarding
        if (!therapist?.phone) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // OAuth error — redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
