import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function encrypt(plaintext: string): string {
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, "base64");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Wire format: [version(1)] [iv(12)] [authTag(16)] [ciphertext]
  const output = Buffer.concat([Buffer.from([0x01]), iv, authTag, encrypted]);
  return output.toString("base64");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=google_auth", req.url));
  }

  // Validate OAuth state parameter against stored cookie to prevent CSRF
  const cookieHeader = req.headers.get("cookie") ?? "";
  const storedState = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/settings?error=google_auth&reason=state_mismatch", req.url));
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3035"}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", tokenRes.status, await tokenRes.text());
      return NextResponse.redirect(new URL("/settings?error=google_exchange", req.url));
    }

    const tokens = await tokenRes.json();

    // 2. Get user info to find which therapist this is
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // 3. Encrypt tokens
    const encryptedTokens = {
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    };

    // 4. Store using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find therapist by email
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id")
      .eq("id", (await supabase.auth.admin.listUsers()).data.users?.find((u: any) => u.email === userInfo.email)?.id)
      .single();

    if (!therapist) {
      // Fallback: try to find by the state param or just use the Google email
      // For now, find any therapist linked to this email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users?.find((u: any) => u.email === userInfo.email);

      if (!user) {
        return NextResponse.redirect(new URL("/settings?error=google_user", req.url));
      }

      await supabase
        .from("therapists")
        .update({
          google_calendar_token: encryptedTokens,
          google_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } else {
      await supabase
        .from("therapists")
        .update({
          google_calendar_token: encryptedTokens,
          google_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", therapist.id);
    }

    const successResponse = NextResponse.redirect(new URL("/settings?google=connected", req.url));
    // Clear the OAuth state cookie
    successResponse.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
    return successResponse;
  } catch (err) {
    console.error("Google Calendar OAuth error:", err);
    const errorResponse = NextResponse.redirect(new URL("/settings?error=google_exchange", req.url));
    errorResponse.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
    return errorResponse;
  }
}
