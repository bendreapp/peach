"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { Plus, X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095";

interface TherapistProfile {
  slug: string;
  full_name: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  show_pricing?: boolean;
  session_rate_inr?: number;
}

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProfile(slug: string): Promise<TherapistProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/booking/${slug}/profile`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function BookingPage({ params }: BookingPageProps) {
  const { slug } = use(params);
  return <BookingPageContent slug={slug} />;
}

function BookingPageContent({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [preferredTimes, setPreferredTimes] = useState<string[]>([""]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile on mount
  useEffect(() => {
    fetchProfile(slug).then((data) => {
      setProfile(data);
      setProfileLoading(false);
      if (!data) setProfileError(true);
    });
  }, [slug]);

  function addPreferredTime() {
    if (preferredTimes.length < 3) {
      setPreferredTimes([...preferredTimes, ""]);
    }
  }

  function removePreferredTime(index: number) {
    setPreferredTimes(preferredTimes.filter((_, i) => i !== index));
  }

  function updatePreferredTime(index: number, value: string) {
    const updated = [...preferredTimes];
    updated[index] = value;
    setPreferredTimes(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const filledTimes = preferredTimes.filter((t) => t.trim().length > 0);

    try {
      const res = await fetch(`${API_BASE}/api/v1/booking/${slug}/inquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          phone: `${countryCode}${phone}`,
          message: message.trim(),
          preferred_times: filledTimes.length > 0 ? filledTimes : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = profile?.display_name || profile?.full_name || "";

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      {/* Top bar */}
      <header className="py-4 px-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Bendre" width={22} height={22} />
          <span className="text-sm font-semibold" style={{ color: "#999", fontFamily: "Satoshi, sans-serif" }}>
            bendre
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md">

          {/* Profile section */}
          {profileLoading ? (
            <div className="flex flex-col items-center mb-10">
              <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse mb-4" />
              <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : profileError ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "#999" }}>This booking page is not available.</p>
            </div>
          ) : profile ? (
            <div className="flex flex-col items-center mb-10 text-center">
              {/* Avatar */}
              <div
                className="w-24 h-24 rounded-full mb-5 flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: "linear-gradient(145deg, #EDF2EE, #D4DDD5)" }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "#6B7E6C", fontFamily: "Satoshi, sans-serif" }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1
                className="text-2xl font-bold tracking-tight mb-2"
                style={{ color: "#1A1A1A", fontFamily: "Satoshi, sans-serif" }}
              >
                {displayName}
              </h1>

              {/* Bio */}
              {profile.bio && (
                <p
                  className="text-sm leading-relaxed max-w-sm"
                  style={{ color: "#6B6B6B", fontFamily: "Satoshi, sans-serif" }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Pricing */}
              {profile.show_pricing && profile.session_rate_inr && profile.session_rate_inr > 0 && (
                <p
                  className="text-sm font-medium mt-2"
                  style={{ color: "#6B7E6C", fontFamily: "Satoshi, sans-serif" }}
                >
                  ₹{profile.session_rate_inr.toLocaleString("en-IN")} per session
                </p>
              )}
            </div>
          ) : null}

          {/* Form or success state */}
          {!profileError && !profileLoading && (
            <>
              {submitted ? (
                /* Success screen */
                <div
                  className="rounded-2xl border p-8 text-center"
                  style={{ background: "#fff", borderColor: "#E5E5E0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: "rgba(107,126,108,0.1)" }}
                  >
                    <CheckCircle size={28} style={{ color: "#6B7E6C" }} />
                  </div>
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ color: "#1A1A1A", fontFamily: "Satoshi, sans-serif" }}
                  >
                    Request sent!
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "#6B6B6B", fontFamily: "Satoshi, sans-serif" }}
                  >
                    {displayName
                      ? `${displayName} will get back to you shortly.`
                      : "We'll be in touch shortly."}
                  </p>
                </div>
              ) : (
                /* Inquiry form */
                <div
                  className="rounded-2xl border"
                  style={{ background: "#fff", borderColor: "#E5E5E0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="px-7 pt-7 pb-2">
                    <h2
                      className="text-base font-bold mb-0.5"
                      style={{ color: "#1A1A1A", fontFamily: "Satoshi, sans-serif" }}
                    >
                      Get in touch
                    </h2>
                    <p
                      className="text-xs"
                      style={{ color: "#999", fontFamily: "Satoshi, sans-serif" }}
                    >
                      Fill in your details and {displayName || "we"} will reach out to schedule a session.
                    </p>
                  </div>

                  {error && (
                    <div className="mx-7 mt-4 px-4 py-3 rounded-xl flex items-start gap-2.5 text-[13px]" style={{ background: "rgba(229,57,53,0.07)", border: "1px solid rgba(229,57,53,0.15)", color: "#c0392b" }}>
                      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-[13px] font-medium mb-1.5"
                        style={{ color: "#555", fontFamily: "Satoshi, sans-serif" }}
                      >
                        Your name <span style={{ color: "#6B7E6C" }}>*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Priya Sharma"
                        className="w-full h-11 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6B7E6C]/15 focus:border-[#6B7E6C]"
                        style={{ background: "#F5F5F2", border: "1px solid #E0E0DB", color: "#1A1A1A" }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[13px] font-medium mb-1.5"
                        style={{ color: "#555", fontFamily: "Satoshi, sans-serif" }}
                      >
                        Email <span style={{ color: "#6B7E6C" }}>*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="priya@example.com"
                        className="w-full h-11 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6B7E6C]/15 focus:border-[#6B7E6C]"
                        style={{ background: "#F5F5F2", border: "1px solid #E0E0DB", color: "#1A1A1A" }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        className="block text-[13px] font-medium mb-1.5"
                        style={{ color: "#555", fontFamily: "Satoshi, sans-serif" }}
                      >
                        Phone <span style={{ color: "#6B7E6C" }}>*</span>
                      </label>
                      <PhoneInput
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        phone={phone}
                        onPhoneChange={setPhone}
                        required
                      />
                    </div>

                    {/* Preferred times */}
                    <div>
                      <label
                        className="block text-[13px] font-medium mb-1.5"
                        style={{ color: "#555", fontFamily: "Satoshi, sans-serif" }}
                      >
                        Preferred times <span style={{ color: "#6B7E6C" }}>*</span>
                      </label>
                      <p
                        className="text-[11px] mb-2.5"
                        style={{ color: "#AAA", fontFamily: "Satoshi, sans-serif" }}
                      >
                        When works best for you? e.g. "weekday evenings", "Saturday mornings"
                      </p>
                      <div className="space-y-2.5">
                        {preferredTimes.map((time, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              required={index === 0}
                              value={time}
                              onChange={(e) => updatePreferredTime(index, e.target.value)}
                              placeholder={
                                index === 0
                                  ? "e.g. weekday evenings"
                                  : index === 1
                                  ? "e.g. Saturday mornings"
                                  : "e.g. April 10, 3pm"
                              }
                              className="flex-1 h-11 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6B7E6C]/15 focus:border-[#6B7E6C]"
                              style={{ background: "#F5F5F2", border: "1px solid #E0E0DB", color: "#1A1A1A" }}
                            />
                            {preferredTimes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePreferredTime(index)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
                                style={{ color: "#AAA", background: "#F5F5F2", border: "1px solid #E0E0DB" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#c0392b"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#AAA"; }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {preferredTimes.length < 3 && (
                        <button
                          type="button"
                          onClick={addPreferredTime}
                          className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                          style={{ color: "#6B7E6C", fontFamily: "Satoshi, sans-serif" }}
                        >
                          <Plus size={13} />
                          Add another time
                        </button>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-[13px] font-medium mb-1.5"
                        style={{ color: "#555", fontFamily: "Satoshi, sans-serif" }}
                      >
                        What brings you here? <span style={{ color: "#6B7E6C" }}>*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Briefly describe what you're looking for help with..."
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6B7E6C]/15 focus:border-[#6B7E6C] resize-none"
                        style={{ background: "#F5F5F2", border: "1px solid #E0E0DB", color: "#1A1A1A", fontFamily: "Satoshi, sans-serif" }}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      style={{ background: "#6B7E6C", fontFamily: "Satoshi, sans-serif" }}
                    >
                      {submitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send size={15} />
                          Send request
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center">
        <p className="text-xs" style={{ color: "#C0C0C0", fontFamily: "Satoshi, sans-serif" }}>
          Powered by{" "}
          <span className="font-semibold" style={{ color: "#B0B0B0" }}>
            Bendre
          </span>
        </p>
      </footer>
    </main>
  );
}
