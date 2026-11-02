import { useState } from 'react';
import { api } from '../api/client';
import { formatAverage, formatCounter } from '../../shared/labels';
import { deriveStaffActions } from '../../shared/staffActions';
import type { TicketView } from '../../shared/types';
import { AsyncView } from '../components/AsyncView';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CurrentCustomerCard } from '../components/CurrentCustomerCard';
import { FormError } from '../components/FormError';
import { StatCard } from '../components/StatCard';
import { WaitingList } from '../components/WaitingList';
import { useAction } from '../hooks/useAction';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../hooks/useToast';

type TicketAction = 'start' | 'complete' | 'no-show' | 'cancel';

export function StaffDeskPage() {
  const state = usePolling(api.staffDashboard);
  const [cancelling, setCancelling] = useState<TicketView | null>(null);
  const action = useAction();
  const showToast = useToast();

  async function perform(task: () => Promise<TicketView>, message: string) {
    const result = await action.run(task);
    if (result) showToast(message);
    await state.reload();
    return result;
  }

  async function confirmCancel() {
    if (!cancelling) return;
    const target = cancelling;
    await perform(() => api.ticketAction(target.id, 'cancel'), `Ticket ${target.ticketNumber} cancelled`);
    setCancelling(null);
  }

  return (
    <>
      <h1 className="page-title">Queue Desk</h1>
      <AsyncView state={state} label="queue desk">
        {(dashboard) => {
          const hasCounter = dashboard.counterNumber !== null;
          const actions = deriveStaffActions(hasCounter, dashboard.current?.status ?? null, dashboard.waitingCount);
          const current = dashboard.current;
          const act = (name: TicketAction, label: string) =>
            current ? perform(() => api.ticketAction(current.id, name), label) : undefined;
          return (
            <>
              <div className="strip">
                <span className="strip-item" data-testid="staff-branch">
                  {dashboard.branchName}
                </span>
                <span className="strip-item" data-testid="staff-counter">
                  {formatCounter(dashboard.counterNumber)}
                </span>
              </div>
              {!hasCounter && (
                <div className="form-error" role="alert">
                  <span aria-hidden="true">⚠</span> No counter assigned — ask an admin.
                </div>
              )}
              <div className="grid-4">
                <StatCard label="Waiting at branch" value={dashboard.waitingCount} testId="staff-waiting-count" />
                <StatCard label="Next customer" value={dashboard.next?.ticketNumber ?? '—'} testId="staff-next" />
                <StatCard label="Completed today" value={dashboard.completedToday} testId="staff-completed-today" />
                <StatCard label="Avg service time" value={formatAverage(dashboard.avgServiceMinutes)} testId="staff-avg-duration" />
              </div>
              <div className="desk-layout">
                <section className="card" aria-labelledby="current-heading">
                  <h2 id="current-heading" className="card-title">
                    Current customer
                  </h2>
                  <FormError message={action.error?.message} />
                  <CurrentCustomerCard ticket={current} />
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-testid="btn-call-next"
                      disabled={!actions.callNext || action.busy}
                      onClick={() => void perform(api.callNext, 'Customer called')}
                    >
                      {action.busy ? '…' : 'Call Next'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-testid="btn-start"
                      disabled={!actions.start || action.busy}
                      onClick={() => void act('start', 'Service started')}
                    >
                      Start Service
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-testid="btn-complete"
                      disabled={!actions.complete || action.busy}
                      onClick={() => void act('complete', 'Service completed')}
                    >
                      Complete Service
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-testid="btn-no-show"
                      disabled={!actions.noShow || action.busy}
                      onClick={() => void act('no-show', 'Marked as no-show')}
                    >
                      No-Show
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      data-testid="btn-cancel"
                      disabled={!actions.cancel || action.busy}
                      onClick={() => current && setCancelling(current)}
                    >
                      Cancel Ticket
                    </button>
                  </div>
                  {actions.reason && (
                    <p className="muted action-reason" data-testid="action-reason">
                      {actions.reason}
                    </p>
                  )}
                </section>
                <section className="card" aria-labelledby="waiting-heading">
                  <h2 id="waiting-heading" className="card-title">
                    Waiting queue
                  </h2>
                  <WaitingList tickets={dashboard.waiting} onCancel={setCancelling} />
                </section>
              </div>
            </>
          );
        }}
      </AsyncView>
      {cancelling && (
        <ConfirmDialog
          title="Cancel this ticket?"
          message={`Ticket ${cancelling.ticketNumber} for ${cancelling.customerName} will be cancelled.`}
          busy={action.busy}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setCancelling(null)}
        />
      )}
    </>
  );
}
