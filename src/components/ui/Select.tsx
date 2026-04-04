"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  name?: string;
  ariaLabel?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  className = "",
  id,
  required = false,
  name,
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[highlightedIndex];
        if (opt && !opt.disabled) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, highlightedIndex, options, onChange]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  // Set highlighted index when opening
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [open]);

  function handleToggle() {
    if (!disabled) setOpen((prev) => !prev);
  }

  function handleSelect(opt: SelectOption) {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  }

  const borderColor = error ? "#C0705A" : open ? "#8FAF8A" : "#E5E0D8";
  const ringColor = open ? "rgba(143,175,138,0.25)" : "transparent";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden native input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`w-full h-11 px-4 pr-10 rounded-[8px] text-sm text-left flex items-center justify-between transition-all duration-150 focus:outline-none cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{
          background: disabled ? "#F4F1EC" : "#FFFFFF",
          border: `1px solid ${borderColor}`,
          boxShadow: open ? `0 0 0 3px ${ringColor}` : "none",
          color: selected ? "#1C1C1E" : "#8A8480",
          fontFamily: "Satoshi",
        }}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-150 pointer-events-none`}
          style={{
            color: "#8A8480",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-[8px] overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            animation: "fadeIn 120ms ease-out",
          }}
        >
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-[280px] overflow-y-auto py-1"
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-[13px]" style={{ color: "#8A8480" }}>
                No options
              </li>
            )}
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 text-[13px] cursor-pointer transition-colors ${
                    opt.disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  style={{
                    background: isHighlighted && !opt.disabled ? "#F4F1EC" : "transparent",
                    color: isSelected ? "#5C7A6B" : "#1C1C1E",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={14}
                      strokeWidth={2}
                      style={{ color: "#5C7A6B", flexShrink: 0, marginLeft: 8 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
