"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Profile {
  id: string;
  full_name: string;
  therapist_name?: string;
  practice_name?: string;
  therapist_avatar?: string | null;
}

interface TherapistSwitcherProps {
  profiles: Profile[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

// Deterministic color from name
function avatarColor(name?: string): string {
  if (!name) return "#5C7A6B";
  const colors = ["#5C7A6B", "#7B8FA0", "#8A7B6B", "#7B6B8A", "#6B8A7B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function TherapistSwitcher({ profiles, selectedIndex, onChange }: TherapistSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const selected = profiles[selectedIndex];
  const therapistName = selected?.therapist_name ?? "Your therapist";
  const practiceName = selected?.practice_name;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
        style={{
          background: "white",
          border: "1.5px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ background: avatarColor(therapistName) }}
        >
          {getInitials(therapistName)}
        </div>

        <div className="text-left min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: "#1C1C1E" }}>
            {therapistName}
          </p>
          {practiceName && (
            <p className="text-xs leading-tight truncate" style={{ color: "#736E6A" }}>
              {practiceName}
            </p>
          )}
        </div>

        <ChevronDown
          size={14}
          strokeWidth={1.5}
          style={{
            color: "#736E6A",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
            marginLeft: 2,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-64 rounded-xl py-1 z-40"
          style={{
            background: "white",
            border: "1px solid #E5E0D8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          }}
          role="listbox"
        >
          {profiles.map((profile, idx) => {
            const tName = profile.therapist_name ?? "Therapist";
            const pName = profile.practice_name;
            const isActive = idx === selectedIndex;

            return (
              <button
                key={profile.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(idx);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                style={{
                  background: isActive ? "#EBF0EB" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#F4F1EC";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ background: avatarColor(tName) }}
                >
                  {getInitials(tName)}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: isActive ? "#5C7A6B" : "#1C1C1E" }}
                  >
                    {tName}
                  </p>
                  {pName && (
                    <p className="text-xs truncate" style={{ color: "#736E6A" }}>
                      {pName}
                    </p>
                  )}
                </div>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#5C7A6B" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
