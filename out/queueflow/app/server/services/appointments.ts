import { readDb, writeDb } from '../db';
import { fail } from '../http';
import { buildSlots, findFreeCounter, generateSlotTimes, hasOverlappingAppointment } from '../../shared/slots';
import { MAX_BOOKING_DAYS_AHEAD, addDaysToDate, combineDateTime, isValidDate, isValidTime } from '../../shared/time';
import type { Appointment, AppointmentView, Branch, Db, Service, Slot, User } from '../../shared/types';
import { appNowIso, currentClock } from './clock';
import { newestFirst, nextEntityId, toAppointmentView } from './ticketViews';

function bookableContext(db: Db, branchId: unknown, serviceId: unknown, date: unknown) {
  const fields: Record<string, string> = {};
  if (typeof branchId !== 'string') fields.branchId = 'Select a branch';
  if (typeof serviceId !== 'string') fields.serviceId = 'Select a service';
  if (!isValidDate(date)) fields.date = 'Date must be YYYY-MM-DD';
  if (Object.keys(fields).length > 0) fail(400, 'VALIDATION_ERROR', Object.values(fields)[0], fields);
  const branch = db.branches.find((b) => b.id === branchId);
  const service = db.services.find((s) => s.id === serviceId);
  if (!branch) return fail(404, 'NOT_FOUND', 'Branch not found');
  if (!service) return fail(404, 'NOT_FOUND', 'Service not found');
  if (!branch.isActive) return fail(409, 'BRANCH_INACTIVE', `${branch.name} is not accepting bookings`);
  if (!service.isActive || !branch.serviceIds.includes(service.id)) {
    return fail(409, 'SERVICE_UNAVAILABLE', `${service.name} is not available at ${branch.name}`);
  }
  const today = currentClock(db).businessDate;
  const day = date as string;
  if (day < today) return fail(400, 'PAST_DATE', 'Appointments cannot be booked in the past');
  if (day > addDaysToDate(today, MAX_BOOKING_DAYS_AHEAD)) {
    return fail(400, 'VALIDATION_ERROR', `Appointments can be booked up to ${MAX_BOOKING_DAYS_AHEAD} days ahead`, {
      date: `Choose a date up to ${MAX_BOOKING_DAYS_AHEAD} days ahead`,
    });
  }
  return { branch, service, day };
}

function staffedCounters(db: Db, branch: Branch): number[] {
  return db.users
    .filter((u) => u.role === 'staff' && u.branchId === branch.id && u.counterNumber !== null && u.counterNumber <= branch.counterCount)
    .map((u) => u.counterNumber as number);
}

function appointmentsOn(db: Db, branchId: string, date: string): Appointment[] {
  return db.appointments.filter((a) => a.branchId === branchId && a.date === date);
}

export function listSlots(branchId: unknown, serviceId: unknown, date: unknown): Slot[] {
  const db = readDb<Db>();
  const { branch, service, day } = bookableContext(db, branchId, serviceId, date);
  return buildSlots(
    branch.openTime,
    branch.closeTime,
    service.durationMinutes,
    day,
    appNowIso(db),
    staffedCounters(db, branch),
    appointmentsOn(db, branch.id, day),
  );
}

function assertOnSlotGrid(branch: Branch, service: Service, startTime: unknown): string {
  const onGrid = generateSlotTimes(branch.openTime, branch.closeTime, service.durationMinutes);
  const slot = isValidTime(startTime) ? onGrid.find((s) => s.startTime === startTime) : undefined;
  if (!slot) return fail(400, 'VALIDATION_ERROR', 'Choose a start time from the slot list', { startTime: 'Choose a slot' });
  return slot.endTime;
}

export function bookAppointment(customer: User, branchId: unknown, serviceId: unknown, date: unknown, startTime: unknown): AppointmentView {
  const db = readDb<Db>();
  const { branch, service, day } = bookableContext(db, branchId, serviceId, date);
  const endTime = assertOnSlotGrid(branch, service, startTime);
  const start = startTime as string;
  if (Date.parse(combineDateTime(day, start)) < Date.parse(appNowIso(db))) {
    return fail(400, 'PAST_DATE', 'Appointments cannot be booked in the past');
  }
  if (hasOverlappingAppointment(db.appointments, customer.id, day, start, endTime)) {
    return fail(409, 'DUPLICATE_APPOINTMENT', 'You already have an appointment at this time');
  }
  const counter = findFreeCounter(staffedCounters(db, branch), appointmentsOn(db, branch.id, day), start, endTime);
  if (counter === null) return fail(409, 'SLOT_UNAVAILABLE', 'This slot is no longer available');
  const appointment: Appointment = {
    id: nextEntityId('appt', db.appointments.map((a) => a.id)),
    customerId: customer.id,
    branchId: branch.id,
    serviceId: service.id,
    date: day,
    startTime: start,
    endTime,
    counterNumber: counter,
    staffId: db.users.find((u) => u.role === 'staff' && u.branchId === branch.id && u.counterNumber === counter)?.id ?? null,
    status: 'scheduled',
    ticketId: null,
    createdAt: appNowIso(db),
  };
  db.appointments.push(appointment);
  writeDb(db);
  return toAppointmentView(db, appointment);
}

export function listCustomerAppointments(customer: User): AppointmentView[] {
  const db = readDb<Db>();
  return db.appointments
    .filter((a) => a.customerId === customer.id)
    .sort(newestFirst)
    .map((a) => toAppointmentView(db, a));
}

export function cancelAppointment(customer: User, appointmentId: string): AppointmentView {
  const db = readDb<Db>();
  const appointment = db.appointments.find((a) => a.id === appointmentId);
  if (!appointment) return fail(404, 'NOT_FOUND', 'Appointment not found');
  if (appointment.customerId !== customer.id) return fail(403, 'FORBIDDEN', 'You can only cancel your own appointments');
  if (appointment.status !== 'scheduled') {
    return fail(409, 'INVALID_TRANSITION', `A ${appointment.status} appointment cannot be cancelled`);
  }
  appointment.status = 'cancelled';
  writeDb(db);
  return toAppointmentView(db, appointment);
}
