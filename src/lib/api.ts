"use client";

import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095";

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ApiClientError";
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T = any>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, params } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorData: ApiError;
    try {
      errorData = await res.json();
    } catch {
      throw new ApiClientError(
        `Request failed with status ${res.status}`,
        "UNKNOWN",
        res.status
      );
    }
    throw new ApiClientError(
      errorData.error.message,
      errorData.error.code,
      res.status
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ─── API methods mapped to Rust backend endpoints ────────────────────────────
// These paths MUST match the exact routes registered in backend/src/*/presentation/handlers.rs

export const api = {
  // ── IAM / Therapist ──────────────────────────────────────────────────
  therapist: {
    me: () => apiFetch("/api/v1/therapists/me"),
    update: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/therapists/me", { method: "PUT", body: data }),
    getBySlug: (slug: string) =>
      apiFetch(`/api/v1/therapists/by-slug/${slug}`, { auth: false }),
    getAvailability: () => apiFetch("/api/v1/therapists/me/availability"),
    setAvailability: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/therapists/me/availability", {
        method: "PUT",
        body: data,
      }),
    selectPlan: (plan: "solo" | "team" | "clinic") =>
      apiFetch("/api/v1/therapists/me/select-plan", {
        method: "POST",
        body: { plan },
      }),
    completeOnboarding: (data: {
      avatar_key: string;
      bio: string;
      support_requested: boolean;
    }) =>
      apiFetch("/api/v1/therapists/me/complete-onboarding", {
        method: "POST",
        body: data,
      }),
  },

  // ── Clients ──────────────────────────────────────────────────────────
  clients: {
    list: (params?: { status?: string; limit?: number; offset?: number }) =>
      apiFetch("/api/v1/clients", { params }),
    getById: (id: string) => apiFetch(`/api/v1/clients/${id}`),
    getDetail: (id: string) => apiFetch(`/api/v1/clients/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/clients", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/clients/${id}`, { method: "PUT", body: data }),
    deactivate: (id: string) =>
      apiFetch(`/api/v1/clients/${id}`, { method: "DELETE" }),
    updateStatus: (id: string, data: { status: string }) =>
      apiFetch(`/api/v1/clients/${id}/status`, { method: "PATCH", body: data }),
    countActive: () => apiFetch("/api/v1/clients/count"),
  },

  // ── Sessions ─────────────────────────────────────────────────────────
  session: {
    pending: () => apiFetch("/api/v1/sessions/pending"),
    today: () => apiFetch("/api/v1/sessions/today"),
    upcoming: () => apiFetch("/api/v1/sessions/upcoming"),
    listByDateRange: (params: { start: string; end: string }) =>
      apiFetch("/api/v1/sessions", { params }),
    byClient: (clientId: string, params?: Record<string, string>) =>
      apiFetch("/api/v1/sessions", { params: { client_id: clientId, ...params } }),
    getById: (id: string) => apiFetch(`/api/v1/sessions/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/sessions", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/sessions/${id}`, { method: "PUT", body: data }),
    approve: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}/approve`, { method: "POST" }),
    reject: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}/reject`, { method: "POST" }),
    reschedule: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/sessions/${id}`, { method: "PUT", body: data }),
    cancel: (id: string, data?: Record<string, unknown>) =>
      apiFetch(`/api/v1/sessions/${id}/cancel`, {
        method: "POST",
        body: data,
      }),
    complete: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}/complete`, { method: "POST" }),
    markNoShow: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}/no-show`, { method: "POST" }),
    delete: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}`, { method: "DELETE" }),

    // Notes — backend has /notes and /sessions/{session_id}/note
    createNote: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/notes", { method: "POST", body: data }),
    updateNote: (noteId: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/notes/${noteId}`, { method: "PUT", body: data }),
    getNote: (sessionId: string) =>
      apiFetch(`/api/v1/sessions/${sessionId}/note`),
    getNoteById: (noteId: string) => apiFetch(`/api/v1/notes/${noteId}`),
    listNotes: (params?: { client_id?: string; limit?: number }) =>
      apiFetch("/api/v1/notes", { params }),
    deleteNote: (noteId: string) =>
      apiFetch(`/api/v1/notes/${noteId}`, { method: "DELETE" }),
  },

  // ── Booking (public) ─────────────────────────────────────────────────
  booking: {
    getSlots: (slug: string, params: Record<string, string>) =>
      apiFetch(`/api/v1/booking/${slug}/slots`, { auth: false, params }),
    book: (slug: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/booking/${slug}/book`, {
        method: "POST",
        body: data,
        auth: false,
      }),
    bookMultiple: (slug: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/booking/${slug}/book-multiple`, {
        method: "POST",
        body: data,
        auth: false,
      }),
    getPublicProfile: (slug: string) =>
      apiFetch(`/api/v1/booking/${slug}/profile`, { auth: false }),
    inquire: (slug: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/booking/${slug}/inquire`, {
        method: "POST",
        body: data,
        auth: false,
      }),
  },

  // ── Billing ──────────────────────────────────────────────────────────
  payment: {
    list: (params?: { status?: string; limit?: number; offset?: number }) =>
      apiFetch("/api/v1/invoices", { params }),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/invoices", { method: "POST", body: data }),
    markPaid: (id: string, data?: Record<string, unknown>) =>
      apiFetch(`/api/v1/invoices/${id}/paid`, {
        method: "POST",
        body: data,
      }),
    createOrder: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/payments/create-order", { method: "POST", body: data }),
  },

  // ── Messages ─────────────────────────────────────────────────────────
  message: {
    list: (params?: { client_id?: string; cursor?: string; limit?: number }) =>
      apiFetch("/api/v1/messages", { params }),
    send: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/messages", { method: "POST", body: data }),
    markRead: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/messages/read", { method: "POST", body: data }),
    unreadCounts: () => apiFetch("/api/v1/messages/unread-count"),
  },

  // ── Treatment Plans ──────────────────────────────────────────────────
  treatmentPlan: {
    list: (clientId: string) =>
      apiFetch(`/api/v1/clients/${clientId}/treatment-plans`),
    getById: (id: string) => apiFetch(`/api/v1/treatment-plans/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/treatment-plans", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/treatment-plans/${id}`, {
        method: "PUT",
        body: data,
      }),
    updateStatus: (id: string, data: { status: string }) =>
      apiFetch(`/api/v1/treatment-plans/${id}`, {
        method: "PUT",
        body: data,
      }),
    delete: (id: string) =>
      apiFetch(`/api/v1/treatment-plans/${id}`, { method: "DELETE" }),
  },

  // ── Resources ────────────────────────────────────────────────────────
  resource: {
    list: () => apiFetch("/api/v1/resources"),
    getById: (id: string) => apiFetch(`/api/v1/resources/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/resources", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/resources/${id}`, { method: "PUT", body: data }),
    delete: (id: string) =>
      apiFetch(`/api/v1/resources/${id}`, { method: "DELETE" }),
    share: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/resources/${id}/share`, {
        method: "POST",
        body: data,
      }),
    unshare: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/resources/${id}/unshare`, {
        method: "POST",
        body: data,
      }),
    listShared: (clientId: string) =>
      apiFetch(`/api/v1/clients/${clientId}/resources`),
  },

  // ── Blocked Slots ────────────────────────────────────────────────────
  blockedSlot: {
    list: (params?: { start?: string; end?: string }) =>
      apiFetch("/api/v1/blocked-slots", { params }),
    getById: (id: string) => apiFetch(`/api/v1/blocked-slots/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/blocked-slots", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/blocked-slots/${id}`, { method: "PUT", body: data }),
    delete: (id: string) =>
      apiFetch(`/api/v1/blocked-slots/${id}`, { method: "DELETE" }),
  },

  // ── Recurring Reservations ───────────────────────────────────────────
  recurringReservation: {
    list: () => apiFetch("/api/v1/recurring-reservations"),
    byClient: (clientId: string) =>
      apiFetch("/api/v1/recurring-reservations", { params: { client_id: clientId } }),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/recurring-reservations", {
        method: "POST",
        body: data,
      }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/recurring-reservations/${id}`, {
        method: "PUT",
        body: data,
      }),
    release: (id: string) =>
      apiFetch(`/api/v1/recurring-reservations/${id}/release`, {
        method: "POST",
      }),
    createSession: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/recurring-reservations/${id}/create-session`, {
        method: "POST",
        body: data,
      }),
  },

  // ── Session Types ────────────────────────────────────────────────────
  sessionType: {
    list: () => apiFetch("/api/v1/session-types"),
    listByTherapist: (therapistId: string) =>
      apiFetch("/api/v1/session-types", { params: { therapist_id: therapistId }, auth: false }),
    getById: (id: string) => apiFetch(`/api/v1/session-types/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/session-types", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/session-types/${id}`, { method: "PUT", body: data }),
    delete: (id: string) =>
      apiFetch(`/api/v1/session-types/${id}`, { method: "DELETE" }),
    reorder: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/session-types/reorder", {
        method: "POST",
        body: data,
      }),
  },

  // ── Practice ─────────────────────────────────────────────────────────
  practice: {
    me: () => apiFetch("/api/v1/practices/me"),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/practices", { method: "POST", body: data }),
    listMembers: (practiceId: string) =>
      apiFetch(`/api/v1/practices/${practiceId}/members`),
    updateMember: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/practices/members/${id}`, {
        method: "PUT",
        body: data,
      }),
    removeMember: (id: string) =>
      apiFetch(`/api/v1/practices/members/${id}`, { method: "DELETE" }),
    createInvitation: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/practices/invitations", {
        method: "POST",
        body: data,
      }),
    listInvitations: () => apiFetch("/api/v1/practices/invitations"),
    getInvitationByToken: (token: string) =>
      apiFetch(`/api/v1/practices/invitations/by-token/${token}`, {
        auth: false,
      }),
    acceptInvitation: (token: string) =>
      apiFetch(`/api/v1/practices/invitations/${token}/accept`, {
        method: "POST",
      }),
    revokeInvitation: (id: string) =>
      apiFetch(`/api/v1/practices/invitations/${id}/revoke`, {
        method: "POST",
      }),
  },

  // ── Onboarding ───────────────────────────────────────────────────────
  onboarding: {
    createToken: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/onboarding/tokens", { method: "POST", body: data }),
    listTokens: () => apiFetch("/api/v1/onboarding/tokens"),
    toggleToken: (id: string, data: { is_active: boolean }) =>
      apiFetch(`/api/v1/onboarding/tokens/${id}`, {
        method: "PATCH",
        body: data,
      }),
    getByToken: (token: string) =>
      apiFetch(`/api/v1/onboarding/by-token/${token}`, { auth: false }),
    registerClient: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/onboarding/register", {
        method: "POST",
        body: data,
        auth: false,
      }),
  },

  // ── Integrations ─────────────────────────────────────────────────────
  integration: {
    status: () => apiFetch("/api/v1/integrations/status"),
    zoomAuthUrl: () => apiFetch("/api/v1/integrations/zoom/auth-url"),
    connectZoom: (data: { code: string }) =>
      apiFetch("/api/v1/integrations/zoom/connect", {
        method: "POST",
        body: data,
      }),
    disconnectZoom: () =>
      apiFetch("/api/v1/integrations/zoom/disconnect", { method: "POST" }),
    googleAuthUrl: () => apiFetch("/api/v1/integrations/google/auth-url"),
    connectGoogle: (data: { code: string }) =>
      apiFetch("/api/v1/integrations/google/connect", {
        method: "POST",
        body: data,
      }),
    disconnectGoogle: () =>
      apiFetch("/api/v1/integrations/google/disconnect", { method: "POST" }),
  },

  // ── Intake Forms ─────────────────────────────────────────────────────
  intakeForm: {
    list: () => apiFetch("/api/v1/intake-forms"),
    getById: (id: string) => apiFetch(`/api/v1/intake-forms/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/intake-forms", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/intake-forms/${id}`, { method: "PUT", body: data }),
    delete: (id: string) =>
      apiFetch(`/api/v1/intake-forms/${id}`, { method: "DELETE" }),
    getPublicForm: (accessToken: string) =>
      apiFetch(`/api/v1/intake-responses/by-token/${accessToken}`, { auth: false }),
    submit: (responseId: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/intake-responses/${responseId}/submit`, {
        method: "POST",
        body: data,
        auth: false,
      }),
    createResponse: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/intake-responses", { method: "POST", body: data }),
    listResponses: (clientId: string) =>
      apiFetch(`/api/v1/clients/${clientId}/intake-responses`),
    getResponse: (id: string) => apiFetch(`/api/v1/intake-responses/${id}`),
  },

  // ── Broadcast ────────────────────────────────────────────────────────
  broadcast: {
    send: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/broadcast", { method: "POST", body: data }),
  },

  // ── Leads ──────────────────────────────────────────────────────────
  leads: {
    list: (params?: Record<string, string>) =>
      apiFetch("/api/v1/leads", { params }),
    getById: (id: string) => apiFetch(`/api/v1/leads/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/leads", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/leads/${id}`, { method: "PUT", body: data }),
  },

  // ── Client Invitations ────────────────────────────────────────────
  clientInvitations: {
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/client-invitations", { method: "POST", body: data }),
    getByToken: (token: string) =>
      apiFetch(`/api/v1/client-invitations/by-token/${token}`, { auth: false }),
    claim: (token: string) =>
      apiFetch(`/api/v1/client-invitations/by-token/${token}/claim`, {
        method: "POST",
        auth: false,
      }),
  },

  // ── Analytics ────────────────────────────────────────────────────────
  analytics: {
    overview: () => apiFetch("/api/v1/analytics/overview"),
    revenueByMonth: () => apiFetch("/api/v1/analytics/revenue"),
    sessionsByMonth: () => apiFetch("/api/v1/analytics/sessions"),
    clientGrowth: () => apiFetch("/api/v1/analytics/client-growth"),
    topClients: (params?: { limit?: number }) =>
      apiFetch("/api/v1/analytics/top-clients", { params }),
    clientCategoryBreakdown: () =>
      apiFetch("/api/v1/analytics/client-categories"),
  },

  // ── Client Portal ────────────────────────────────────────────────────
  clientPortal: {
    me: () => apiFetch("/api/v1/portal/profiles"),
    getUserRole: () => apiFetch("/api/v1/portal/profiles"),
    upcomingSessions: (clientId?: string) =>
      clientId
        ? apiFetch(`/api/v1/portal/profiles/${clientId}/sessions/upcoming`)
        : apiFetch("/api/v1/portal/profiles"),
    pastSessions: (clientId: string, params?: { offset?: number; limit?: number }) =>
      apiFetch(`/api/v1/portal/profiles/${clientId}/sessions/past`, { params }),
    pendingIntakeForms: () => apiFetch("/api/v1/portal/profiles"),
    cancelSession: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}/cancel`, { method: "POST" }),
    getForTherapist: (slug: string) =>
      apiFetch(`/api/v1/therapists/by-slug/${slug}`, { auth: false }),
  },
};
