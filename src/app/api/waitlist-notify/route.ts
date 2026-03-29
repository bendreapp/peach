import { NextRequest, NextResponse } from "next/server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const safeEmail = escapeHtml(email);
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      return NextResponse.json({ error: "Email service unavailable" }, { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bendre <noreply@notification.bendre.app>",
        to: ["bendrehq@gmail.com"],
        subject: `Waitlist: ${safeEmail}`,
        html: `<p>New waitlist signup: <strong>${safeEmail}</strong></p><p>Time: ${new Date().toISOString()}</p>`,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ ok: true });
    } else {
      const body = await res.text();
      console.error("Resend error:", body);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
  } catch (e) {
    console.error("Waitlist notify error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
