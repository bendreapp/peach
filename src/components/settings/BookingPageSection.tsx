import { useState, useEffect } from "react";
import { useTherapistMe, useUpdateTherapist } from "@/lib/api-hooks";
import { toast } from "sonner";
import { ExternalLink, Copy, Check, Eye, Globe, Type, FileText, IndianRupee, Image as ImageIcon } from "lucide-react";

export default function BookingPageSection() {
  const therapist = useTherapistMe();
  const update = useUpdateTherapist();
  const t = therapist.data as any;

  const [active, setActive] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [showPricing, setShowPricing] = useState(false);
  const [sessionRate, setSessionRate] = useState(0);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync state when therapist data loads
  useEffect(() => {
    if (t) {
      setActive(t.booking_page_active ?? false);
      setDisplayName(t.display_name || t.full_name || "");
      setBio(t.bio || "");
      setShowPricing(t.show_pricing ?? false);
      setSessionRate(t.session_rate_inr ?? 0);
      setSlug(t.slug || "");
    }
  }, [t]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (therapist.isLoading || !t) {
    return (
      <section className="bg-surface rounded-card border border-border shadow-sm p-6">
        <div className="h-6 w-40 bg-border rounded-lg animate-pulse mb-4" />
        <div className="h-10 bg-border/30 rounded-lg animate-pulse mb-3" />
        <div className="h-10 bg-border/30 rounded-lg animate-pulse" />
      </section>
    );
  }

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
  }

  function handleToggle() {
    const newVal = !active;
    setActive(newVal);
    update.mutate(
      { booking_page_active: newVal },
      {
        onSuccess: () => toast.success(newVal ? "Booking page is now live" : "Booking page is now hidden"),
        onError: (err) => {
          setActive(!newVal);
          toast.error(err.message);
        },
      }
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      {
        display_name: displayName || null,
        bio: bio || null,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        show_pricing: showPricing,
        session_rate_inr: sessionRate,
      },
      {
        onSuccess: () => toast.success("Booking page updated"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow";

  return (
    <div className="space-y-6">
      {/* Header + Toggle */}
      <section className="bg-surface rounded-card border border-border shadow-sm p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={18} className="text-sage" />
            <h2 className="text-lg font-sans font-semibold text-ink">Booking Page</h2>
          </div>
          <p className="text-sm text-ink-tertiary">
            Your public page where potential clients can learn about you and get in touch.
          </p>
        </div>

        {/* On/Off Toggle */}
        <div className="flex items-center justify-between p-4 rounded-small border border-border bg-bg/50">
          <div>
            <p className="text-sm font-medium text-ink">
              {active ? "Page is live" : "Page is off"}
            </p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              {active
                ? "Anyone with your link can see your page"
                : "Your page is hidden from the public"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={update.isPending}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
              active ? "bg-sage" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-surface transition-transform shadow-sm ${
                active ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* URL + Copy + Preview */}
        {active && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-ink-secondary">
              Your booking link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-small border border-border bg-bg text-sm text-ink font-mono truncate">
                /booking/{slug}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 px-3.5 py-2.5 rounded-small border border-border text-sm font-medium text-ink hover:bg-bg transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={`/booking/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-3.5 py-2.5 rounded-small border border-border text-sm font-medium text-ink hover:bg-bg transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={14} />
                Preview
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Customization Form */}
      {active && (
        <section className="bg-surface rounded-card border border-border shadow-sm p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Type size={18} className="text-sage" />
              <h2 className="text-lg font-sans font-semibold text-ink">Customize Page</h2>
            </div>
            <p className="text-sm text-ink-tertiary">
              Control what visitors see on your public page.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="bp-displayName" className="block text-xs font-medium text-ink-secondary mb-1.5">
                Display name
              </label>
              <input
                id="bp-displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                className={inputCls}
              />
              <p className="text-[11px] text-ink-tertiary mt-1">
                The name shown on your public page. Leave empty to use your full name.
              </p>
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="bp-slug" className="block text-xs font-medium text-ink-secondary mb-1.5">
                Page URL
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3.5 py-2.5 bg-bg border border-r-0 border-border rounded-l-xl text-sm text-ink-tertiary">
                  bendre.app/booking/
                </span>
                <input
                  id="bp-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  minLength={3}
                  className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bp-bio" className="block text-xs font-medium text-ink-secondary mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText size={13} className="text-ink-tertiary" />
                  Bio
                </span>
              </label>
              <textarea
                id="bp-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Tell potential clients about yourself, your approach, and what you specialize in..."
                className={`${inputCls} resize-none`}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-ink-tertiary">
                  This appears below your name on the public page.
                </p>
                <span className="text-[11px] text-ink-tertiary">{bio.length}/500</span>
              </div>
            </div>

            {/* Show Pricing Toggle */}
            <div className="flex items-center justify-between p-4 rounded-small border border-border bg-bg/50">
              <div>
                <div className="flex items-center gap-1.5">
                  <IndianRupee size={14} className="text-ink-secondary" />
                  <p className="text-sm font-medium text-ink">Show session rate</p>
                </div>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {showPricing
                    ? `Showing ₹${sessionRate.toLocaleString("en-IN")} per session on your page`
                    : "Session rate is hidden from your page"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPricing(!showPricing)}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                  showPricing ? "bg-sage" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-surface transition-transform shadow-sm ${
                    showPricing ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {/* Session Rate — only show if pricing is enabled */}
            {showPricing && (
              <div>
                <label htmlFor="bp-rate" className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Session rate (₹)
                </label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-tertiary">₹</span>
                  <input
                    id="bp-rate"
                    type="number"
                    min={0}
                    value={sessionRate}
                    onChange={(e) => setSessionRate(parseInt(e.target.value) || 0)}
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={update.isPending}
                className="bg-sage text-white px-5 py-2.5 rounded-small text-sm font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 shadow-sage cursor-pointer"
              >
                {update.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Preview Card */}
      {active && (
        <section className="bg-surface rounded-card border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={18} className="text-sage" />
            <h2 className="text-lg font-sans font-semibold text-ink">Preview</h2>
          </div>
          <p className="text-sm text-ink-tertiary mb-4">
            This is how your page looks to visitors.
          </p>

          {/* Mini preview */}
          <div className="border border-border rounded-xl overflow-hidden bg-[#FAFAF8]">
            <div className="flex flex-col items-center py-8 px-6 text-center">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full mb-4 flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: "linear-gradient(145deg, #EDF2EE, #D4DDD5)" }}
              >
                {t.avatar_url ? (
                  <img
                    src={t.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold" style={{ color: "#6B7E6C" }}>
                    {(displayName || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
                {displayName || t.full_name || "Your Name"}
              </h3>

              {bio && (
                <p className="text-xs mt-2 max-w-xs leading-relaxed" style={{ color: "#6B6B6B" }}>
                  {bio.length > 120 ? bio.slice(0, 120) + "..." : bio}
                </p>
              )}

              {showPricing && sessionRate > 0 && (
                <p className="text-xs mt-2 font-medium" style={{ color: "#6B7E6C" }}>
                  ₹{sessionRate.toLocaleString("en-IN")} per session
                </p>
              )}

              <div className="mt-5 w-full max-w-[200px] h-9 rounded-lg flex items-center justify-center text-xs font-medium text-white" style={{ background: "#6B7E6C" }}>
                Get in touch
              </div>
            </div>
            <div className="text-center pb-3">
              <p className="text-[10px]" style={{ color: "#C0C0C0" }}>
                Powered by <span className="font-semibold" style={{ color: "#B0B0B0" }}>Bendre</span>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
