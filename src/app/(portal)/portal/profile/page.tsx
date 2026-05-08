"use client";

import { usePortalMe } from "@/lib/api-hooks";
import ProfileEditCard from "@/components/portal/ProfileEditCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PortalProfilePage() {
  const me = usePortalMe();
  const profile = me.data?.[0] ?? null;

  if (me.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-[#E5E0D8] rounded w-32 animate-pulse" />
        <div className="h-64 bg-[#E5E0D8] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-8 text-center">
        <p className="text-sm" style={{ color: "#736E6A" }}>
          Unable to load your profile. Please try signing in again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "#5C7A6B" }}
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}>
          Your profile
        </h1>
        <p className="text-sm mt-1" style={{ color: "#736E6A" }}>
          Keep your contact and emergency details up to date.
        </p>
      </div>

      <ProfileEditCard
        clientId={profile.id}
        fullName={profile.full_name}
        email={profile.email}
        phone={profile.phone}
        emergencyContactName={profile.emergency_contact_name ?? null}
        emergencyContactPhone={profile.emergency_contact_phone ?? null}
      />
    </div>
  );
}
