import { TICKET_STATUS_ICONS, TICKET_STATUS_LABELS } from '../../shared/labels';
import type { TicketStatus, TicketSummary } from '../../shared/types';
import { BarRow } from './BarRow';
import { ChartTable } from './ChartTable';

interface StatusChartProps {
  summary: TicketSummary;
}

const STATUS_COUNT_KEYS: Record<TicketStatus, keyof TicketSummary> = {
  waiting: 'waiting',
  called: 'called',
  serving: 'serving',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'noShow',
};

const STATUS_ORDER: TicketStatus[] = ['waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show'];

export function StatusChart({ summary }: StatusChartProps) {
  const rows = STATUS_ORDER.map((status) => ({
    status,
    label: `${TICKET_STATUS_ICONS[status]} ${TICKET_STATUS_LABELS[status]}`,
    count: summary[STATUS_COUNT_KEYS[status]] as number,
  }));
  const max = Math.max(...rows.map((r) => r.count));
  const description = rows.map((r) => `${TICKET_STATUS_LABELS[r.status]} ${r.count}`).join(', ');
  return (
    <section className="card" aria-labelledby="status-chart-heading">
      <h2 id="status-chart-heading" className="card-title">
        Tickets by status
      </h2>
      <div className="chart" role="img" aria-label={`Tickets by status: ${description}`} data-testid="chart-status">
        {rows.map((r) => (
          <BarRow key={r.status} label={r.label} value={r.count} max={max} tone={r.status.replace('_', '-')} />
        ))}
      </div>
      <ChartTable summary="Show data table">
        <table className="chart-table" data-testid="chart-status-table">
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.status} data-testid="status-row" data-id={r.status}>
                <td>{TICKET_STATUS_LABELS[r.status]}</td>
                <td data-testid="status-row-count">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartTable>
    </section>
  );
}
