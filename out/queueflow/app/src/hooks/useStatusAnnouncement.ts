import { useEffect, useRef, useState } from 'react';
import { TICKET_STATUS_LABELS } from '../../shared/labels';
import type { TicketView } from '../../shared/types';

export function useStatusAnnouncement(tickets: TicketView[] | null): string {
  const [announcement, setAnnouncement] = useState('');
  const previous = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!tickets) return;
    const current = new Map(tickets.map((t) => [t.id, t.status]));
    const before = previous.current;
    previous.current = current;
    if (!before) return;
    const changed = tickets.filter((t) => before.has(t.id) && before.get(t.id) !== t.status);
    if (changed.length === 0) return;
    setAnnouncement(changed.map((t) => `Ticket ${t.ticketNumber} is now ${TICKET_STATUS_LABELS[t.status]}`).join('. '));
  }, [tickets]);

  return announcement;
}
