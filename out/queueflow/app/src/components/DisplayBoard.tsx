import { TICKET_STATUS_ICONS, TICKET_STATUS_LABELS, formatCounter } from '../../shared/labels';
import type { DisplayView } from '../../shared/types';

interface DisplayBoardProps {
  view: DisplayView;
}

export function DisplayBoard({ view }: DisplayBoardProps) {
  return (
    <div className="display-grid">
      <section aria-labelledby="calling-heading" className="display-calling">
        <h2 id="calling-heading" className="display-heading">
          Now calling
        </h2>
        {view.nowCalling.length === 0 ? (
          <p className="display-empty" data-testid="display-empty-calling">
            No one is being called
          </p>
        ) : (
          <div className="display-tiles">
            {view.nowCalling.map((ticket) => (
              <div key={ticket.id} className="display-tile" data-testid="now-calling-item" data-id={ticket.id}>
                <p className="display-number" data-testid="display-ticket-number">
                  {ticket.ticketNumber}
                </p>
                <p className="display-counter" data-testid="display-counter">
                  {formatCounter(ticket.counterNumber)}
                </p>
                <p className="display-status" data-testid="display-status">
                  <span aria-hidden="true">{TICKET_STATUS_ICONS[ticket.status]}</span> {TICKET_STATUS_LABELS[ticket.status]}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <section aria-labelledby="next-heading" className="display-next">
        <h2 id="next-heading" className="display-heading">
          Up next
        </h2>
        {view.upNext.length === 0 ? (
          <p className="display-empty" data-testid="display-empty-next">
            No waiting tickets
          </p>
        ) : (
          <ol className="display-next-list">
            {view.upNext.map((ticket) => (
              <li key={ticket.id} className="display-next-item" data-testid="up-next-item" data-id={ticket.id}>
                <span data-testid="display-next-number">{ticket.ticketNumber}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
