import type { TicketView } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

interface CurrentCustomerCardProps {
  ticket: TicketView | null;
}

export function CurrentCustomerCard({ ticket }: CurrentCustomerCardProps) {
  if (!ticket) {
    return (
      <p className="muted" data-testid="current-empty">
        No customer at your counter
      </p>
    );
  }
  return (
    <div className="current-ticket" data-testid="staff-current" data-id={ticket.id}>
      <p className="ticket-number big" data-testid="current-ticket-number">
        {ticket.ticketNumber}
      </p>
      <StatusBadge status={ticket.status} testId="current-status" />
      <p>
        <span data-testid="current-customer">{ticket.customerName}</span> ·{' '}
        <span data-testid="current-service">{ticket.serviceName}</span>
      </p>
    </div>
  );
}
