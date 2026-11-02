import { readDb, writeDb } from '../db';
import { fail } from '../http';
import { ACTIVE_STATUSES, HOLDING_COUNTER_STATUSES, formatTicketNumber, nextSequence, nextStatus, waitingTickets } from '../../shared/queue';
import type { TicketAction } from '../../shared/queue';
import { isWithinOperatingHours, isoToDate } from '../../shared/time';
import type { Db, Ticket, TicketView, User } from '../../shared/types';
import { appNowIso, currentClock } from './clock';
import { newestFirst, nextEntityId, toTicketView } from './ticketViews';

export function createTicketRecord(db: Db, fields: Pick<Ticket, 'branchId' | 'serviceId' | 'customerId' | 'customerName' | 'type' | 'createdAt' | 'appointmentId'>): Ticket {
  const branch = db.branches.find((b) => b.id === fields.branchId);
  const service = db.services.find((s) => s.id === fields.serviceId);
  if (!branch || !service) return fail(404, 'NOT_FOUND', 'Branch or service not found');
  const businessDate = isoToDate(fields.createdAt);
  const sequence = nextSequence(db.tickets, branch.id, service.id, businessDate);
  const ticket: Ticket = {
    ...fields,
    id: nextEntityId('tkt', db.tickets.map((t) => t.id)),
    ticketNumber: formatTicketNumber(branch.code, service.code, sequence),
    businessDate,
    sequence,
    status: 'waiting',
    calledAt: null,
    startedAt: null,
    endedAt: null,
    counterNumber: null,
    staffId: null,
  };
  db.tickets.push(ticket);
  return ticket;
}

export function createWalkInTicket(customer: User, branchId: unknown, serviceId: unknown): TicketView {
  if (typeof branchId !== 'string' || typeof serviceId !== 'string') {
    return fail(400, 'VALIDATION_ERROR', 'Branch and service are required', {
      ...(typeof branchId === 'string' ? {} : { branchId: 'Select a branch' }),
      ...(typeof serviceId === 'string' ? {} : { serviceId: 'Select a service' }),
    });
  }
  const db = readDb<Db>();
  const branch = db.branches.find((b) => b.id === branchId);
  const service = db.services.find((s) => s.id === serviceId);
  if (!branch) return fail(404, 'NOT_FOUND', 'Branch not found');
  if (!service) return fail(404, 'NOT_FOUND', 'Service not found');
  if (!branch.isActive) return fail(409, 'BRANCH_INACTIVE', `${branch.name} is not accepting customers`);
  if (!service.isActive || !branch.serviceIds.includes(service.id)) {
    return fail(409, 'SERVICE_UNAVAILABLE', `${service.name} is not available at ${branch.name}`);
  }
  const now = appNowIso(db);
  if (!isWithinOperatingHours(branch.openTime, branch.closeTime, now)) {
    return fail(409, 'BRANCH_CLOSED', `${branch.name} is closed. Opening hours are ${branch.openTime}–${branch.closeTime} UTC`);
  }
  const duplicate = db.tickets.some(
    (t) => t.customerId === customer.id && t.branchId === branch.id && t.serviceId === service.id && ACTIVE_STATUSES.includes(t.status),
  );
  if (duplicate) {
    return fail(409, 'DUPLICATE_TICKET', `You already have an active ticket for ${service.name} at ${branch.name}`);
  }
  const ticket = createTicketRecord(db, {
    branchId: branch.id,
    serviceId: service.id,
    customerId: customer.id,
    customerName: customer.name,
    type: 'walk_in',
    createdAt: now,
    appointmentId: null,
  });
  writeDb(db);
  return toTicketView(db, ticket);
}

export function listCustomerTickets(customer: User): TicketView[] {
  const db = readDb<Db>();
  return db.tickets
    .filter((t) => t.customerId === customer.id)
    .sort(newestFirst)
    .map((t) => toTicketView(db, t));
}

export function listBranchTickets(user: User, branchId: unknown, date: unknown): TicketView[] {
  const db = readDb<Db>();
  const scopedBranchId = user.role === 'staff' ? user.branchId : typeof branchId === 'string' && branchId !== '' ? branchId : null;
  if (user.role === 'staff' && typeof branchId === 'string' && branchId !== '' && branchId !== user.branchId) {
    return fail(403, 'FORBIDDEN', 'You can only view tickets of your own branch');
  }
  const businessDate = typeof date === 'string' && date !== '' ? date : currentClock(db).businessDate;
  return db.tickets
    .filter((t) => t.businessDate === businessDate && (scopedBranchId === null || t.branchId === scopedBranchId))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((t) => toTicketView(db, t));
}

export function callNext(staff: User): TicketView {
  const db = readDb<Db>();
  if (staff.counterNumber === null || staff.branchId === null) {
    return fail(409, 'NO_COUNTER', 'No counter assigned — ask an admin.');
  }
  const busy = db.tickets.some((t) => t.staffId === staff.id && HOLDING_COUNTER_STATUSES.includes(t.status));
  if (busy) return fail(409, 'STAFF_BUSY', 'Finish the current customer before calling next');
  const [first] = waitingTickets(db.tickets, staff.branchId);
  if (!first) return fail(409, 'QUEUE_EMPTY', 'No waiting customers');
  first.status = nextStatus(first.status, 'call') ?? first.status;
  first.calledAt = appNowIso(db);
  first.staffId = staff.id;
  first.counterNumber = staff.counterNumber;
  writeDb(db);
  return toTicketView(db, first);
}

function assertCanAct(user: User, ticket: Ticket, action: TicketAction) {
  if (action === 'cancel' && user.role === 'customer') {
    if (ticket.customerId !== user.id) fail(403, 'FORBIDDEN', 'You can only cancel your own tickets');
    return;
  }
  if (user.role !== 'staff') fail(403, 'FORBIDDEN', 'You do not have permission to do this');
  if (ticket.branchId !== user.branchId) fail(403, 'FORBIDDEN', 'This ticket belongs to another branch');
}

export function transitionTicket(user: User, ticketId: string, action: TicketAction): TicketView {
  const db = readDb<Db>();
  const ticket = db.tickets.find((t) => t.id === ticketId);
  if (!ticket) return fail(404, 'NOT_FOUND', 'Ticket not found');
  assertCanAct(user, ticket, action);
  const target = nextStatus(ticket.status, action);
  const customerCancellingServing = user.role === 'customer' && ticket.status === 'serving';
  if (!target || customerCancellingServing) {
    return fail(409, 'INVALID_TRANSITION', `A ${ticket.status.replace('_', '-')} ticket cannot be changed this way`);
  }
  const needsAssignedStaff = action === 'start' || action === 'complete' || action === 'no_show';
  if (needsAssignedStaff && ticket.staffId !== user.id) {
    return fail(403, 'FORBIDDEN', 'Only the staff member handling this ticket can do this');
  }
  const now = appNowIso(db);
  ticket.status = target;
  if (target === 'serving') ticket.startedAt = now;
  if (target === 'completed' || target === 'no_show' || target === 'cancelled') ticket.endedAt = now;
  writeDb(db);
  return toTicketView(db, ticket);
}
