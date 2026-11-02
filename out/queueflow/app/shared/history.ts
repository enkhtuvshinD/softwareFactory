import { isActiveStatus } from './queue';
import { combineDateTime } from './time';
import type { AppointmentStatus, AppointmentView, TicketStatus, TicketView } from './types';

export type HistoryBadge =
  | { kind: 'ticket'; status: TicketStatus }
  | { kind: 'appointment'; status: AppointmentStatus };

export interface HistoryEntry {
  id: string;
  ticketNumber: string | null;
  badge: HistoryBadge;
  branchName: string;
  serviceName: string;
  time: string;
}

export function buildHistory(tickets: TicketView[], appointments: AppointmentView[]): HistoryEntry[] {
  const ticketEntries = tickets
    .filter((t) => !isActiveStatus(t.status))
    .map<HistoryEntry>((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      badge: { kind: 'ticket', status: t.status },
      branchName: t.branchName,
      serviceName: t.serviceName,
      time: t.endedAt ?? t.createdAt,
    }));
  const appointmentEntries = appointments
    .filter((a) => a.status !== 'scheduled')
    .map<HistoryEntry>((a) => ({
      id: a.id,
      ticketNumber: null,
      badge: { kind: 'appointment', status: a.status },
      branchName: a.branchName,
      serviceName: a.serviceName,
      time: combineDateTime(a.date, a.startTime),
    }));
  return [...ticketEntries, ...appointmentEntries].sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
}
