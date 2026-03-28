"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// ─── React Query hooks wrapping the Rust backend API ─────────────────────────
// These mirror the tRPC hook names so migration is a simple find-replace:
//   trpc.therapist.me.useQuery()  →  useTherapistMe()
//   trpc.clients.list.useQuery()  →  useClientsList()

// ── IAM / Therapist ──────────────────────────────────────────────────────────

export function useTherapistMe() {
  return useQuery({
    queryKey: ["therapist", "me"],
    queryFn: () => api.therapist.me(),
  });
}

export function useTherapistBySlug(slug: string) {
  return useQuery({
    queryKey: ["therapist", "by-slug", slug],
    queryFn: () => api.therapist.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useTherapistAvailability() {
  return useQuery({
    queryKey: ["therapist", "availability"],
    queryFn: () => api.therapist.getAvailability(),
  });
}

export function useUpdateTherapist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.therapist.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["therapist", "me"] }),
  });
}

// ── Clients ──────────────────────────────────────────────────────────────────

export function useClientsList(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["clients", "list", params],
    queryFn: () => api.clients.list(params),
  });
}

export function useClientById(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => api.clients.getById(id),
    enabled: !!id,
  });
}

export function useClientDetail(id: string) {
  return useQuery({
    queryKey: ["clients", id, "detail"],
    queryFn: () => api.clients.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.clients.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.clients.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.clients.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function useSessionsPending() {
  return useQuery({
    queryKey: ["sessions", "pending"],
    queryFn: () => api.session.pending(),
  });
}

export function useSessionsToday() {
  return useQuery({
    queryKey: ["sessions", "today"],
    queryFn: () => api.session.today(),
  });
}

export function useSessionsUpcoming() {
  return useQuery({
    queryKey: ["sessions", "upcoming"],
    queryFn: () => api.session.upcoming(),
  });
}

export function useSessionsByDateRange(start: string, end: string) {
  return useQuery({
    queryKey: ["sessions", "range", start, end],
    queryFn: () => api.session.listByDateRange({ start, end }),
    enabled: !!start && !!end,
  });
}

export function useSessionsByClient(clientId: string) {
  return useQuery({
    queryKey: ["sessions", "client", clientId],
    queryFn: () => api.session.byClient(clientId),
    enabled: !!clientId,
  });
}

export function useApproveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.session.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useRejectSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.session.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) =>
      api.session.cancel(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.session.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.session.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// ── Notes ────────────────────────────────────────────────────────────────────

export function useNotesList(params?: {
  client_id?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["notes", "list", params],
    queryFn: () => api.session.listNotes(params),
  });
}

export function useNoteById(noteId: string) {
  return useQuery({
    queryKey: ["notes", noteId],
    queryFn: () => api.session.getNoteById(noteId),
    enabled: !!noteId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.session.createNote(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      ...data
    }: { noteId: string } & Record<string, unknown>) =>
      api.session.updateNote(noteId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

// ── Treatment Plans ──────────────────────────────────────────────────────────

export function useTreatmentPlansByClient(clientId: string) {
  return useQuery({
    queryKey: ["treatment-plans", "client", clientId],
    queryFn: () => api.treatmentPlan.list(clientId),
    enabled: !!clientId,
  });
}

export function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.treatmentPlan.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["treatment-plans"] }),
  });
}

export function useUpdateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.treatmentPlan.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["treatment-plans"] }),
  });
}

// ── Resources ────────────────────────────────────────────────────────────────

export function useResourcesList() {
  return useQuery({
    queryKey: ["resources", "list"],
    queryFn: () => api.resource.list(),
  });
}

export function useSharedResources(clientId: string) {
  return useQuery({
    queryKey: ["resources", "shared", clientId],
    queryFn: () => api.resource.listShared(clientId),
    enabled: !!clientId,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.resource.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useShareResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.resource.share(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useUnshareResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clientId }: { id: string; clientId: string }) =>
      api.resource.unshare(id, { client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

// ── Recurring Reservations ───────────────────────────────────────────────────

export function useRecurringReservations() {
  return useQuery({
    queryKey: ["recurring-reservations"],
    queryFn: () => api.recurringReservation.list(),
  });
}

// ── Analytics ────────────────────────────────────────────────────────────────

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => api.analytics.overview(),
  });
}

export function useAnalyticsRevenueByMonth() {
  return useQuery({
    queryKey: ["analytics", "revenue-by-month"],
    queryFn: () => api.analytics.revenueByMonth(),
  });
}

export function useAnalyticsSessionsByMonth() {
  return useQuery({
    queryKey: ["analytics", "sessions-by-month"],
    queryFn: () => api.analytics.sessionsByMonth(),
  });
}

export function useAnalyticsClientGrowth() {
  return useQuery({
    queryKey: ["analytics", "client-growth"],
    queryFn: () => api.analytics.clientGrowth(),
  });
}

export function useAnalyticsTopClients(limit = 5) {
  return useQuery({
    queryKey: ["analytics", "top-clients", limit],
    queryFn: () => api.analytics.topClients({ limit }),
  });
}

export function useAnalyticsCategoryBreakdown() {
  return useQuery({
    queryKey: ["analytics", "category-breakdown"],
    queryFn: () => api.analytics.clientCategoryBreakdown(),
  });
}

// ── Practice ─────────────────────────────────────────────────────────────────

export function usePracticeMe() {
  return useQuery({
    queryKey: ["practice", "me"],
    queryFn: () => api.practice.me(),
  });
}

export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: ["practice", "invitation", token],
    queryFn: () => api.practice.getInvitationByToken(token),
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.practice.acceptInvitation(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice"] }),
  });
}

// ── Onboarding ───────────────────────────────────────────────────────────────

export function useOnboardingTokens() {
  return useQuery({
    queryKey: ["onboarding", "tokens"],
    queryFn: () => api.onboarding.listTokens(),
  });
}

export function useOnboardingByToken(token: string) {
  return useQuery({
    queryKey: ["onboarding", "by-token", token],
    queryFn: () => api.onboarding.getByToken(token),
    enabled: !!token,
  });
}

export function useRegisterClient() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.onboarding.registerClient(data),
  });
}

// ── Intake Forms ─────────────────────────────────────────────────────────────

export function useIntakeFormResponses(clientId: string) {
  return useQuery({
    queryKey: ["intake", "responses", clientId],
    queryFn: () => api.intakeForm.listResponses(clientId),
    enabled: !!clientId,
  });
}

export function usePublicIntakeForm(accessToken: string) {
  return useQuery({
    queryKey: ["intake", "public", accessToken],
    queryFn: () => api.intakeForm.getPublicForm(accessToken),
    enabled: !!accessToken,
  });
}

export function useSubmitIntakeForm() {
  return useMutation({
    mutationFn: ({
      accessToken,
      ...data
    }: { accessToken: string } & Record<string, unknown>) =>
      api.intakeForm.submit(accessToken, data),
  });
}

// ── Client Portal ────────────────────────────────────────────────────────────

export function usePortalMe() {
  return useQuery({
    queryKey: ["portal", "me"],
    queryFn: () => api.clientPortal.me(),
  });
}

export function usePortalUpcomingSessions() {
  return useQuery({
    queryKey: ["portal", "sessions", "upcoming"],
    queryFn: () => api.clientPortal.upcomingSessions(),
  });
}

export function usePortalPastSessions(clientId: string, params?: {
  offset?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["portal", "sessions", "past", clientId, params],
    queryFn: () => api.clientPortal.pastSessions(clientId, params),
    enabled: !!clientId,
  });
}

export function usePortalPendingIntakeForms() {
  return useQuery({
    queryKey: ["portal", "intake-forms", "pending"],
    queryFn: () => api.clientPortal.pendingIntakeForms(),
  });
}

export function usePortalCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.clientPortal.cancelSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal"] }),
  });
}
