import { readDb, writeDb } from '../db';
import { combineDateTime } from '../../shared/time';
import type { Db } from '../../shared/types';
import { appNowIso, ensureClockStarted } from './clock';
import { createTicketRecord } from './tickets';

export function convertDueAppointments() {
  ensureClockStarted();
  const db = readDb<Db>();
  const now = Date.parse(appNowIso(db));
  const due = db.appointments
    .filter((a) => a.status === 'scheduled' && Date.parse(combineDateTime(a.date, a.startTime)) <= now)
    .sort((a, b) => combineDateTime(a.date, a.startTime).localeCompare(combineDateTime(b.date, b.startTime)));
  if (due.length === 0) return;
  for (const appointment of due) {
    const customer = db.users.find((u) => u.id === appointment.customerId);
    const ticket = createTicketRecord(db, {
      branchId: appointment.branchId,
      serviceId: appointment.serviceId,
      customerId: appointment.customerId,
      customerName: customer?.name ?? 'Customer',
      type: 'appointment',
      createdAt: combineDateTime(appointment.date, appointment.startTime),
      appointmentId: appointment.id,
    });
    appointment.status = 'converted';
    appointment.ticketId = ticket.id;
  }
  writeDb(db);
}
