import { describe, expect, it } from 'vitest';
import seed from '../server/data/seed.json';
import { compareFifo, computeQueueEstimate, formatTicketNumber, nextSequence, nextStatus, waitingTickets } from './queue';
import type { Db, Ticket } from './types';

const db = seed as unknown as Db;

function ticketById(id: string): Ticket {
  const found = db.tickets.find((t) => t.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe('ticket numbering', () => {
  it('pads the sequence to three digits', () => {
    expect(formatTicketNumber('CEN', 'DV', 1)).toBe('CEN-DV-001');
  });

  it('continues after the highest sequence including cancelled tickets', () => {
    expect(nextSequence(db.tickets, 'br_central', 'svc_general', '2026-11-01')).toBe(5);
  });

  it('starts at 1 for a new business date', () => {
    expect(nextSequence(db.tickets, 'br_central', 'svc_docs', '2026-11-02')).toBe(1);
  });
});

describe('FIFO queue', () => {
  it('orders waiting tickets of a branch across services by creation time', () => {
    expect(waitingTickets(db.tickets, 'br_central').map((t) => t.ticketNumber)).toEqual(['CEN-GC-003', 'CEN-DV-002']);
  });

  it('breaks creation-time ties by ticket id', () => {
    const a = { ...ticketById('tkt_005'), id: 'tkt_020' };
    const b = { ...ticketById('tkt_005'), id: 'tkt_003' };
    expect([a, b].sort(compareFifo).map((t) => t.id)).toEqual(['tkt_003', 'tkt_020']);
  });
});

describe('position and estimated wait', () => {
  it('matches the seed worked example', () => {
    expect(computeQueueEstimate(ticketById('tkt_005'), db.tickets, db.services)).toEqual({
      position: 1,
      estimatedWaitMinutes: 0,
    });
    expect(computeQueueEstimate(ticketById('tkt_007'), db.tickets, db.services)).toEqual({
      position: 2,
      estimatedWaitMinutes: 15,
    });
  });

  it('adds new tickets behind existing ones using the service durations ahead', () => {
    const newest: Ticket = {
      ...ticketById('tkt_005'),
      id: 'tkt_012',
      serviceId: 'svc_support',
      createdAt: '2026-11-01T10:05:00Z',
    };
    expect(computeQueueEstimate(newest, [...db.tickets, newest], db.services)).toEqual({
      position: 3,
      estimatedWaitMinutes: 25,
    });
  });

  it('moves the queue up once the first ticket is called', () => {
    const afterCall = db.tickets.map((t) => (t.id === 'tkt_005' ? { ...t, status: 'called' as const } : t));
    expect(computeQueueEstimate(ticketById('tkt_007'), afterCall, db.services)).toEqual({
      position: 1,
      estimatedWaitMinutes: 0,
    });
  });

  it('has no position for tickets that are not waiting', () => {
    expect(computeQueueEstimate(ticketById('tkt_003'), db.tickets, db.services).position).toBeNull();
  });
});

describe('status transitions', () => {
  it('allows the documented transitions', () => {
    expect(nextStatus('waiting', 'call')).toBe('called');
    expect(nextStatus('called', 'start')).toBe('serving');
    expect(nextStatus('serving', 'complete')).toBe('completed');
    expect(nextStatus('called', 'no_show')).toBe('no_show');
    expect(nextStatus('serving', 'cancel')).toBe('cancelled');
  });

  it('rejects invalid transitions', () => {
    expect(nextStatus('waiting', 'start')).toBeNull();
    expect(nextStatus('called', 'complete')).toBeNull();
    expect(nextStatus('serving', 'no_show')).toBeNull();
    expect(nextStatus('completed', 'cancel')).toBeNull();
  });
});
