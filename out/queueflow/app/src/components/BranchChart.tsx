import { formatAverage } from '../../shared/labels';
import type { BranchStats } from '../../shared/types';
import { BarRow } from './BarRow';
import { ChartTable } from './ChartTable';

interface BranchChartProps {
  branches: BranchStats[];
}

export function BranchChart({ branches }: BranchChartProps) {
  const max = Math.max(1, ...branches.flatMap((b) => [b.completed, b.waiting, b.cancelled]));
  const description = branches
    .map((b) => `${b.branchName}: completed ${b.completed}, waiting ${b.waiting}, cancelled ${b.cancelled}`)
    .join('; ');
  return (
    <section className="card" aria-labelledby="branch-chart-heading">
      <h2 id="branch-chart-heading" className="card-title">
        Branch comparison
      </h2>
      <div className="chart" role="img" aria-label={`Branch comparison. ${description}`} data-testid="chart-branches">
        {branches.map((b) => (
          <div key={b.branchId} className="branch-group">
            <h3 className="branch-group-title">{b.branchName}</h3>
            <BarRow label="✓ Completed" value={b.completed} max={max} tone="completed" />
            <BarRow label="◔ Waiting" value={b.waiting} max={max} tone="waiting" />
            <BarRow label="✕ Cancelled" value={b.cancelled} max={max} tone="cancelled" />
            <p className="muted">
              Avg wait {formatAverage(b.avgWaitMinutes)} · Avg service {formatAverage(b.avgServiceMinutes)}
            </p>
          </div>
        ))}
      </div>
      <ChartTable summary="Show data table">
        <table className="chart-table" data-testid="branch-compare-table">
          <thead>
            <tr>
              <th scope="col">Branch</th>
              <th scope="col">Completed</th>
              <th scope="col">Waiting</th>
              <th scope="col">Cancelled</th>
              <th scope="col">Avg wait</th>
              <th scope="col">Avg service</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.branchId} data-testid="branch-compare-row" data-id={b.branchId}>
                <th scope="row">{b.branchName}</th>
                <td data-testid="compare-completed">{b.completed}</td>
                <td data-testid="compare-waiting">{b.waiting}</td>
                <td data-testid="compare-cancelled">{b.cancelled}</td>
                <td data-testid="compare-avg-wait">{formatAverage(b.avgWaitMinutes)}</td>
                <td data-testid="compare-avg-service">{formatAverage(b.avgServiceMinutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartTable>
    </section>
  );
}
