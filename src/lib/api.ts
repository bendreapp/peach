"use client";

import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095";

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

interface ApiError {
  error: {
    code: string;
    message: string;
    // PLAN_INACTIVE carries these so the locked screen can render the right copy.
    plan_status?: string;
    expires_at?: string | null;
  };
}

class ApiClientError extends Error {
  code: string;
  status: number;
  /// Populated only when `code === "PLAN_INACTIVE"`. Drives the access-locked screen copy.
  planStatus?: string;
  expiresAt?: string | null;

  constructor(
    message: string,
    code: string,
    status: number,
    extras?: { planStatus?: string; expiresAt?: string | null }
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.planStatus = extras?.planStatus;
    this.expiresAt = extras?.expiresAt ?? null;
    this.name = "ApiClientError";
  }
}

/// Redirect the browser to the access-locked screen on PLAN_INACTIVE.
/// Module-scoped guard so concurrent failing requests don't pile up history entries.
let redirectingToAccessLocked = false;
function redirectToAccessLocked(planStatus?: string) {
  if (typeof window === "undefined") return;
  if (redirectingToAccessLocked) return;
  if (window.location.pathname === "/access-locked") return;
  redirectingToAccessLocked = true;
  const status = planStatus ?? "expired";
  window.location.href = `/access-locked?status=${encodeURIComponent(status)}`;
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
    const err = new ApiClientError(
      errorData.error.message,
      errorData.error.code,
      res.status,
      {
        planStatus: errorData.error.plan_status,
        expiresAt: errorData.error.expires_at ?? null,
      }
    );
    if (err.code === "PLAN_INACTIVE") {
      redirectToAccessLocked(err.planStatus);
    }
    throw err;
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
    planStatus: () =>
      apiFetch<{
        status: "active" | "pending" | "expired" | "suspended";
        plan_status: string;
        plan_selected: string | null;
        plan_expires_at: string | null;
        days_remaining: number | null;
      }>("/api/v1/therapists/me/plan-status"),
    completeOnboarding: (data: {
      avatar_key: string;
      bio: string;
      support_requested: boolean;
      // Post-OAuth users must supply phone (and optionally slug/org_type) so the
      // `phone IS NULL` onboarding loop is resolved. Backend persists these.
      phone?: string;
      slug?: string;
      org_type?: string;
    }) =>
      apiFetch("/api/v1/therapists/me/complete-onboarding", {
        method: "POST",
        body: data,
      }),
  },

  // ── Clients ──────────────────────────────────────────────────────────
  clients: {
    // Backend accepts `page` (1-based) and `per_page` (max 100). Returns Paginated<Client>.
    list: (params?: { status?: string; page?: number; per_page?: number }) =>
      apiFetch("/api/v1/clients", { params }),
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
    listByDateRange: (params: { start: string; end: string }) =>
      apiFetch("/api/v1/sessions", { params }),
    byClient: (clientId: string, params?: Record<string, string>) =>
      apiFetch(`/api/v1/sessions/by-client/${clientId}`, { params }),
    getById: (id: string) => apiFetch(`/api/v1/sessions/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/sessions", { method: "POST", body: data }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/sessions/${id}`, { method: "PUT", body: data }),
    approve: (id: string) =>
      apiFetch(`/api/v1/sessions/${id}/approve`, { method: "POST" }),
    reject: (id: string) =>
      // Backend `RejectSessionInput` is all-optional — send empty object to satisfy JSON body deserialiser.
      apiFetch(`/api/v1/sessions/${id}/reject`, { method: "POST", body: {} }),
    reschedule: (id: string, data: { starts_at: string; ends_at: string }) =>
      // Dedicated reschedule route — NOT the generic PUT update endpoint.
      apiFetch(`/api/v1/sessions/${id}/reschedule`, { method: "POST", body: data }),
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
    // Body must use snake_case fields: session_id (Uuid), techniques_used (string), risk_flags (string).
    createNote: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/notes", { method: "POST", body: data }),
    updateNote: (noteId: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/notes/${noteId}`, { method: "PUT", body: data }),
    getNote: (sessionId: string) =>
      apiFetch(`/api/v1/sessions/${sessionId}/note`),
    getNoteById: (noteId: string) => apiFetch(`/api/v1/notes/${noteId}`),
    // Returns Paginated<Note> — callers should read `.data` for the array.
    // `client_id` filter is NOT supported by the backend PaginationQuery — omitted here.
    // TODO: per-client notes are available via GET /api/v1/clients/{id}/notes — wire when needed.
    listNotes: (params?: { page?: number; per_page?: number }) =>
      apiFetch("/api/v1/notes", { params }),
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
    // `razorpay_payment_id` and `razorpay_order_id` are both Optional on the backend
    // (manual UPI mark-paid flow). Always send at least `{}` so the JSON body is present.
    // Invoice status values: "unpaid" | "paid" | "refunded" — not "draft"/"sent"/"overdue".
    markPaid: (id: string, data?: Record<string, unknown>) =>
      apiFetch(`/api/v1/invoices/${id}/paid`, {
        method: "POST",
        body: data ?? {},
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
    // Returns Paginated<TreatmentPlan> — callers should read `.data` for the array.
    // Body must use `goals` as a JSON string (column migrated from jsonb → text in 00007).
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
    // Backend ShareResourceInput / UnshareResourceInput both require `client_ids: Vec<Uuid>` (plural array).
    share: (id: string, data: { client_ids: string[]; note?: string }) =>
      apiFetch(`/api/v1/resources/${id}/share`, {
        method: "POST",
        body: data,
      }),
    unshare: (id: string, data: { client_ids: string[] }) =>
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
    // Path-param route — NOT a query string filter.
    byClient: (clientId: string) =>
      apiFetch(`/api/v1/recurring-reservations/by-client/${clientId}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/recurring-reservations", {
        method: "POST",
        body: data,
      }),
    // Backend route is /deactivate — there is no /release route.
    deactivate: (id: string) =>
      apiFetch(`/api/v1/recurring-reservations/${id}/deactivate`, {
        method: "POST",
      }),
  },

  // ── Session Types ────────────────────────────────────────────────────
  sessionType: {
    list: () => apiFetch("/api/v1/session-types"),
    // Public path-param route — NOT query-string. Used by the booking page (unauthenticated).
    listByTherapist: (therapistId: string) =>
      apiFetch(`/api/v1/session-types/by-therapist/${therapistId}`, { auth: false }),
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
    disconnectZoom: () =>
      apiFetch("/api/v1/integrations/zoom/disconnect", { method: "POST" }),
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

    // ── Custom question builder ──────────────────────────────────────
    listQuestions: () => apiFetch("/api/v1/intake-forms/questions"),
    createQuestion: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/intake-forms/questions", { method: "POST", body: data }),
    updateQuestion: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/intake-forms/questions/${id}`, {
        method: "PUT",
        body: data,
      }),
    deleteQuestion: (id: string) =>
      apiFetch(`/api/v1/intake-forms/questions/${id}`, { method: "DELETE" }),
    reorderQuestions: (ids: string[]) =>
      apiFetch("/api/v1/intake-forms/questions/reorder", {
        method: "PATCH",
        body: { ids },
      }),
  },

  // ── Broadcast ────────────────────────────────────────────────────────
  broadcast: {
    // Backend returns { sent: number, total_clients: number } after the Wave-1 backend fix.
    // Do NOT read a non-existent field — use `sent` and `total_clients` only.
    send: (data: Record<string, unknown>) =>
      apiFetch<{ sent: number; total_clients: number }>("/api/v1/broadcast", { method: "POST", body: data }),
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
    convertToClient: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/convert-to-client`, { method: "POST" }),
    sendIntakeForm: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/send-intake-form`, { method: "POST" }),
    getIntakeSubmissions: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/intake-submissions`),
  },

  // ── Lead Intake (public) ────────────────────────────────────────────
  leadIntake: {
    getPublicForm: (token: string) =>
      apiFetch(`/api/v1/lead-intake/${token}`, { auth: false }),
    submitPublicForm: (token: string, responses: unknown) =>
      apiFetch(`/api/v1/lead-intake/${token}/submit`, {
        method: "POST",
        body: { responses },
        auth: false,
      }),
  },

  // ── Client Session Types ─────────────────────────────────────────
  clientSessionTypes: {
    list: (clientId: string) =>
      apiFetch(`/api/v1/clients/${clientId}/session-types`),
    create: (clientId: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/clients/${clientId}/session-types`, {
        method: "POST",
        body: data,
      }),
    update: (clientId: string, id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/clients/${clientId}/session-types/${id}`, {
        method: "PUT",
        body: data,
      }),
    delete: (clientId: string, id: string) =>
      apiFetch(`/api/v1/clients/${clientId}/session-types/${id}`, {
        method: "DELETE",
      }),
    setDefault: (clientId: string, id: string) =>
      apiFetch(`/api/v1/clients/${clientId}/session-types/${id}/set-default`, {
        method: "POST",
      }),
  },

  // ── Analytics ────────────────────────────────────────────────────────
  analytics: {
    overview: (params: { start: string; end: string }) =>
      apiFetch("/api/v1/analytics/overview", { params }),
    revenueByMonth: (params: { start: string; end: string }) =>
      apiFetch("/api/v1/analytics/revenue", { params }),
    sessionsByMonth: (params: { start: string; end: string }) =>
      apiFetch("/api/v1/analytics/sessions", { params }),
    clientGrowth: (params: { start: string; end: string }) =>
      apiFetch("/api/v1/analytics/client-growth", { params }),
    clientCategoryBreakdown: () =>
      apiFetch("/api/v1/analytics/client-categories"),
  },

  // ── Message Templates ────────────────────────────────────────────────
  messageTemplates: {
    list: () => apiFetch("/api/v1/message-templates"),
    update: (key: string, data: { subject: string; body: string }) =>
      apiFetch(`/api/v1/message-templates/${key}`, {
        method: "PUT",
        body: data,
      }),
  },

  // ── Client Portal ────────────────────────────────────────────────────
  clientPortal: {
    /// Returns array of ClientPortalProfile objects for the authenticated client user.
    me: () => apiFetch<Array<{ id: string; therapist_id: string; full_name: string; email: string | null; phone: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; intake_completed: boolean; status: string; therapist_name?: string; practice_name?: string; therapist_avatar?: string | null }>>("/api/v1/portal/profiles"),
    upcomingSessions: (clientId: string) =>
      apiFetch(`/api/v1/portal/profiles/${clientId}/sessions/upcoming`),
    pastSessions: (clientId: string, params?: { page?: number; per_page?: number }) =>
      apiFetch(`/api/v1/portal/profiles/${clientId}/sessions/past`, { params }),
    cancelSession: (id: string) =>
      apiFetch(`/api/v1/portal/sessions/${id}/cancel`, { method: "POST" }),
    resources: (clientId: string) =>
      apiFetch(`/api/v1/portal/profiles/${clientId}/resources`),
    // Pending intake forms for the client (real access tokens, powers the banner CTA).
    intakeForms: (clientId: string) =>
      apiFetch<Array<{ id: string; title: string; access_token: string; submitted: boolean }>>(`/api/v1/portal/profiles/${clientId}/intake-forms`),
    updateProfile: (clientId: string, data: { phone?: string; emergency_contact_name?: string; emergency_contact_phone?: string }) =>
      apiFetch(`/api/v1/portal/profiles/${clientId}`, { method: "PUT", body: data }),
    invoices: (clientId: string) =>
      apiFetch(`/api/v1/portal/profiles/${clientId}/invoices`),
    rescheduleSession: (sessionId: string, data: { requested_date: string; requested_time: string; reason?: string }) =>
      apiFetch(`/api/v1/portal/sessions/${sessionId}/reschedule`, { method: "POST", body: data }),
  },

  // ── Client Invitations (portal claim) ────────────────────────────────
  clientInvitations: {
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/client-invitations", { method: "POST", body: data }),
    sendInvite: (data: { client_id: string }) =>
      apiFetch("/api/v1/client-invitations/send", { method: "POST", body: data }),
    getDetail: (token: string) =>
      apiFetch(`/api/v1/client-invitations/by-token/${token}/detail`, { auth: false }),
    claim: (token: string, userId?: string) =>
      apiFetch(`/api/v1/client-invitations/by-token/${token}/claim`, {
        method: "POST",
        auth: false,
        body: userId ? { user_id: userId } : null,
      }),
  },
};
