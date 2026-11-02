import { describe, expect, it } from 'vitest';
import seed from '../server/data/seed.json';
import { averageServiceMinutes, averageWaitMinutes, roundHalfUp, summarizeTickets } from './stats';
import type { Db } from './types';

const db = seed as unknown as Db;

describe('rounding', () => {
  it('rounds halves up to one decimal', () => {
    expect(roundHalfUp(12.75)).toBe(12.8);
    expect(roundHalfUp(13.8333)).toBe(13.8);
  });
});

describe('seed day statistics', () => {
  const summary = summarizeTickets(db.tickets, '2026-11-01');

  it('counts tickets by status', () => {
    expect(summary).toMatchObject({ total: 11, waiting: 3, called: 0, serving: 3, completed: 3, cancelled: 1, noShow: 1 });
  });

  it('computes overall averages', () => {
    expect(summary.avgWaitMinutes).toBe(13.8);
    expect(summary.avgServiceMinutes).toBe(11.3);
  });

  it('computes per-branch averages', () => {
    const central = db.tickets.filter((t) => t.branchId === 'br_central');
    const downtown = db.tickets.filter((t) => t.branchId === 'br_downtown');
    expect([averageWaitMinutes(central), averageServiceMinutes(central)]).toEqual([12.8, 11]);
    expect([averageWaitMinutes(downtown), averageServiceMinutes(downtown)]).toEqual([16, 12]);
  });

  it('computes per-staff averages', () => {
    const sarah = db.tickets.filter((t) => t.staffId === 'usr_301');
    expect(averageServiceMinutes(sarah)).toBe(13);
  });

  it('returns null averages and zero counts for a day without tickets', () => {
    expect(summarizeTickets(db.tickets, '2026-11-02')).toMatchObject({ total: 0, avgWaitMinutes: null, avgServiceMinutes: null });
  });
});
