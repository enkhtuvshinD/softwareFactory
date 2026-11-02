import { minutesBetween } from './time';
import type { Ticket, TicketSummary } from './types';

export function roundHalfUp(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.floor(value * factor + 0.5 + 1e-9) / factor;
}

function averageRounded(values: number[]): number | null {
  if (values.length === 0) return null;
  return roundHalfUp(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function averageWaitMinutes(tickets: Ticket[]): number | null {
  const waits = tickets
    .filter((t) => t.startedAt !== null)
    .map((t) => minutesBetween(t.createdAt, t.startedAt as string));
  return averageRounded(waits);
}

export function averageServiceMinutes(tickets: Ticket[]): number | null {
  const durations = tickets
    .filter((t) => t.status === 'completed' && t.startedAt !== null && t.endedAt !== null)
    .map((t) => minutesBetween(t.startedAt as string, t.endedAt as string));
  return averageRounded(durations);
}

export function summarizeTickets(tickets: Ticket[], businessDate: string): TicketSummary {
  const today = tickets.filter((t) => t.businessDate === businessDate);
  const count = (status: Ticket['status']) => today.filter((t) => t.status === status).length;
  return {
    total: today.length,
    waiting: count('waiting'),
    called: count('called'),
    serving: count('serving'),
    completed: count('completed'),
    cancelled: count('cancelled'),
    noShow: count('no_show'),
    avgWaitMinutes: averageWaitMinutes(today),
    avgServiceMinutes: averageServiceMinutes(today),
  };
}
