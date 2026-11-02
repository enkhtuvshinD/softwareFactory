import { computeQueueEstimate } from '../../shared/queue';
import type { AppointmentView, Appointment, Db, Ticket, TicketView } from '../../shared/types';

export function toTicketView(db: Db, ticket: Ticket): TicketView {
  const estimate = computeQueueEstimate(ticket, db.tickets, db.services);
  return {
    ...ticket,
    ...estimate,
    branchName: db.branches.find((b) => b.id === ticket.branchId)?.name ?? '',
    serviceName: db.services.find((s) => s.id === ticket.serviceId)?.name ?? '',
    staffName: db.users.find((u) => u.id === ticket.staffId)?.name ?? null,
  };
}

export function toAppointmentView(db: Db, appointment: Appointment): AppointmentView {
  return {
    ...appointment,
    branchName: db.branches.find((b) => b.id === appointment.branchId)?.name ?? '',
    serviceName: db.services.find((s) => s.id === appointment.serviceId)?.name ?? '',
  };
}

export function newestFirst(a: { createdAt: string; id: string }, b: { createdAt: string; id: string }): number {
  const byCreated = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  return byCreated !== 0 ? byCreated : b.id.localeCompare(a.id, 'en', { numeric: true });
}

export function nextEntityId(prefix: string, existingIds: string[]): string {
  const numbers = existingIds.map((id) => Number(id.slice(prefix.length + 1))).filter(Number.isFinite);
  return `${prefix}_${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
}
