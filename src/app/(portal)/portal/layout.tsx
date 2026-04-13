"use client";

import { useRouter } from "next/navigation";
import { usePortalMe } from "@/lib/api-hooks";
import { createClient } from "@/lib/supabase/client";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Image from "next/image";
import { LogOut } from "lucide-react";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const me = usePortalMe();

  const profile = me.data?.[0] ?? null;
  const displayName = profile?.full_name ?? "";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login/client");
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F4F1EC" }}
    >
      {/* Header */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #E5E0D8",
        }}
      >
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="Bendre"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: "#5C7A6B" }}
            >
              Bendre
            </span>
          </div>

          {/* Client name + sign out */}
          <div className="flex items-center gap-3">
            {displayName && (
              <span
                className="text-sm font-medium hidden sm:block"
                style={{ color: "#5C5856" }}
              >
                {displayName}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
              style={{
                color: "#8A8480",
                border: "1px solid #E5E0D8",
                background: "transparent",
              }}
              title="Sign out"
            >
              <LogOut size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
