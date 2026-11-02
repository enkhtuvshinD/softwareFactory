import { readDb } from '../db';
import { fail } from '../http';
import { waitingTickets } from '../../shared/queue';
import { averageServiceMinutes, averageWaitMinutes, summarizeTickets } from '../../shared/stats';
import type { AdminStats, Db, DisplayView, StaffDashboard, User } from '../../shared/types';
import { currentClock } from './clock';
import { toTicketView } from './ticketViews';

const DISPLAY_UP_NEXT_COUNT = 8;

export function adminStats(): AdminStats {
  const db = readDb<Db>();
  const { businessDate } = currentClock(db);
  const today = db.tickets.filter((t) => t.businessDate === businessDate);
  return {
    businessDate,
    overall: summarizeTickets(db.tickets, businessDate),
    branches: db.branches.map((branch) => {
      const branchTickets = today.filter((t) => t.branchId === branch.id);
      const summary = summarizeTickets(branchTickets, businessDate);
      return {
        branchId: branch.id,
        branchName: branch.name,
        completed: summary.completed,
        waiting: summary.waiting,
        cancelled: summary.cancelled,
        avgWaitMinutes: averageWaitMinutes(branchTickets),
        avgServiceMinutes: averageServiceMinutes(branchTickets),
      };
    }),
  };
}

export function staffDashboard(staff: User): StaffDashboard {
  const db = readDb<Db>();
  const branch = db.branches.find((b) => b.id === staff.branchId);
  if (!branch) return fail(404, 'NOT_FOUND', 'Branch not found');
  const { businessDate } = currentClock(db);
  const current = db.tickets.find((t) => t.staffId === staff.id && (t.status === 'called' || t.status === 'serving'));
  const waiting = waitingTickets(db.tickets, branch.id).map((t) => toTicketView(db, t));
  const mineToday = db.tickets.filter((t) => t.staffId === staff.id && t.businessDate === businessDate);
  return {
    branchId: branch.id,
    branchName: branch.name,
    counterNumber: staff.counterNumber,
    current: current ? toTicketView(db, current) : null,
    waitingCount: waiting.length,
    next: waiting[0] ?? null,
    waiting,
    completedToday: mineToday.filter((t) => t.status === 'completed').length,
    avgServiceMinutes: averageServiceMinutes(mineToday),
  };
}

export function displayView(branchId: string): DisplayView {
  const db = readDb<Db>();
  const branch = db.branches.find((b) => b.id === branchId);
  if (!branch) return fail(404, 'NOT_FOUND', 'Branch not found');
  const toDisplay = (t: Db['tickets'][number]) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    counterNumber: t.counterNumber,
    status: t.status,
  });
  const nowCalling = db.tickets
    .filter((t) => t.branchId === branch.id && (t.status === 'called' || t.status === 'serving'))
    .sort((a, b) => Date.parse(b.calledAt ?? b.createdAt) - Date.parse(a.calledAt ?? a.createdAt));
  return {
    branchName: branch.name,
    nowCalling: nowCalling.map(toDisplay),
    upNext: waitingTickets(db.tickets, branch.id).slice(0, DISPLAY_UP_NEXT_COUNT).map(toDisplay),
  };
}
