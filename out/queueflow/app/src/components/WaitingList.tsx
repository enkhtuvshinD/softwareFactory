import type { TicketView } from '../../shared/types';

interface WaitingListProps {
  tickets: TicketView[];
  onCancel: (ticket: TicketView) => void;
}

export function WaitingList({ tickets, onCancel }: WaitingListProps) {
  if (tickets.length === 0) {
    return (
      <p className="muted" data-testid="waiting-empty">
        No waiting customers
      </p>
    );
  }
  return (
    <ul className="waiting-list">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="waiting-row" data-testid="waiting-row" data-id={ticket.id} data-number={ticket.ticketNumber}>
          <span className="ticket-number" data-testid="waiting-number">
            {ticket.ticketNumber}
          </span>
          <span className="chip" data-testid="waiting-service">
            {ticket.serviceName}
          </span>
          <span className="waiting-customer" data-testid="waiting-customer">
            {ticket.customerName}
          </span>
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            data-testid="waiting-cancel"
            aria-label={`Cancel ${ticket.ticketNumber}`}
            onClick={() => onCancel(ticket)}
          >
            Cancel
          </button>
        </li>
      ))}
    </ul>
  );
}
