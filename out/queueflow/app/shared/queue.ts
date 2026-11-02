import type { Service, Ticket, TicketStatus } from './types';

export type TicketAction = 'call' | 'start' | 'complete' | 'no_show' | 'cancel';

export const ACTIVE_STATUSES: TicketStatus[] = ['waiting', 'called', 'serving'];
export const HOLDING_COUNTER_STATUSES: TicketStatus[] = ['called', 'serving'];

const TRANSITIONS: Record<TicketAction, Partial<Record<TicketStatus, TicketStatus>>> = {
  call: { waiting: 'called' },
  start: { called: 'serving' },
  complete: { serving: 'completed' },
  no_show: { called: 'no_show' },
  cancel: { waiting: 'cancelled', called: 'cancelled', serving: 'cancelled' },
};

export function nextStatus(status: TicketStatus, action: TicketAction): TicketStatus | null {
  return TRANSITIONS[action][status] ?? null;
}

export function isActiveStatus(status: TicketStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function formatTicketNumber(branchCode: string, serviceCode: string, sequence: number): string {
  return `${branchCode}-${serviceCode}-${String(sequence).padStart(3, '0')}`;
}

export function nextSequence(tickets: Ticket[], branchId: string, serviceId: string, businessDate: string): number {
  const sequences = tickets
    .filter((t) => t.branchId === branchId && t.serviceId === serviceId && t.businessDate === businessDate)
    .map((t) => t.sequence);
  return Math.max(0, ...sequences) + 1;
}

export function compareFifo(a: Ticket, b: Ticket): number {
  const byCreated = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (byCreated !== 0) return byCreated;
  return a.id.localeCompare(b.id, 'en', { numeric: true });
}

export function waitingTickets(tickets: Ticket[], branchId: string): Ticket[] {
  return tickets.filter((t) => t.branchId === branchId && t.status === 'waiting').sort(compareFifo);
}

export interface QueueEstimate {
  position: number | null;
  estimatedWaitMinutes: number | null;
}

export function computeQueueEstimate(ticket: Ticket, tickets: Ticket[], services: Service[]): QueueEstimate {
  if (ticket.status !== 'waiting') return { position: null, estimatedWaitMinutes: null };
  const queue = waitingTickets(tickets, ticket.branchId);
  const ahead = queue.slice(0, queue.findIndex((t) => t.id === ticket.id));
  const durationOf = (t: Ticket) => services.find((s) => s.id === t.serviceId)?.durationMinutes ?? 0;
  return {
    position: ahead.length + 1,
    estimatedWaitMinutes: ahead.reduce((sum, t) => sum + durationOf(t), 0),
  };
}
