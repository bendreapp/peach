"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useTherapistMe, useClientsList, useUpdateTherapist } from "@/lib/api-hooks";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserPlus,
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
  Clock,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/leads", label: "Leads", icon: UserPlus },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/broadcast", label: "Broadcast", icon: MessageCircle },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/recurring", label: "Recurring", icon: Repeat },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryNavItems = [
  { href: "/dashboard/team", label: "Team", icon: UsersRound },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-[10px] w-full text-[13px] font-medium transition-colors duration-[120ms] ease-out ${
        active
          ? "text-[#5C7A6B] bg-[#EBF0EB]"
          : "text-[#5C5856] hover:text-[#1C1C1E] hover:bg-[#F4F1EC]"
      }`}
      style={{
        height: "36px",
        paddingLeft: "10px",
        paddingRight: "10px",
        borderRadius: "7px",
      }}
    >
      <Icon
        size={16}
        strokeWidth={1.5}
        className={`flex-shrink-0 transition-colors ${
          active ? "text-[#5C7A6B]" : "text-[#8A8480] group-hover:text-[#5C5856]"
        }`}
      />
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const therapist = useTherapistMe();
  const updateTherapist = useUpdateTherapist();
  const [autoSaving, setAutoSaving] = useState(false);

  // Prefetch at layout level
  useClientsList();

  // If phone is missing, check localStorage for pending signup data and auto-save
  useEffect(() => {
    if (therapist.data && !therapist.data.phone && !autoSaving) {
      const pendingSlug = localStorage.getItem("bendre_pending_slug");
      // The signup form stores phone in Supabase auth metadata — retrieve it
      const tryAutoSave = async () => {
        setAutoSaving(true);
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const meta = user?.user_metadata;
          const phone = meta?.phone;
          const slug = pendingSlug || meta?.username;

          if (phone) {
            // We have signup data — save it to therapists table
            const updateData: Record<string, unknown> = { phone };
            if (slug) updateData.slug = slug;
            if (meta?.full_name) updateData.full_name = meta.full_name;

            await updateTherapist.mutateAsync(updateData);

            // Clean up localStorage
            localStorage.removeItem("bendre_pending_slug");
            localStorage.removeItem("bendre_pending_practice");
          } else {
            // No pending data — redirect to onboarding
            router.push("/onboarding");
          }
        } catch {
          // If auto-save fails, redirect to onboarding as fallback
          router.push("/onboarding");
        }
      };
      tryAutoSave();
    }
  }, [therapist.data, router]);

  // Identify user in PostHog once therapist data loads
  useEffect(() => {
    if (therapist.data?.id) {
      posthog.identify(therapist.data.id, {
        name: therapist.data.display_name || therapist.data.full_name,
        email: therapist.data.email,
      });
    }
  }, [therapist.data?.id]);

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

  async function handleLogout() {
    posthog.capture("logout");
    posthog.reset();
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login/therapist";
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div
        className="flex items-center gap-2 px-4 py-4"
        style={{ borderBottom: "1px solid #E8E4DC" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="Bendre"
            width={28}
            height={28}
            className="transition-transform group-hover:scale-105 flex-shrink-0"
          />
          <span
            className="font-bold text-[#1C1C1E]"
            style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
          >
            Bendre
          </span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-2 pt-3"
      >
        <div className="space-y-[2px]">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </div>

        {/* Manage section */}
        <div className="mt-5 mb-2">
          <p
            className="px-2 mb-2 font-semibold uppercase text-[#8A8480]"
            style={{
              fontSize: "10px",
              letterSpacing: "0.08em",
            }}
          >
            Manage
          </p>
          <div className="space-y-[2px]">
            {secondaryNavItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-3 flex flex-col gap-[2px]">
        {/* Settings */}
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith("/settings")}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Divider */}
        <div className="border-t border-[#E8E4DC] my-2 mx-0" />

        {/* User card */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[7px] hover:bg-[#F4F1EC] transition-colors duration-[120ms] cursor-pointer group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="flex-shrink-0 rounded-full ring-1 ring-white shadow-sm"
              style={{ width: "32px", height: "32px" }}
            />
          ) : (
            <div
              className="rounded-full bg-[#8A9A8B] flex items-center justify-center flex-shrink-0 ring-1 ring-white shadow-sm"
              style={{ width: "32px", height: "32px" }}
            >
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-[#1C1C1E] truncate leading-tight"
              style={{ fontSize: "13px" }}
            >
              {displayName || "Loading..."}
            </p>
            <p
              className="text-[#8A8480] truncate leading-tight mt-0.5"
              style={{ fontSize: "11px" }}
            >
              {email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-50 text-[#8A8480] hover:text-red-600"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F4F1EC" }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#5C7A6B] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#FDFCFA] border-b border-[#E8E4DC] h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-[#5C5856] hover:text-[#1C1C1E] transition-colors p-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <Image src="/logo.png" alt="Bendre" width={28} height={28} />
          <span
            className="font-bold text-[#1C1C1E]"
            style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
          >
            Bendre
          </span>
        </Link>
        <div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="rounded-full ring-1 ring-white shadow-sm"
              style={{ width: "32px", height: "32px" }}
            />
          ) : (
            <div
              className="rounded-full bg-[#8A9A8B] flex items-center justify-center ring-1 ring-white shadow-sm"
              style={{ width: "32px", height: "32px" }}
            >
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transform transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          width: "220px",
          backgroundColor: "#FDFCFA",
          borderRight: "1px solid #E8E4DC",
        }}
      >
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-4 right-4 text-[#8A8480] hover:text-[#1C1C1E] transition-colors p-1 rounded-md hover:bg-[#F4F1EC]"
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
        className="flex-1 min-h-screen md:ml-[220px]"
        style={{ backgroundColor: "#F4F1EC" }}
      >
        {/* Plan pending banner */}
        {therapist.data?.plan_status === "pending" && (
          <div
            className="flex items-center justify-center gap-2 w-full"
            style={{
              background: "#FBF0E8",
              color: "#B5733A",
              height: "44px",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: 0,
            }}
          >
            <Clock size={16} strokeWidth={1.5} />
            <span>Plan pending activation — our team will reach out soon</span>
          </div>
        )}

        <div
          className="animate-fade-in pt-20 md:pt-8 px-4 md:px-8 pb-8 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
