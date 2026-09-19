// Typed API Client for ServiceAgent
import {
  UserProfile,
  ExecutorProfile,
  AdminProfile,
  Task,
  DispatchAttempt,
  Appointment,
  Reminder,
  UserMemory,
  AuditEvent,
  SystemHealthStatus,
  KnowledgeDocument,
  AgentMessage,
  Invoice,
  DirectMessage,
  PlaceResult,
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit, retries = 2): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return fetchJson<T>(url, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (email: string, role: string) =>
    fetchJson<{ token: string; user?: UserProfile; executor?: ExecutorProfile; admin?: AdminProfile; role: string }>(
      '/api/v1/auth/login',
      { method: 'POST', body: JSON.stringify({ email, role }) }
    ),

  register: (data: any) =>
    fetchJson<{ token: string; user?: UserProfile; executor?: ExecutorProfile; role: string }>(
      '/api/v1/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  // Sathi Agent
  sendChatMessage: (sessionId: string, userId: string, text: string, isVoice = false) =>
    fetchJson<AgentMessage>('/api/v1/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, userId, text, isVoice }),
    }),

  getSession: (sessionId: string) =>
    fetchJson<{ sessionId: string; messages: AgentMessage[] }>(`/api/v1/agent/session/${sessionId}`),

  // Tasks
  getTasks: (params?: { userId?: string; executorId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.executorId) query.set('executorId', params.executorId);
    if (params?.status) query.set('status', params.status);
    return fetchJson<Task[]>(`/api/v1/tasks?${query.toString()}`);
  },

  getTask: (id: string) => fetchJson<Task>(`/api/v1/tasks/${id}`),

  confirmTask: (id: string) =>
    fetchJson<{ task: Task; dispatch: any }>(`/api/v1/tasks/${id}/confirm`, { method: 'POST' }),

  cancelTask: (id: string, reason?: string) =>
    fetchJson<{ success: boolean; task: Task }>(`/api/v1/tasks/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  reassignTask: (id: string, reason?: string) =>
    fetchJson<{ success: boolean; task: Task; nextAttempt?: DispatchAttempt }>(`/api/v1/tasks/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  transitionTask: (id: string, targetStatus: string, executorId?: string, verificationCode?: string) =>
    fetchJson<{ success: boolean; task: Task }>(`/api/v1/tasks/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus, executorId, verificationCode }),
    }),

  // Dispatch
  getDispatchAttempt: (id: string) => fetchJson<DispatchAttempt>(`/api/v1/dispatch/${id}`),

  respondToOffer: (attemptId: string, executorId: string, response: 'ACCEPT' | 'REJECT' | 'TIMEOUT') =>
    fetchJson<{ success: boolean; task?: Task; nextAttempt?: DispatchAttempt; error?: string }>(
      '/api/v1/dispatch/response',
      {
        method: 'POST',
        body: JSON.stringify({ attemptId, executorId, response }),
      }
    ),

  // Executors
  getExecutors: () => fetchJson<ExecutorProfile[]>('/api/v1/executors'),
  getExecutor: (id: string) => fetchJson<ExecutorProfile>(`/api/v1/executors/${id}`),

  updateExecutorProfile: (id: string, data: Partial<ExecutorProfile>) =>
    fetchJson<{ success: boolean; executor: ExecutorProfile }>(`/api/v1/executors/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Users & Security Verification
  getUser: (id: string) => fetchJson<UserProfile>(`/api/v1/users/${id}`),
  updateUserProfile: (id: string, data: Partial<UserProfile>) =>
    fetchJson<{ success: boolean; user: UserProfile }>(`/api/v1/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setExecutorAvailability: (id: string, isAvailable: boolean) =>
    fetchJson<{ success: boolean; isAvailable: boolean }>(`/api/v1/executors/${id}/availability`, {
      method: 'POST',
      body: JSON.stringify({ isAvailable }),
    }),

  submitKyc: (id: string, data: { panNumber: string; aadhaarLast4: string; certifications?: string[] }) =>
    fetchJson<{ success: boolean; executor: ExecutorProfile }>(`/api/v1/executors/${id}/kyc`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  startVideoVerification: (id: string) =>
    fetchJson<{ success: boolean; status: string; data: any; error?: string }>(
      `/api/v1/executors/${id}/video-verify`,
      { method: 'POST' }
    ),

  // Appointments, Reminders, Memories
  getAppointments: (userId?: string) =>
    fetchJson<Appointment[]>(`/api/v1/appointments${userId ? `?userId=${userId}` : ''}`),

  createAppointment: (data: Partial<Appointment>) =>
    fetchJson<Appointment>('/api/v1/appointments', { method: 'POST', body: JSON.stringify(data) }),

  getReminders: (userId?: string) =>
    fetchJson<Reminder[]>(`/api/v1/reminders${userId ? `?userId=${userId}` : ''}`),

  createReminder: (data: Partial<Reminder>) =>
    fetchJson<Reminder>('/api/v1/reminders', { method: 'POST', body: JSON.stringify(data) }),

  getMemories: (userId?: string) =>
    fetchJson<UserMemory[]>(`/api/v1/memories${userId ? `?userId=${userId}` : ''}`),

  // Payments & Invoices
  createPayment: (taskId: string, amount?: number) =>
    fetchJson<{ orderId: string; amount: number; currency: string }>('/api/v1/payments/create', {
      method: 'POST',
      body: JSON.stringify({ taskId, amount }),
    }),

  verifyPayment: (data: { taskId: string; paymentId?: string; simulatedSuccess?: boolean }) =>
    fetchJson<{ verified: boolean; transactionId: string; isDemo?: boolean }>('/api/v1/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completePaymentAndInvoice: (data: {
    taskId: string;
    paymentMode: 'CASH' | 'UPI';
    amount?: number;
    upiTransactionRef?: string;
  }) =>
    fetchJson<{ success: boolean; invoice: Invoice; task: Task; message: string }>(
      '/api/v1/payments/complete-and-invoice',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getInvoices: (params?: { userId?: string; executorId?: string; taskId?: string }) => {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.executorId) query.set('executorId', params.executorId);
    if (params?.taskId) query.set('taskId', params.taskId);
    return fetchJson<Invoice[]>(`/api/v1/invoices?${query.toString()}`);
  },

  getInvoice: (id: string) => fetchJson<Invoice>(`/api/v1/invoices/${id}`),
  getInvoiceById: (id: string) => fetchJson<Invoice>(`/api/v1/invoices/${id}`),

  // Mutual Task Direct Messaging
  getTaskMessages: (taskId: string) => fetchJson<DirectMessage[]>(`/api/v1/tasks/${taskId}/messages`),

  sendTaskMessage: (
    taskId: string,
    data: { senderId: string; senderName: string; senderRole: 'USER' | 'EXECUTOR'; text: string }
  ) =>
    fetchJson<DirectMessage>(`/api/v1/tasks/${taskId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminStats: () =>
    fetchJson<{
      activeUsers: number;
      totalExecutors: number;
      activeExecutors: number;
      availableExecutors: number;
      pendingKyc: number;
      activeTasks: number;
      tasksSearching: number;
      completedTasks: number;
      dispatchAttemptsCount: number;
      totalGrossVolume: number;
      totalPlatformRevenue: number;
      totalExecutorPayouts: number;
      invoicesCount: number;
    }>('/api/v1/admin/stats'),

  getAdminUsers: () => fetchJson<UserProfile[]>('/api/v1/admin/users'),
  getAdminExecutors: () => fetchJson<ExecutorProfile[]>('/api/v1/admin/executors'),

  decideKyc: (id: string, decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE', notes?: string) =>
    fetchJson<{ success: boolean; executor: ExecutorProfile }>(`/api/v1/admin/executors/${id}/kyc-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),

  getAdminTasks: () => fetchJson<Task[]>('/api/v1/admin/tasks'),
  getAdminDispatchAttempts: () => fetchJson<DispatchAttempt[]>('/api/v1/admin/dispatch'),
  getAdminAuditLogs: () => fetchJson<AuditEvent[]>('/api/v1/admin/audit'),

  // Google Places API Integration
  searchPlaces: (query: string, location?: string, category?: string) => {
    const params = new URLSearchParams({ query });
    if (location) params.set('location', location);
    if (category) params.set('category', category);
    return fetchJson<{ query: string; count: number; places: PlaceResult[] }>(`/api/v1/places/search?${params.toString()}`);
  },

  getNearbyAmenities: (category = 'ALL', location?: string, radiusMeters = 5000) => {
    const params = new URLSearchParams({ category, radiusMeters: String(radiusMeters) });
    if (location) params.set('location', location);
    return fetchJson<{ category: string; count: number; places: PlaceResult[] }>(`/api/v1/places/nearby?${params.toString()}`);
  },

  // System
  getSystemStatus: () => fetchJson<SystemHealthStatus>('/api/v1/system/status'),
  getKnowledge: () => fetchJson<KnowledgeDocument[]>('/api/v1/system/knowledge'),
};
