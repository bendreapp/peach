"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration", "status"] }),
  });
  const disconnectGoogle = useMutation({
    mutationFn: () => api.integration.disconnectGoogle(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration", "status"] }),
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
          Connect your tools for automatic meeting links and calendar sync.
        </p>
      </div>

      <div className="space-y-3">
        {/* Zoom */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Video size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Zoom</p>
              <p className="text-xs text-ink-tertiary">Auto-create meeting links for sessions</p>
            </div>
          </div>

          {zoomConnected ? (
            <div className="flex items-center gap-2">
              <span className="badge-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Connected
              </span>
              <button
                onClick={() => disconnectZoom.mutate()}
                disabled={disconnectZoom.isPending}
                className="text-xs text-ink-tertiary hover:text-error transition-colors font-medium"
              >
                {disconnectZoom.isPending ? "..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectZoom}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <ExternalLink size={12} />
              Connect Zoom
            </button>
          )}
        </div>

        {/* Google Calendar */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Google Calendar</p>
              <p className="text-xs text-ink-tertiary">Sync sessions to your calendar</p>
            </div>
          </div>

          {googleConnected ? (
            <div className="flex items-center gap-2">
              <span className="badge-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Connected
              </span>
              <button
                onClick={() => disconnectGoogle.mutate()}
                disabled={disconnectGoogle.isPending}
                className="text-xs text-ink-tertiary hover:text-error transition-colors font-medium"
              >
                {disconnectGoogle.isPending ? "..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <ExternalLink size={12} />
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
