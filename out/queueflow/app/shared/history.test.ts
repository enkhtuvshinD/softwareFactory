import { describe, expect, it } from 'vitest';
import seed from '../server/data/seed.json';
import { buildHistory } from './history';
import type { AppointmentView, Db, TicketView } from './types';

const db = seed as unknown as Db;

function asTicketView(id: string): TicketView {
  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) throw new Error(`missing ${id}`);
  return { ...ticket, position: null, estimatedWaitMinutes: null, branchName: 'Central Branch', serviceName: 'Service', staffName: null };
}

describe('customer history', () => {
  const appointment: AppointmentView = {
    ...db.appointments[0],
    status: 'cancelled',
    branchName: 'Central Branch',
    serviceName: 'Document Verification',
  };

  it('keeps finished tickets and non-scheduled appointments only, newest first', () => {
    const history = buildHistory([asTicketView('tkt_001'), asTicketView('tkt_005')], [appointment, { ...appointment, id: 'appt_x', status: 'scheduled' }]);
    expect(history.map((h) => h.id)).toEqual(['appt_001', 'tkt_001']);
  });

  it('labels tickets by number and appointments without one', () => {
    const [first, second] = buildHistory([asTicketView('tkt_001')], [appointment]);
    expect(first.ticketNumber).toBeNull();
    expect(second.ticketNumber).toBe('CEN-GC-001');
  });
});
