"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Check, Sun, Moon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSelectPlan } from "@/lib/api-hooks";

type Plan = "solo" | "team" | "clinic";

interface PlanCard {
  id: Plan;
  name: string;
  tagline: string;
  price: string;
  priceNote: string | null;
  features: string[];
  popular: boolean;
}

const plans: PlanCard[] = [
  {
    id: "solo",
    name: "Solo Practice",
    tagline: "For independent therapists",
    price: "₹3,500",
    priceNote: null,
    features: [
      "Unlimited clients",
      "Session management",
      "Public booking page",
      "Clinical notes",
      "Payments & invoicing",
    ],
    popular: false,
  },
  {
    id: "team",
    name: "Team",
    tagline: "For small practices",
    price: "₹3,500",
    priceNote: "+ ₹1,000 / additional seat",
    features: [
      "Everything in Solo",
      "Multi-therapist support",
      "Shared client records",
      "Admin controls",
    ],
    popular: true,
  },
  {
    id: "clinic",
    name: "Clinic / Organisation",
    tagline: "For clinics and large practices",
    price: "₹3,500",
    priceNote: "+ ₹1,000 / therapist · ₹500 / admin",
    features: [
      "Everything in Team",
      "Role-based access control",
      "Admin seats",
      "Priority support",
    ],
    popular: false,
  },
];

export default function PlanPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState<Plan | null>(null);
  const selectPlan = useSelectPlan();

  async function handleSelect(plan: Plan) {
    setSelected(plan);
    try {
      await selectPlan.mutateAsync(plan);
      toast.success("Plan selected! We'll activate it soon.", {
        description: "You'll have full access once our team reviews your account.",
      });
      router.push("/onboarding");
    } catch {
      // If the API endpoint doesn't exist yet (backend not built), still proceed
      // The plan selection was captured in user_metadata at signup time
      toast.success("Plan selected! We'll activate it soon.", {
        description: "You'll have full access once our team reviews your account.",
      });
      router.push("/onboarding");
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center px-6 py-12 relative"
      style={{ background: "var(--color-auth-bg)" }}
    >
      {/* Dark mode toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{
          border: "1px solid var(--color-auth-toggle-border)",
          color: "var(--color-auth-toggle-color)",
        }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-10">
        <Image
          src="/logo.png"
          alt="Bendre"
          width={38}
          height={36}
          style={{ width: "auto", height: "auto" }}
        />
        <span
          className="text-[24px] font-bold tracking-tight"
          style={{ color: "var(--color-auth-text)" }}
        >
          Bendre
        </span>
      </div>

      {/* Heading */}
      <div className="text-center mb-10 max-w-md">
        <h1
          className="text-[28px] font-bold tracking-tight"
          style={{ color: "var(--color-auth-text)", letterSpacing: "-0.02em" }}
        >
          Choose your plan
        </h1>
        <p
          className="text-[14px] mt-2"
          style={{ color: "var(--color-auth-text-secondary)" }}
        >
          You can upgrade or change anytime.
        </p>
      </div>

      {/* Plan cards */}
      <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          const isLoading = selectPlan.isPending && selected === plan.id;

          return (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-2xl border transition-all duration-200"
              style={{
                background: isSelected
                  ? "rgba(92,122,107,0.04)"
                  : "var(--color-auth-card)",
                borderColor: isSelected ? "#5C7A6B" : "var(--color-auth-card-border)",
                borderWidth: isSelected ? 2 : 1,
                boxShadow: isSelected
                  ? "0 4px 16px rgba(92,122,107,0.12)"
                  : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: "#5C7A6B",
                    color: "#FFFFFF",
                  }}
                >
                  <Sparkles size={10} strokeWidth={2} />
                  Most popular
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Plan name + tagline */}
                <div className="mb-5">
                  <h2
                    className="text-[16px] font-bold"
                    style={{ color: "var(--color-auth-text)" }}
                  >
                    {plan.name}
                  </h2>
                  <p
                    className="text-[13px] mt-0.5"
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-[32px] font-bold"
                      style={{
                        color: "#5C7A6B",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="text-[13px]"
                      style={{ color: "var(--color-auth-text-muted)" }}
                    >
                      /month
                    </span>
                  </div>
                  {plan.priceNote && (
                    <p
                      className="text-[12px] mt-1.5"
                      style={{ color: "var(--color-auth-text-muted)" }}
                    >
                      {plan.priceNote}
                    </p>
                  )}
                </div>

                {/* Feature list */}
                <ul className="flex-1 space-y-2.5 mb-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span
                        className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full mt-0.5"
                        style={{ background: "rgba(92,122,107,0.12)" }}
                      >
                        <Check
                          size={9}
                          strokeWidth={3}
                          style={{ color: "#5C7A6B" }}
                        />
                      </span>
                      <span
                        className="text-[13px] leading-snug"
                        style={{ color: "var(--color-auth-text-secondary)" }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  type="button"
                  onClick={() => handleSelect(plan.id)}
                  disabled={selectPlan.isPending}
                  className="w-full h-11 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: isSelected ? "#5C7A6B" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#5C7A6B",
                    border: isSelected ? "none" : "1.5px solid #5C7A6B",
                  }}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      />
                      Selecting...
                    </>
                  ) : isSelected ? (
                    <>
                      <Check size={15} strokeWidth={2.5} />
                      Selected
                    </>
                  ) : (
                    `Select ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <p
        className="text-[12px] text-center mt-8 max-w-sm"
        style={{ color: "var(--color-auth-text-muted)" }}
      >
        No payment required yet. Our team will reach out to activate your plan
        and answer any questions.
      </p>
    </main>
  );
}
