"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Check, ArrowRight, ImagePlus } from "lucide-react";
import { Avatar, AVATAR_KEYS, type AvatarKey } from "@/components/ui/Avatars";
import { useCompleteOnboarding } from "@/lib/api-hooks";

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-300"
          style={{
            height: "3px",
            background: i < current ? "#5C7A6B" : i === current ? "#8FAF8A" : "#E5E0D8",
          }}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = Profile, 1 = Support

  // Step 1: Profile
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey | null>(null);
  const [bio, setBio] = useState("");
  const [bioError, setBioError] = useState<string | null>(null);

  // Step 2: Support
  const [supportRequested, setSupportRequested] = useState(false);

  const completeOnboarding = useCompleteOnboarding();

  // ── Step 1 submit ──
  function handleProfileContinue(e: React.FormEvent) {
    e.preventDefault();
    setBioError(null);

    if (!bio.trim()) {
      setBioError("Please write a short bio for clients to read.");
      return;
    }
    if (!selectedAvatar) {
      toast.error("Please pick an avatar to continue.");
      return;
    }

    setStep(1);
  }

  // ── Step 2 submit ──
  function submitOnboarding(withSupport: boolean) {
    if (!selectedAvatar) return;

    completeOnboarding.mutate(
      {
        avatar_key: selectedAvatar,
        bio: bio.trim(),
        support_requested: withSupport,
      },
      {
        onSuccess: () => {
          toast.success("Welcome to Bendre! 🌿");
          router.push("/dashboard");
        },
        onError: (err) => {
          toast.error(err.message || "Something went wrong. Please try again.");
        },
      }
    );
  }

  function handleFinish() {
    submitOnboarding(supportRequested);
  }

  function handleSkip() {
    submitOnboarding(false);
  }

  // ── Shared styles ──
  const cardBg: React.CSSProperties = {
    background: "var(--color-auth-card)",
    borderColor: "var(--color-auth-card-border)",
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--color-auth-bg)" }}
    >
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image src="/logo.png" alt="Bendre" width={38} height={36} style={{ width: "auto", height: "auto" }} />
          <span
            className="text-[24px] font-bold tracking-tight"
            style={{ color: "var(--color-auth-text)" }}
          >
            Bendre
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={cardBg}>
          {/* Step indicator */}
          <StepBar current={step} total={2} />

          {/* ── Step 0: Profile ── */}
          {step === 0 && (
            <form onSubmit={handleProfileContinue}>
              <div className="mb-6 text-center">
                <h1
                  className="text-xl font-bold"
                  style={{ color: "var(--color-auth-text)" }}
                >
                  Set up your profile
                </h1>
                <p
                  className="mt-1 text-[13px]"
                  style={{ color: "var(--color-auth-text-secondary)" }}
                >
                  This is what clients will see on your booking page
                </p>
              </div>

              {/* Avatar picker */}
              <div className="mb-6">
                {/* Upload placeholder */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    type="button"
                    disabled
                    title="Photo upload coming soon"
                    className="flex items-center gap-1.5 text-[12px] font-medium rounded-lg px-3 py-1.5 transition-colors cursor-not-allowed"
                    style={{
                      background: "var(--color-auth-input)",
                      border: "1px solid var(--color-auth-input-border)",
                      color: "var(--color-auth-text-muted)",
                    }}
                  >
                    <ImagePlus size={13} strokeWidth={1.5} />
                    Upload photo
                    <span
                      className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: "#EBF0EB", color: "#5C7A6B" }}
                    >
                      Soon
                    </span>
                  </button>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--color-auth-text-muted)" }}
                  >
                    or pick an avatar below
                  </span>
                </div>

                {/* 4×2 grid */}
                <div className="grid grid-cols-4 gap-y-4 justify-items-center">
                  {AVATAR_KEYS.map((key) => {
                    const isSelected = selectedAvatar === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedAvatar(key)}
                        className="relative flex items-center justify-center rounded-full transition-all duration-150"
                        style={{
                          width: "60px",
                          height: "60px",
                          outline: isSelected
                            ? "2.5px solid #5C7A6B"
                            : "2.5px solid transparent",
                          outlineOffset: "2px",
                          padding: 0,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        aria-label={`Select avatar ${key}`}
                        aria-pressed={isSelected}
                      >
                        <Avatar avatarKey={key} size={60} />
                        {isSelected && (
                          <span
                            className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
                            style={{
                              width: "18px",
                              height: "18px",
                              background: "#5C7A6B",
                              border: "2px solid white",
                            }}
                          >
                            <Check size={10} strokeWidth={2.5} color="white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label
                  htmlFor="bio"
                  className="block text-[13px] font-medium mb-1.5"
                  style={{ color: "var(--color-auth-text-secondary)" }}
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    if (bioError) setBioError(null);
                  }}
                  placeholder="Tell clients about your approach and what you specialize in..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all resize-none focus:outline-none"
                  style={{
                    background: "var(--color-auth-input)",
                    border: bioError
                      ? "1px solid #C0705A"
                      : "1px solid var(--color-auth-input-border)",
                    color: "var(--color-auth-input-text)",
                    focusRingColor: "#6B7E6C",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6B7E6C";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(107,126,108,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = bioError
                      ? "#C0705A"
                      : "var(--color-auth-input-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {bioError ? (
                    <p className="text-[12px]" style={{ color: "#C0705A" }}>
                      {bioError}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p
                    className="text-[11px] ml-auto"
                    style={{ color: "var(--color-auth-text-muted)" }}
                  >
                    {bio.length}/500
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.97]"
                style={{ background: "#5C7A6B" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#496158";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#5C7A6B";
                }}
              >
                Continue
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </form>
          )}

          {/* ── Step 1: Support ── */}
          {step === 1 && (
            <div>
              <div className="mb-8 text-center">
                <h1
                  className="text-xl font-bold"
                  style={{ color: "var(--color-auth-text)" }}
                >
                  Anything else?
                </h1>
                <p
                  className="mt-1 text-[13px]"
                  style={{ color: "var(--color-auth-text-secondary)" }}
                >
                  One last thing before you head in
                </p>
              </div>

              {/* Support checkbox */}
              <label
                htmlFor="supportCheck"
                className="flex items-start gap-3 cursor-pointer rounded-xl p-4 transition-colors"
                style={{
                  background: supportRequested ? "rgba(92,122,107,0.06)" : "var(--color-auth-input)",
                  border: `1px solid ${supportRequested ? "#8FAF8A" : "var(--color-auth-input-border)"}`,
                }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <div
                    className="flex items-center justify-center rounded transition-all duration-150"
                    style={{
                      width: "18px",
                      height: "18px",
                      background: supportRequested ? "#5C7A6B" : "transparent",
                      border: `2px solid ${supportRequested ? "#5C7A6B" : "#C5BFB8"}`,
                      borderRadius: "4px",
                    }}
                  >
                    {supportRequested && (
                      <Check size={11} strokeWidth={3} color="white" />
                    )}
                  </div>
                  <input
                    id="supportCheck"
                    type="checkbox"
                    checked={supportRequested}
                    onChange={(e) => setSupportRequested(e.target.checked)}
                    className="sr-only"
                  />
                </div>
                <div>
                  <p
                    className="text-[14px] font-medium leading-snug"
                    style={{ color: "var(--color-auth-text)" }}
                  >
                    I&rsquo;d like support from the Bendre team to get set up
                  </p>
                  <p
                    className="text-[12px] mt-0.5"
                    style={{ color: "var(--color-auth-text-muted)" }}
                  >
                    We&rsquo;ll reach out within 24 hours
                  </p>
                </div>
              </label>

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-2">
                <button
                  onClick={handleFinish}
                  disabled={completeOnboarding.isPending}
                  className="w-full h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.97]"
                  style={{ background: "#5C7A6B" }}
                  onMouseEnter={(e) => {
                    if (!completeOnboarding.isPending)
                      (e.currentTarget as HTMLButtonElement).style.background = "#496158";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#5C7A6B";
                  }}
                >
                  {completeOnboarding.isPending ? "Setting up..." : "Finish setup"}
                  {!completeOnboarding.isPending && <ArrowRight size={15} strokeWidth={2} />}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={completeOnboarding.isPending}
                  className="w-full h-9 text-[13px] font-medium transition-colors cursor-pointer rounded-lg disabled:opacity-50"
                  style={{ color: "var(--color-auth-text-muted)", background: "none", border: "none" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-auth-text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-auth-text-muted)";
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
