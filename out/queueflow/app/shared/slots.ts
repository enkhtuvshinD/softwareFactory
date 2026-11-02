import { combineDateTime, minutesToTime, timeToMinutes } from './time';
import type { Appointment, Slot } from './types';

export const SLOT_STEP_MINUTES = 30;

export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export function generateSlotTimes(openTime: string, closeTime: string, durationMinutes: number) {
  const slots: { startTime: string; endTime: string }[] = [];
  const close = timeToMinutes(closeTime);
  for (let start = timeToMinutes(openTime); start + durationMinutes <= close; start += SLOT_STEP_MINUTES) {
    slots.push({ startTime: minutesToTime(start), endTime: minutesToTime(start + durationMinutes) });
  }
  return slots;
}

export function findFreeCounter(
  staffedCounters: number[],
  appointments: Appointment[],
  startTime: string,
  endTime: string,
): number | null {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const free = [...staffedCounters]
    .sort((a, b) => a - b)
    .find(
      (counter) =>
        !appointments.some(
          (a) =>
            a.status === 'scheduled' &&
            a.counterNumber === counter &&
            intervalsOverlap(start, end, timeToMinutes(a.startTime), timeToMinutes(a.endTime)),
        ),
    );
  return free ?? null;
}

export function hasOverlappingAppointment(
  appointments: Appointment[],
  customerId: string,
  date: string,
  startTime: string,
  endTime: string,
): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return appointments.some(
    (a) =>
      a.status === 'scheduled' &&
      a.customerId === customerId &&
      a.date === date &&
      intervalsOverlap(start, end, timeToMinutes(a.startTime), timeToMinutes(a.endTime)),
  );
}

export function buildSlots(
  openTime: string,
  closeTime: string,
  durationMinutes: number,
  date: string,
  nowIso: string,
  staffedCounters: number[],
  dayAppointments: Appointment[],
): Slot[] {
  return generateSlotTimes(openTime, closeTime, durationMinutes)
    .filter((slot) => Date.parse(combineDateTime(date, slot.startTime)) >= Date.parse(nowIso))
    .map((slot) => ({
      ...slot,
      available: findFreeCounter(staffedCounters, dayAppointments, slot.startTime, slot.endTime) !== null,
    }));
}
