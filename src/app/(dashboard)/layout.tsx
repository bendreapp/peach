"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTherapistMe, useClientsList } from "@/lib/api-hooks";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  CreditCard,
  MessageCircle,
  FolderOpen,
  Settings,
  Repeat,
  UsersRound,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/recurring", label: "Recurring", icon: Repeat },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryNavItems = [
  { href: "/dashboard/team", label: "Team", icon: UsersRound },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const therapist = useTherapistMe();

  // Prefetch at layout level
  useClientsList();

  const { theme, setTheme } = useTheme();

  const displayName =
    therapist.data?.display_name || therapist.data?.full_name || "";
  const email = therapist.data?.phone || "Therapist";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // DiceBear avatar URL based on name
  const avatarUrl = displayName
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=8A9A8B&textColor=ffffff&fontSize=40`
    : null;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function renderNavItem(item: (typeof mainNavItems)[0]) {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          active
            ? "bg-sage/10 text-sage-dark"
            : "text-ink-secondary hover:text-ink hover:bg-black/[0.03]"
        }`}
      >
        <Icon
          size={18}
          strokeWidth={active ? 2 : 1.5}
          className={`flex-shrink-0 ${active ? "text-sage" : "text-ink-tertiary group-hover:text-ink-secondary"}`}
        />
        {item.label}
      </Link>
    );
  }

  async function handleLogout() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 pt-5 pb-6">
        <Link href="/dashboard" className="flex items-center group">
          <Image
            src="/logo.png"
            alt="Bendre"
            width={44}
            height={44}
            className="transition-transform group-hover:scale-105"
          />
          <span className="text-[22px] font-sans font-bold text-ink tracking-tight">
            Bendre
          </span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {mainNavItems.map(renderNavItem)}
        </div>

        {/* Secondary section */}
        <div className="mt-6 mb-2">
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-ink-tertiary">
            Manage
          </p>
          <div className="space-y-0.5">
            {secondaryNavItems.map(renderNavItem)}
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div className="px-3 py-2">
        <Link
          href="/settings"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            pathname.startsWith("/settings")
              ? "bg-sage/10 text-sage-dark"
              : "text-ink-secondary hover:text-ink hover:bg-black/[0.03]"
          }`}
        >
          <Settings
            size={18}
            strokeWidth={pathname.startsWith("/settings") ? 2 : 1.5}
            className={pathname.startsWith("/settings") ? "text-sage" : "text-ink-tertiary"}
          />
          Settings
        </Link>
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-ink-secondary hover:text-ink hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all"
        >
          {theme === "dark" ? <Sun size={18} strokeWidth={1.5} className="text-ink-tertiary" /> : <Moon size={18} strokeWidth={1.5} className="text-ink-tertiary" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>

      {/* User card */}
      <div className="border-t border-border mx-3" />
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-[#2A2A2A] shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-sage-200 flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-[#2A2A2A] shadow-sm">
              <span className="text-[11px] font-bold text-sage-dark">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate leading-tight">
              {displayName || "Loading..."}
            </p>
            <p className="text-[11px] text-ink-tertiary truncate leading-tight mt-0.5">
              {email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-error-bg text-ink-tertiary hover:text-error"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-sage focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-border/60 h-14 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-ink-secondary hover:text-ink transition-colors p-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center ml-2">
          <Image src="/logo.png" alt="Bendre" width={36} height={36} className="" />
          <span className="text-lg font-sans font-bold text-ink tracking-tight">Bendre</span>
        </Link>
        <div className="ml-auto">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#2A2A2A] shadow-sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sage-200 flex items-center justify-center ring-2 ring-white dark:ring-[#2A2A2A] shadow-sm">
              <span className="text-[10px] font-bold text-sage-dark">{initials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[252px] bg-surface dark:bg-[#141414] border-r border-border/60 flex flex-col transform transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Mobile close */}
        <button
          className="md:hidden absolute top-4 right-4 text-ink-tertiary hover:text-ink transition-colors p-1 rounded-md hover:bg-black/[0.04]"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        {sidebarContent}
      </aside>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 md:ml-[252px] min-h-screen bg-bg"
      >
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-end h-14 px-8 border-b border-border/40 bg-white/50 dark:bg-[#0B0B0B]/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="text-right mr-1">
              <p className="text-[13px] font-medium text-ink leading-tight">
                {displayName || "Loading..."}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-200 to-sage-100 flex items-center justify-center ring-2 ring-white shadow-sm">
              <span className="text-[10px] font-bold text-sage-dark">{initials}</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:px-10 md:py-8 pt-20 md:pt-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
