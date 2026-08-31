import { getSafeSession } from './authSession';
import { vercelProtectionBypassHeaders } from './vercelProtectionBypass';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken(): Promise<string | null> {
  const session = await getSafeSession({ refresh: true });
  return session?.access_token ?? null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}/api/v1${endpoint}`;
  const token = await getToken();

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...vercelProtectionBypassHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = data?.error;
    const details = data?.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] } | undefined;
    let message = `API error: ${response.statusText}`;
    if (typeof err === 'string') {
      message = err;
    } else if (err && typeof err === 'object') {
      const flat = err as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      const parts = [
        ...(flat.formErrors ?? []),
        ...Object.entries(flat.fieldErrors ?? {}).flatMap(([field, msgs]) =>
          (msgs ?? []).map((m) => `${field}: ${m}`),
        ),
      ];
      if (parts.length) message = parts.join('. ');
    }
    if (details) {
      const parts = [
        ...(details.formErrors ?? []),
        ...Object.entries(details.fieldErrors ?? {}).flatMap(([field, msgs]) =>
          (msgs ?? []).map((m) => `${field}: ${m}`),
        ),
      ];
      if (parts.length) message = parts.join('. ');
    }
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const api = {
  // Auth endpoints
  auth: {
    magicLink: (email: string) =>
      request('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  // Student endpoints
  student: {
    dashboard: () => request('/student/dashboard'),
    profile: () => request('/student/profile'),
    updateProfile: (data: any) =>
      request('/student/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    applications: () => request('/student/applications'),
    createApplication: (data: any) =>
      request('/student/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    credential: (id: string) => request(`/student/credential/${id}`),
    markLinkedIn: () => request('/student/credential/linkedin', { method: 'POST' }),
    requestReschedule: (data: { application_id: string; reason: string; preferred_session_at?: string }) =>
      request('/student/reschedule', { method: 'POST', body: JSON.stringify(data) }),
    confirmSession: (data: {
      assignment_id: string;
      feedback_audio?: number;
      feedback_video?: number;
      feedback_notes?: string;
      early_end_reason?: string;
    }) => request('/student/session/confirm', { method: 'POST', body: JSON.stringify(data) }),
  },

  payments: {
    createOrder: (application_id: string) =>
      request('/payments/create-order', { method: 'POST', body: JSON.stringify({ application_id }) }),
    verify: (data: {
      application_id: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
    submitUtr: (data: { application_id: string; utr_number: string }) =>
      request('/payments/submit', { method: 'POST', body: JSON.stringify(data) }),
  },

  video: {
    session: (assignmentId: string, asRole?: 'reviewer' | 'student') => {
      const q = asRole ? `?as=${asRole}` : '';
      return request(`/video/session/${assignmentId}${q}`);
    },
  },

  session: {
    saveNotes: (data: { assignment_id: string; notes: string }, asRole: 'reviewer' | 'student') =>
      request(`/session/notes?as=${asRole}`, { method: 'POST', body: JSON.stringify(data) }),
    recordJoin: (assignment_id: string, asRole: 'reviewer' | 'student') =>
      request(`/session/join?as=${asRole}`, { method: 'POST', body: JSON.stringify({ assignment_id }) }),
  },

  // Generator endpoints
  generator: {
    generate: (data: any) =>
      request('/generator/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    save: (data: any) =>
      request('/generator/save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    history: () => request('/generator/history'),
    activate: (id: string) =>
      request(`/generator/activate/${id}`, {
        method: 'PUT',
      }),
  },

  // Reviewer endpoints
  reviewer: {
    assignments: () => request('/reviewer/assignments'),
    submission: (id: string) => request(`/reviewer/submission/${id}`),
    submitScore: (data: any) =>
      request('/reviewer/scores', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    payments: () => request('/reviewer/payments'),
    profile: () => request('/reviewer/profile'),
    updateProfile: (data: Record<string, unknown>) =>
      request('/reviewer/profile', { method: 'PUT', body: JSON.stringify(data) }),
    workflowTasks: () => request('/reviewer/workflow/tasks'),
    workflowAction: (data: Record<string, unknown>) =>
      request('/reviewer/workflow', { method: 'POST', body: JSON.stringify(data) }),
    saveSessionDraft: (data: { assignment_id: string; draft: string }) =>
      request('/reviewer/session/draft', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Admin endpoints
  admin: {
    analytics: () => request('/admin/analytics'),
    applications: (params?: string) => request(`/admin/applications${params ? `?${params}` : ''}`),
    application: (id: string) => request(`/admin/applications/${id}`),
    submitScore: (data: { application_id: string; total_score: number; feedback?: string }) =>
      request('/admin/scores', { method: 'POST', body: JSON.stringify(data) }),
    assign: (data: { application_id: string; reviewer_id: string }) =>
      request('/admin/assign', {
        method: 'POST',
        body: JSON.stringify({ ...data, confirm: true }),
      }),
    approveSession: (assignment_id: string) =>
      request('/admin/assignments/approve-session', {
        method: 'POST',
        body: JSON.stringify({ assignment_id, confirm: true }),
      }),
    sessionReminder: (assignment_id: string) =>
      request('/admin/assignments/session-reminder', {
        method: 'POST',
        body: JSON.stringify({ assignment_id, confirm: true }),
      }),
    rescheduleSession: (data: {
      assignment_id: string;
      new_session_at: string;
      note?: string;
    }) =>
      request('/admin/assignments/reschedule-session', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    scheduledSessions: (params?: { from?: string; to?: string }) => {
      const q = new URLSearchParams();
      if (params?.from) q.set('from', params.from);
      if (params?.to) q.set('to', params.to);
      const qs = q.toString();
      return request(`/admin/scheduled-sessions${qs ? `?${qs}` : ''}`);
    },
    reviewScore: (data: { application_id: string; action: 'approve' | 'request_revision' | 'under_review'; notes?: string }) =>
      request('/admin/scores/review', {
        method: 'POST',
        body: JSON.stringify({ ...data, confirm: true }),
      }),
    credentials: () => request('/admin/credentials'),
    reviewers: () => request('/admin/reviewers'),
    confirmPayment: (application_id: string) =>
      request('/admin/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ application_id }),
      }),
    issueCredential: (application_id: string, opts?: { confirm_reviewed?: boolean; override_failed?: boolean }) =>
      request('/admin/credentials/issue', {
        method: 'POST',
        body: JSON.stringify({
          application_id,
          confirm_reviewed: true,
          ...(opts?.override_failed ? { override_failed: true } : {}),
        }),
      }),
    resetApplication: (application_id: string, step: 'payment' | 'assignment' | 'score' | 'credential' | 'full') =>
      request('/admin/application-reset', {
        method: 'POST',
        body: JSON.stringify({ application_id, step, confirm: true }),
      }),
    userProfile: (userId: string) => request(`/admin/users/${userId}`),
    waitlist: (params?: string) =>
      request(`/admin/waitlist${params ? `?${params}` : ''}`),
    updateWaitlist: (id: string, data: { status?: string; admin_notes?: string }) =>
      request(`/admin/waitlist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    sendWaitlistEmail: (data: {
      entry_ids?: string[];
      status?: 'pending' | 'invited' | 'converted' | 'rejected';
      template: 'update' | 'launch';
      subject?: string;
      message?: string;
      mark_invited?: boolean;
      send_to_all?: boolean;
    }) =>
      request('/admin/waitlist/send-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  waitlist: {
    submit: (data: {
      full_name: string;
      email: string;
      phone: string;
      domains: string[];
      degree: string;
      referral_source: string;
      motivation: string;
    }) =>
      request('/waitlist/submit', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Public endpoints
  verify: (credentialId: string) => request(`/verify/${credentialId}`),
};
