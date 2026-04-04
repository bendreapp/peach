"use client";

import { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  onComplete?: (value: string) => void;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  disabled = false,
  error = false,
  onComplete,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittedValueRef = useRef<string>("");

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  // Notify when complete — only once per unique value
  useEffect(() => {
    if (value.length === length && onComplete && submittedValueRef.current !== value) {
      submittedValueRef.current = value;
      onComplete(value);
    }
    // Reset guard when value changes (user edits)
    if (value.length < length) {
      submittedValueRef.current = "";
    }
  }, [value, length, onComplete]);

  const handleChange = (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    if (!input) return;

    const newValue = value.split("");
    // Support pasting multiple digits into one box
    for (let i = 0; i < input.length && idx + i < length; i++) {
      newValue[idx + i] = input[i];
    }
    const joined = newValue.join("").slice(0, length);
    onChange(joined);

    // Move focus forward
    const nextIdx = Math.min(idx + input.length, length - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[idx]) {
        // Delete current digit
        const newValue = value.split("");
        newValue[idx] = "";
        onChange(newValue.join(""));
      } else if (idx > 0) {
        // Move back and delete
        const newValue = value.split("");
        newValue[idx - 1] = "";
        onChange(newValue.join(""));
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted.padEnd(length, "").slice(0, length).replace(/\s/g, ""));
      const focusIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={length}
          value={value[idx] ?? ""}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className="w-9 h-11 text-center text-[16px] font-semibold rounded-[8px] transition-all focus:outline-none"
          style={{
            background: "#FFFFFF",
            border: `1.5px solid ${error ? "#C0705A" : value[idx] ? "#8FAF8A" : "#E5E0D8"}`,
            color: "#1C1C1E",
            fontFamily: "Satoshi",
            boxShadow: "none",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = error ? "#C0705A" : "#5C7A6B";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(92,122,107,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "#C0705A" : value[idx] ? "#8FAF8A" : "#E5E0D8";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}
