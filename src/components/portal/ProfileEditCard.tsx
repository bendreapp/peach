"use client";

import { useState, useEffect } from "react";
import { useUpdatePortalProfile } from "@/lib/api-hooks";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ProfileEditCardProps {
  clientId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export default function ProfileEditCard({
  clientId,
  fullName,
  email,
  phone,
  emergencyContactName,
  emergencyContactPhone,
}: ProfileEditCardProps) {
  const [form, setForm] = useState({
    phone: phone ?? "",
    emergency_contact_name: emergencyContactName ?? "",
    emergency_contact_phone: emergencyContactPhone ?? "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({
      phone: phone ?? "",
      emergency_contact_name: emergencyContactName ?? "",
      emergency_contact_phone: emergencyContactPhone ?? "",
    });
  }, [phone, emergencyContactName, emergencyContactPhone]);

  const updateMutation = useUpdatePortalProfile();

  function handleChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  function handleSave() {
    updateMutation.mutate(
      {
        clientId,
        phone: form.phone || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
      },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success("Profile updated.");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Could not save — try again.");
        },
      }
    );
  }

  return (
    <div
      className="rounded-xl border border-[#E5E0D8] overflow-hidden"
      style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-2 px-5 py-4 border-b border-[#E5E0D8]"
        style={{ background: "#FAFAF8" }}
      >
        <User size={16} strokeWidth={1.5} style={{ color: "#5C7A6B" }} />
        <h3 className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>
          Your profile
        </h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Read-only fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#736E6A" }}>
              Full name
            </label>
            <div
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "#F4F1EC", color: "#5C5856" }}
            >
              {fullName}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#736E6A" }}>
              Email
            </label>
            <div
              className="px-3 py-2 rounded-lg text-sm truncate"
              style={{ background: "#F4F1EC", color: "#5C5856" }}
            >
              {email ?? "—"}
            </div>
          </div>
        </div>

        {/* Editable: phone */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#5C5856" }}>
            Phone number
          </label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              border: "1.5px solid #E5E0D8",
              color: "#1C1C1E",
              background: "white",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#8FAF8A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E0D8]" />

        {/* Emergency contact */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#736E6A" }}>
            Emergency contact
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#5C5856" }}>
                Contact name
              </label>
              <input
                type="text"
                placeholder="Full name"
                value={form.emergency_contact_name}
                onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid #E5E0D8",
                  color: "#1C1C1E",
                  background: "white",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8FAF8A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#5C5856" }}>
                Contact phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.emergency_contact_phone}
                onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid #E5E0D8",
                  color: "#1C1C1E",
                  background: "white",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8FAF8A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={!dirty || updateMutation.isPending}
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-40 active:scale-[0.97]"
            style={{ background: "#5C7A6B" }}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
