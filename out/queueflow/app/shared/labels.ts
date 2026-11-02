import { isoToDate, isoToTime } from './time';
import type { AppointmentStatus, Role, TicketStatus } from './types';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  waiting: 'Waiting',
  called: 'Called',
  serving: 'Serving',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-Show',
};

export const TICKET_STATUS_ICONS: Record<TicketStatus, string> = {
  waiting: '◔',
  called: '▲',
  serving: '●',
  completed: '✓',
  cancelled: '✕',
  no_show: '⊘',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
  converted: 'Converted',
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  staff: 'Staff',
  admin: 'Admin',
};

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function formatAverage(minutes: number | null): string {
  return minutes === null ? '—' : `${minutes.toFixed(1)} min`;
}

export function formatCounter(counterNumber: number | null): string {
  return counterNumber === null ? '—' : `Counter ${counterNumber}`;
}

export function formatClockTime(iso: string): string {
  return isoToTime(iso);
}

export function formatDateTime(iso: string): string {
  return `${isoToDate(iso)} ${isoToTime(iso)}`;
}
