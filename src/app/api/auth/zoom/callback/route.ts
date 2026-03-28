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
  const output = Buffer.concat([Buffer.from([0x01]), iv, authTag, encrypted]);
  return output.toString("base64");
}

/**
 * GET handler: Zoom OAuth callback.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=zoom_auth", req.url));
  }

  try {
    // 1. Exchange code for tokens
    const redirectUri = process.env.ZOOM_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3035"}/api/auth/zoom/callback`;
    const basicAuth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Zoom token exchange failed:", tokenRes.status, await tokenRes.text());
      return NextResponse.redirect(new URL("/settings?error=zoom_exchange", req.url));
    }

    const tokens = await tokenRes.json();

    // 2. Get Zoom user info to find email
    const userRes = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userRes.json();

    // 3. Encrypt tokens
    const encryptedTokens = {
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    };

    // 4. Store using service role — find therapist by email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users?.find((u: any) => u.email === userInfo.email);

    if (!user) {
      console.error("No Bendre user found for Zoom email:", userInfo.email);
      return NextResponse.redirect(new URL("/settings?error=zoom_user", req.url));
    }

    await supabase
      .from("therapists")
      .update({
        zoom_token: encryptedTokens,
        zoom_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.redirect(new URL("/settings?zoom=connected", req.url));
  } catch (err) {
    console.error("Zoom OAuth error:", err);
    return NextResponse.redirect(new URL("/settings?error=zoom_exchange", req.url));
  }
}

/**
 * POST handler: Zoom deauthorization webhook.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.event !== "app_deauthorized") {
      return NextResponse.json({ status: "ignored" });
    }

    console.warn("Zoom deauthorization received for user:", body.payload?.user_id);

    // Respond with compliance
    if (body.payload?.deauthorization_event_received) {
      await fetch("https://api.zoom.us/oauth/data/compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: JSON.stringify({
          client_id: process.env.ZOOM_CLIENT_ID,
          user_id: body.payload.user_id,
          account_id: body.payload.account_id,
          deauthorization_event_received: body.payload.deauthorization_event_received,
          compliance_completed: true,
        }),
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Zoom webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
