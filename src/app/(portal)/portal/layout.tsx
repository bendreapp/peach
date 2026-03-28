"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Bendre"
              width={32}
              height={32}
            />
            <span className="text-lg font-sans font-bold text-sage">
              Bendre
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-ink-tertiary hover:text-ink transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
