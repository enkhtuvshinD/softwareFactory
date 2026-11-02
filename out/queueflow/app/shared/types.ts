export type Role = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  counterNumber: number | null;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  openTime: string;
  closeTime: string;
  counterCount: number;
  serviceIds: string[];
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  durationMinutes: number;
  category: string;
  isActive: boolean;
}

export type TicketStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'no_show';
export type TicketType = 'walk_in' | 'appointment';

export interface Ticket {
  id: string;
  ticketNumber: string;
  branchId: string;
  serviceId: string;
  customerId: string | null;
  customerName: string;
  type: TicketType;
  businessDate: string;
  sequence: number;
  status: TicketStatus;
  createdAt: string;
  calledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  counterNumber: number | null;
  staffId: string | null;
  appointmentId: string | null;
}

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'converted';

export interface Appointment {
  id: string;
  customerId: string;
  branchId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  counterNumber: number;
  staffId: string | null;
  status: AppointmentStatus;
  ticketId: string | null;
  createdAt: string;
}

export interface ClockState {
  anchorIso: string;
  realStartMs?: number;
  advancedMinutes?: number;
}

export interface Db {
  clock: ClockState;
  users: User[];
  branches: Branch[];
  services: Service[];
  tickets: Ticket[];
  appointments: Appointment[];
}

export interface TicketView extends Ticket {
  position: number | null;
  estimatedWaitMinutes: number | null;
  branchName: string;
  serviceName: string;
  staffName: string | null;
}

export interface AppointmentView extends Appointment {
  branchName: string;
  serviceName: string;
}

export interface BranchStaffEntry {
  id: string;
  name: string;
  counterNumber: number | null;
}

export interface BranchView extends Branch {
  staff: BranchStaffEntry[];
  waitingCount: number;
}

export interface ClockView {
  now: string;
  businessDate: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface StaffDashboard {
  branchId: string;
  branchName: string;
  counterNumber: number | null;
  current: TicketView | null;
  waitingCount: number;
  next: TicketView | null;
  waiting: TicketView[];
  completedToday: number;
  avgServiceMinutes: number | null;
}

export interface TicketSummary {
  total: number;
  waiting: number;
  called: number;
  serving: number;
  completed: number;
  cancelled: number;
  noShow: number;
  avgWaitMinutes: number | null;
  avgServiceMinutes: number | null;
}

export interface BranchStats {
  branchId: string;
  branchName: string;
  completed: number;
  waiting: number;
  cancelled: number;
  avgWaitMinutes: number | null;
  avgServiceMinutes: number | null;
}

export interface AdminStats {
  businessDate: string;
  overall: TicketSummary;
  branches: BranchStats[];
}

export interface DisplayTicket {
  id: string;
  ticketNumber: string;
  counterNumber: number | null;
  status: TicketStatus;
}

export interface DisplayView {
  branchName: string;
  nowCalling: DisplayTicket[];
  upNext: DisplayTicket[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export interface BranchInput {
  name: string;
  code: string;
  address: string;
  openTime: string;
  closeTime: string;
  counterCount: number;
  serviceIds: string[];
  isActive: boolean;
}

export interface ServiceInput {
  name: string;
  code: string;
  description: string;
  durationMinutes: number;
  category: string;
  isActive: boolean;
}

export interface StaffInput {
  name: string;
  email: string;
  branchId: string;
  counterNumber: number | null;
}
