import { describe, expect, it } from 'vitest';
import seed from '../server/data/seed.json';
import { buildSlots, findFreeCounter, generateSlotTimes, hasOverlappingAppointment, intervalsOverlap } from './slots';
import type { Appointment, Db } from './types';

const db = seed as unknown as Db;
const NOW = '2026-11-01T10:00:00.000Z';

function appointment(overrides: Partial<Appointment>): Appointment {
  return { ...db.appointments[0], ...overrides };
}

describe('slot generation', () => {
  it('lists 30 minute starts whose service ends before closing', () => {
    const slots = generateSlotTimes('09:00', '10:30', 20);
    expect(slots.map((s) => s.startTime)).toEqual(['09:00', '09:30', '10:00']);
    expect(slots[2].endTime).toBe('10:20');
  });

  it('drops the last start when the service would run past closing', () => {
    expect(generateSlotTimes('09:00', '10:00', 45).map((s) => s.startTime)).toEqual(['09:00']);
  });
});

describe('overlap detection', () => {
  it('treats touching intervals as free', () => {
    expect(intervalsOverlap(900, 920, 920, 940)).toBe(false);
    expect(intervalsOverlap(900, 920, 910, 930)).toBe(true);
  });

  it('blocks the Downtown 15:00 slot but not 15:30 after the seeded support appointment', () => {
    const [seeded] = db.appointments.filter((a) => a.id === 'appt_002');
    expect(findFreeCounter([1], [seeded], '15:00', '15:15')).toBeNull();
    expect(findFreeCounter([1], [seeded], '15:30', '15:45')).toBe(1);
  });
});

describe('counter assignment', () => {
  const docs = appointment({ id: 'appt_x', date: '2026-11-02', startTime: '11:00', endTime: '11:10', counterNumber: 1 });

  it('assigns the lowest free counter and then reports the slot full', () => {
    expect(findFreeCounter([1, 2], [docs], '11:00', '11:10')).toBe(2);
    const second = appointment({ ...docs, id: 'appt_y', counterNumber: 2 });
    expect(findFreeCounter([1, 2], [docs, second], '11:00', '11:10')).toBeNull();
  });

  it('ignores cancelled appointments', () => {
    const cancelled = appointment({ ...docs, status: 'cancelled' });
    expect(findFreeCounter([1], [cancelled], '11:00', '11:10')).toBe(1);
  });

  it('detects a customer holding an overlapping scheduled appointment', () => {
    expect(hasOverlappingAppointment([docs], docs.customerId, '2026-11-02', '11:05', '11:15')).toBe(true);
    expect(hasOverlappingAppointment([docs], docs.customerId, '2026-11-02', '11:10', '11:20')).toBe(false);
  });
});

describe('slot list', () => {
  it('omits past slots and marks full slots unavailable', () => {
    const [seeded] = db.appointments.filter((a) => a.id === 'appt_002');
    const slots = buildSlots('09:00', '17:00', 15, '2026-11-01', NOW, [1], [seeded]);
    expect(slots[0].startTime).toBe('10:00');
    expect(slots.find((s) => s.startTime === '15:00')?.available).toBe(false);
    expect(slots.find((s) => s.startTime === '15:30')?.available).toBe(true);
  });

  it('has no available slots when no counter has staff', () => {
    const slots = buildSlots('09:00', '10:00', 15, '2026-11-02', NOW, [], []);
    expect(slots.every((s) => !s.available)).toBe(true);
  });
});
