import { readDb, writeDb } from '../db';
import { addMinutesToIso, isoToDate } from '../../shared/time';
import type { ClockView, Db } from '../../shared/types';

const MIN_ADVANCE_MINUTES = 1;
const MAX_ADVANCE_MINUTES = 480;

export function ensureClockStarted() {
  const db = readDb<Db>();
  if (db.clock.realStartMs !== undefined) return;
  db.clock.realStartMs = Date.now();
  writeDb(db);
}

export function appNowIso(db: Db): string {
  const elapsedMs = Date.now() - (db.clock.realStartMs ?? Date.now());
  const elapsedMinutes = elapsedMs / 60000;
  return addMinutesToIso(db.clock.anchorIso, elapsedMinutes + (db.clock.advancedMinutes ?? 0));
}

export function currentClock(db: Db): ClockView {
  const now = appNowIso(db);
  return { now, businessDate: isoToDate(now) };
}

export function isValidAdvance(minutes: unknown): minutes is number {
  return (
    typeof minutes === 'number' &&
    Number.isInteger(minutes) &&
    minutes >= MIN_ADVANCE_MINUTES &&
    minutes <= MAX_ADVANCE_MINUTES
  );
}

export function advanceClock(minutes: number): ClockView {
  const db = readDb<Db>();
  db.clock.advancedMinutes = (db.clock.advancedMinutes ?? 0) + minutes;
  writeDb(db);
  return currentClock(db);
}

export function resetClock(): ClockView {
  const db = readDb<Db>();
  db.clock.advancedMinutes = 0;
  db.clock.realStartMs = Date.now();
  writeDb(db);
  return currentClock(db);
}
