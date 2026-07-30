import { getSafeSession } from './authSession';

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
    throw new ApiError(
      response.status,
      data?.error || `API error: ${response.statusText}`,
    );
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
  },

  // Admin endpoints
  admin: {
    analytics: () => request('/admin/analytics'),
    applications: (params?: string) => request(`/admin/applications${params ? `?${params}` : ''}`),
    assign: (data: any) =>
      request('/admin/assign', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    credentials: () => request('/admin/credentials'),
    reviewers: () => request('/admin/reviewers'),
  },

  // Public endpoints
  verify: (credentialId: string) => request(`/verify/${credentialId}`),
};
