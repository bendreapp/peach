"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countryCodes } from "@/lib/country-codes";

interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  required,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = countryCodes.find((c) => c.code === countryCode) ?? countryCodes[0];

  const filtered = search
    ? countryCodes.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : countryCodes;

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="flex gap-0 relative" ref={dropdownRef}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="h-11 pl-3.5 pr-2 rounded-l-xl text-sm flex items-center gap-1.5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#6B7E6C]/15 flex-shrink-0"
        style={{
          background: "var(--color-auth-input)",
          border: "1px solid var(--color-auth-input-border)",
          borderRight: "none",
          color: "var(--color-auth-input-text)",
        }}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-[13px] font-medium" style={{ color: "var(--color-auth-text)" }}>{selected.code}</span>
        <ChevronDown size={12} className="transition-transform" style={{ color: "var(--color-auth-text-muted)", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>

      {/* Phone input */}
      <input
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ""))}
        required={required}
        placeholder="98765 43210"
        className="flex-1 h-11 px-4 rounded-r-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6B7E6C]/15"
        style={{
          background: "var(--color-auth-input)",
          border: "1px solid var(--color-auth-input-border)",
          color: "var(--color-auth-input-text)",
        }}
      />

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 rounded-xl border overflow-hidden z-50"
          style={{
            background: "var(--color-auth-card)",
            borderColor: "var(--color-auth-card-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            width: 280,
            maxHeight: 320,
          }}
        >
          {/* Search */}
          <div className="p-2.5 border-b" style={{ borderColor: "var(--color-auth-card-border)" }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-auth-text-muted)" }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] focus:outline-none"
                style={{
                  background: "var(--color-auth-input)",
                  border: "1px solid var(--color-auth-input-border)",
                  color: "var(--color-auth-input-text)",
                }}
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 252 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px]" style={{ color: "var(--color-auth-text-muted)" }}>
                No results
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code + c.name}
                  type="button"
                  onClick={() => {
                    onCountryCodeChange(c.code);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors"
                  style={{
                    background: c.code === countryCode ? "rgba(107,126,108,0.06)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (c.code !== countryCode) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = c.code === countryCode ? "rgba(107,126,108,0.06)" : "transparent"; }}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="text-[13px] flex-1" style={{ color: "var(--color-auth-text)" }}>{c.name}</span>
                  <span className="text-[12px] font-mono" style={{ color: "var(--color-auth-text-muted)" }}>{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
