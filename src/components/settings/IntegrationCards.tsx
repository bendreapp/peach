"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Video, Calendar, ExternalLink } from "lucide-react";

interface IntegrationCardsProps {
  zoomConnected: boolean;
  googleConnected: boolean;
}

export default function IntegrationCards({
  zoomConnected,
  googleConnected,
}: IntegrationCardsProps) {
  const qc = useQueryClient();

  const disconnectZoom = useMutation({
    mutationFn: () => api.integration.disconnectZoom(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration", "status"] });
      toast.success("Zoom disconnected. Existing sessions keep their links.");
    },
    onError: () => toast.error("Couldn't disconnect Zoom. Try again."),
  });
  const disconnectGoogle = useMutation({
    mutationFn: () => api.integration.disconnectGoogle(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration", "status"] });
      toast.success("Google Calendar disconnected. Existing events remain.");
    },
    onError: () => toast.error("Couldn't disconnect Google Calendar. Try again."),
  });

  function connectZoom() {
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
    if (!clientId) {
      alert("Zoom integration is not configured. Please set NEXT_PUBLIC_ZOOM_CLIENT_ID.");
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/zoom/callback`);
    window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
  }

  function connectGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Google Calendar integration is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google/callback`);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.events");
    const state = crypto.randomUUID();
    // Store state in a cookie for CSRF validation on server callback
    document.cookie = `google_oauth_state=${state}; path=/; max-age=600; SameSite=Lax; Secure`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
  }

  return (
    <section className="ui-card space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">Integrations</h2>
        <p className="text-sm text-ink-secondary mt-1">
          Optional. Connect Zoom or Google Calendar to skip manual link-copying and double-booking.
        </p>
      </div>

      <div className="space-y-3">
        {/* Zoom */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Video size={20} className="text-blue-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Zoom</p>
              <p className="text-xs text-ink-tertiary leading-relaxed">
                When you create an online session, Bendre auto-generates a Zoom link and
                shares it with the client. Without this, you'll paste a link manually each time.
              </p>
            </div>
          </div>

          {zoomConnected ? (
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="badge-success flex items-center gap-1.5" aria-label="Zoom is connected">
                <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                Connected
              </span>
              <button
                onClick={() => disconnectZoom.mutate()}
                disabled={disconnectZoom.isPending}
                aria-label="Disconnect Zoom"
                className="text-xs text-ink-tertiary hover:text-error transition-colors font-medium disabled:opacity-50"
              >
                {disconnectZoom.isPending ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectZoom}
              aria-label="Connect Zoom"
              className="btn-secondary btn-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Connect Zoom
            </button>
          )}
        </div>

        {/* Google Calendar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-amber-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Google Calendar</p>
              <p className="text-xs text-ink-tertiary leading-relaxed">
                Every session you book in Bendre lands on your Google Calendar with the client name
                and notes link. Helps avoid double-booking and surfaces sessions in your phone's calendar app.
              </p>
            </div>
          </div>

          {googleConnected ? (
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="badge-success flex items-center gap-1.5" aria-label="Google Calendar is connected">
                <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                Connected
              </span>
              <button
                onClick={() => disconnectGoogle.mutate()}
                disabled={disconnectGoogle.isPending}
                aria-label="Disconnect Google Calendar"
                className="text-xs text-ink-tertiary hover:text-error transition-colors font-medium disabled:opacity-50"
              >
                {disconnectGoogle.isPending ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              aria-label="Connect Google Calendar"
              className="btn-secondary btn-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
