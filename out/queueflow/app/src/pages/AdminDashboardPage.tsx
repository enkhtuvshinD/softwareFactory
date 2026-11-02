import { api } from '../api/client';
import { formatAverage } from '../../shared/labels';
import { AsyncView } from '../components/AsyncView';
import { BranchChart } from '../components/BranchChart';
import { ClockControls } from '../components/ClockControls';
import { StatCard } from '../components/StatCard';
import { StatusChart } from '../components/StatusChart';
import { usePolling } from '../hooks/usePolling';

function loadDashboard() {
  return Promise.all([api.adminStats(), api.clock()]).then(([stats, clock]) => ({ stats, clock }));
}

export function AdminDashboardPage() {
  const state = usePolling(loadDashboard);
  return (
    <>
      <h1 className="page-title">Operations today</h1>
      <ClockControls clock={state.data?.clock ?? null} onChanged={() => void state.reload()} />
      <AsyncView state={state} label="statistics">
        {({ stats }) => {
          const { overall } = stats;
          return (
            <>
              <div className="grid-stats">
                <StatCard label="Total customers today" value={overall.total} testId="stat-total" />
                <StatCard label="Waiting" value={overall.waiting} testId="stat-waiting" />
                <StatCard label="Called" value={overall.called} testId="stat-called" />
                <StatCard label="Being served" value={overall.serving} testId="stat-serving" />
                <StatCard label="Completed" value={overall.completed} testId="stat-completed" />
                <StatCard label="Cancelled" value={overall.cancelled} testId="stat-cancelled" />
                <StatCard label="No-Show" value={overall.noShow} testId="stat-no-show" />
                <StatCard label="Avg waiting time" value={formatAverage(overall.avgWaitMinutes)} testId="stat-avg-wait" />
                <StatCard label="Avg service duration" value={formatAverage(overall.avgServiceMinutes)} testId="stat-avg-service" />
              </div>
              <div className="grid-2">
                <StatusChart summary={overall} />
                <BranchChart branches={stats.branches} />
              </div>
            </>
          );
        }}
      </AsyncView>
    </>
  );
}
