import { useState } from "react";
import { useUpdateTherapist } from "@/lib/api-hooks";
import { toast } from "sonner";

interface ProfileFormProps {
  therapist: {
    full_name: string;
    display_name: string | null;
    slug: string;
    bio: string | null;
    qualifications: string | null;
    phone: string | null;
    gstin: string | null;
  };
}

export default function ProfileForm({ therapist }: ProfileFormProps) {
  const [fullName, setFullName] = useState(therapist.full_name);
  const [displayName, setDisplayName] = useState(therapist.display_name ?? "");
  const [slug, setSlug] = useState(therapist.slug);
  const [bio, setBio] = useState(therapist.bio ?? "");
  const [qualifications, setQualifications] = useState(therapist.qualifications ?? "");
  const [phone, setPhone] = useState(therapist.phone ?? "");
  const [gstin, setGstin] = useState(therapist.gstin ?? "");
  const update = useUpdateTherapist();

  // Add local onSuccess/onError handlers
  const handleMutate = (data: Record<string, unknown>) => {
    update.mutate(data, {
      onSuccess: () => toast.success("Profile saved"),
      onError: (err) => toast.error(err.message),
    });
  };

  function handleSlugChange(val: string) {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleMutate({
      full_name: fullName,
      display_name: displayName || null,
      slug,
      bio: bio || null,
      qualifications: qualifications || null,
      phone: phone || null,
      gstin: gstin || null,
    });
  }

  return (
    <section className="bg-surface rounded-card border border-border shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="text-lg font-sans font-semibold text-ink">Profile</h2>
        </div>
        <p className="text-sm text-ink-tertiary">
          Your public-facing profile shown on the booking page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-ink-secondary mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-ink-secondary mb-1.5">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Dr. Priya"
              className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <div>
          <label htmlFor="slug" className="block text-xs font-medium text-ink-secondary mb-1.5">
            Booking page URL
          </label>
          <div className="flex items-center gap-0">
            <span className="px-3.5 py-2.5 bg-bg border border-r-0 border-border rounded-l-xl text-sm text-ink-tertiary">
              bendre.app/booking/
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-xs font-medium text-ink-secondary mb-1.5">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Tell clients about your approach and experience..."
            className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow resize-none"
          />
          <div className="text-right text-[11px] text-ink-tertiary mt-1">
            {bio.length}/2000
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="qualifications" className="block text-xs font-medium text-ink-secondary mb-1.5">
              Qualifications
            </label>
            <input
              id="qualifications"
              type="text"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="e.g. M.Phil Clinical Psychology, RCI"
              className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-ink-secondary mb-1.5">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label htmlFor="gstin" className="block text-xs font-medium text-ink-secondary mb-1.5">
            GSTIN <span className="text-ink-tertiary font-normal">(optional)</span>
          </label>
          <input
            id="gstin"
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            placeholder="e.g. 27AABCU9603R1ZM"
            className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow font-mono"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-small text-sm font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 shadow-sage"
          >
            {update.isPending ? "Saving..." : "Save Profile"}
          </button>
          {update.error && (
            <span className="text-sm text-red-600">
              {update.error.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
