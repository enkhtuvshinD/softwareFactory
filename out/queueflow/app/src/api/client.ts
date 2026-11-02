import type {
  AdminStats,
  AppointmentView,
  BranchInput,
  BranchView,
  ClockView,
  DisplayView,
  Service,
  ServiceInput,
  Slot,
  StaffDashboard,
  StaffInput,
  TicketView,
  User,
} from '../../shared/types';

export const USER_STORAGE_KEY = 'queueflow.userId';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fields: Record<string, string>,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const userId = localStorage.getItem(USER_STORAGE_KEY);
  if (userId) headers['X-User-Id'] = userId;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server. Check your connection and retry.', {});
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null)?.error;
    throw new ApiError(error?.code ?? 'ERROR', error?.message ?? 'Request failed', error?.fields ?? {});
  }
  return payload as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown = {}) => request<T>('POST', path, body);
const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body);

export const api = {
  users: () => get<User[]>('/users'),
  clock: () => get<ClockView>('/clock'),
  advanceClock: (minutes: number) => post<ClockView>('/clock/advance', { minutes }),
  resetClock: () => post<ClockView>('/clock/reset'),
  resetDemo: () => post<{ ok: boolean }>('/reset'),
  branches: () => get<BranchView[]>('/branches'),
  createBranch: (input: BranchInput) => post<BranchView>('/branches', input),
  updateBranch: (id: string, input: BranchInput) => put<BranchView>(`/branches/${id}`, input),
  services: () => get<Service[]>('/services'),
  createService: (input: ServiceInput) => post<Service>('/services', input),
  updateService: (id: string, input: Partial<ServiceInput>) => put<Service>(`/services/${id}`, input),
  staff: () => get<User[]>('/staff'),
  createStaff: (input: StaffInput) => post<User>('/staff', input),
  updateStaff: (id: string, input: StaffInput) => put<User>(`/staff/${id}`, input),
  createTicket: (branchId: string, serviceId: string) => post<TicketView>('/tickets', { branchId, serviceId }),
  myTickets: () => get<TicketView[]>('/tickets/mine'),
  branchTickets: (branchId: string) => get<TicketView[]>(`/tickets?branchId=${encodeURIComponent(branchId)}`),
  allTickets: () => get<TicketView[]>('/tickets'),
  ticketAction: (id: string, action: 'start' | 'complete' | 'no-show' | 'cancel') => post<TicketView>(`/tickets/${id}/${action}`),
  callNext: () => post<TicketView>('/queue/call-next'),
  staffDashboard: () => get<StaffDashboard>('/staff/dashboard'),
  slots: (branchId: string, serviceId: string, date: string) =>
    get<Slot[]>(`/slots?branchId=${encodeURIComponent(branchId)}&serviceId=${encodeURIComponent(serviceId)}&date=${date}`),
  bookAppointment: (branchId: string, serviceId: string, date: string, startTime: string) =>
    post<AppointmentView>('/appointments', { branchId, serviceId, date, startTime }),
  myAppointments: () => get<AppointmentView[]>('/appointments/mine'),
  cancelAppointment: (id: string) => post<AppointmentView>(`/appointments/${id}/cancel`),
  adminStats: () => get<AdminStats>('/admin/stats'),
  display: (branchId: string) => get<DisplayView>(`/display/${encodeURIComponent(branchId)}`),
};
